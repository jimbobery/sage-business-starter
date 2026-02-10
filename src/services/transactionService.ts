import { apiClient, apiRequest } from '@/lib/apiClient';
import { 
  BankTransaction, 
  CsvUploadResult, 
  Credentials, 
  ParsedCsvTransaction,
  SageTransactionRequest,
  SageTransactionDimension,
  RequiredDimension
} from '@/types/sage';
import { generateIdempotencyKey } from '@/lib/idempotency';

// Journal IDs for payments and receipts as per Sage API
const PAYMENT_JOURNAL_ID = '7078df86-3c36-f139-1b3a-390d1197b0f8';
const RECEIPT_JOURNAL_ID = 'd6be52be-4361-1dc6-21f4-f895bba7ed5a';

export interface CreateTransactionResponse {
  Id?: string;
  id?: string;
}

export const transactionService = {
  /**
   * Build the Dimensions array for a transaction request
   */
  buildDimensions(
    dimensionSelections: Record<string, string>,
    requiredDimensions: RequiredDimension[]
  ): SageTransactionDimension[] {
    return requiredDimensions
      .filter(dim => dimensionSelections[dim.code])
      .map(dim => {
        const tagCode = dimensionSelections[dim.code];
        const isAllowability = dim.name.toLowerCase().includes('allowability') || 
                               dim.code.toLowerCase().includes('allowability');

        const dimension: SageTransactionDimension = {
          Dimension: {
            Id: dim.code,
            ...(isAllowability ? { AllocationType: 'Percentage' } : {}),
          },
          DimensionTags: [
            {
              Id: tagCode,
              ...(isAllowability ? { Percentage: 100 } : {}),
            },
          ],
        };

        return dimension;
      });
  },

  /**
   * Create a single transaction (payment or receipt) with the correct Sage payload
   */
  async createTransaction(
    tenantId: string,
    bankAccountId: string,
    tx: ParsedCsvTransaction,
    requiredDimensions: RequiredDimension[],
    credentials: Credentials
  ): Promise<CreateTransactionResponse> {
    const journalId = tx.type === 'payment' ? PAYMENT_JOURNAL_ID : RECEIPT_JOURNAL_ID;
    const treatAs = tx.type === 'receipt' ? 'Debit' : 'Credit';
    
    const dimensions = this.buildDimensions(tx.dimensionSelections, requiredDimensions);

    const requestData: SageTransactionRequest = {
      Date: tx.date,
      Reference: tx.reference,
      BankAccount: {
        Id: bankAccountId,
      },
      Items: [
        {
          Order: 0,
          Date: tx.date,
          AmountType: 'TaxesExcluded',
          Amount: tx.amount,
          TreatAs: treatAs,
          Dimensions: dimensions,
        },
      ],
    };

    const idempotencyKey = generateIdempotencyKey();
    const response = await apiRequest<CreateTransactionResponse>(
      {
        method: 'POST',
        endpoint: `/transaction/v2/tenant/${tenantId}/journals/${journalId}`,
        body: requestData,
        tokenType: 'tenant',
        featureArea: 'transactions',
        tenantId,
        idempotencyKey,
      },
      credentials
    );

    // Handle 202 async processing
    if (response.status === 202) {
      const retryAfter = parseInt(response.headers['retry-after'] || '2', 10);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

      const followUp = await apiRequest<CreateTransactionResponse>(
        {
          method: 'POST',
          endpoint: `/transaction/v2/tenant/${tenantId}/journals/${journalId}`,
          body: requestData,
          tokenType: 'tenant',
          featureArea: 'transactions',
          tenantId,
          idempotencyKey,
        },
        credentials
      );

      if (!followUp.success) {
        throw new Error(followUp.error || `Follow-up failed: ${followUp.status}`);
      }
      return followUp.data!;
    }

    if (!response.success) {
      throw new Error(response.error || `Request failed: ${response.status}`);
    }
    return response.data!;
  },

  /**
   * Upload parsed CSV transactions with dimension selections
   */
  async uploadTransactions(
    tenantId: string,
    bankAccountId: string,
    transactions: ParsedCsvTransaction[],
    requiredDimensions: RequiredDimension[],
    credentials: Credentials
  ): Promise<CsvUploadResult[]> {
    const results: CsvUploadResult[] = [];

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      try {
        const response = await this.createTransaction(
          tenantId,
          bankAccountId,
          tx,
          requiredDimensions,
          credentials
        );

        results.push({
          row: tx.rowIndex,
          success: true,
          status: 201,
          data: {
            id: response.Id || response.id || '',
            tenantId,
            bankAccountId,
            type: tx.type,
            date: tx.date,
            description: tx.description,
            reference: tx.reference,
            amount: tx.amount,
            category: tx.category || 'Uncategorized',
          },
        });
      } catch (error: any) {
        results.push({
          row: tx.rowIndex,
          success: false,
          status: error.status || 500,
          message: error.message || 'Unknown error',
        });
      }
    }

    return results;
  },
};
