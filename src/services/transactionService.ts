import { apiClient } from '@/lib/apiClient';
import { BankTransaction, SageBankPaymentRequest, SageBankReceiptRequest, CsvUploadResult, Credentials } from '@/types/sage';
import { generateIdempotencyKey } from '@/lib/idempotency';

// Journal IDs for payments and receipts as per Sage API
const PAYMENT_JOURNAL_ID = '7078df86-3c36-f139-1b3a-390d1197b0f8';
const RECEIPT_JOURNAL_ID = 'd6be52be-4361-1dc6-21f4-f895bba7ed5a';

export interface CreateTransactionResponse {
  id: string;
  date: string;
  bankAccountId: string;
  reference: string;
  description: string;
  amount: number;
  category?: string;
}

export const transactionService = {
  /**
   * Create a payment transaction
   * URL: /transaction/v2/tenant/{TenantId}/journals/{PaymentJournalId}
   */
  async createPayment(
    tenantId: string,
    data: SageBankPaymentRequest,
    credentials: Credentials
  ): Promise<CreateTransactionResponse> {
    const response = await apiClient.post<CreateTransactionResponse>(
      `/transaction/v2/tenant/${tenantId}/journals/${PAYMENT_JOURNAL_ID}`,
      data,
      { 
        tokenType: 'tenant', 
        featureArea: 'transactions', 
        tenantId, 
        credentials,
        idempotencyKey: generateIdempotencyKey()
      }
    );
    return response;
  },

  /**
   * Create a receipt transaction
   * URL: /transaction/v2/tenant/{TenantId}/journals/{ReceiptJournalId}
   */
  async createReceipt(
    tenantId: string,
    data: SageBankReceiptRequest,
    credentials: Credentials
  ): Promise<CreateTransactionResponse> {
    const response = await apiClient.post<CreateTransactionResponse>(
      `/transaction/v2/tenant/${tenantId}/journals/${RECEIPT_JOURNAL_ID}`,
      data,
      { 
        tokenType: 'tenant', 
        featureArea: 'transactions', 
        tenantId, 
        credentials,
        idempotencyKey: generateIdempotencyKey()
      }
    );
    return response;
  },

  /**
   * Get all transactions (payments and receipts) for a tenant
   */
  async getTransactions(tenantId: string, credentials: Credentials): Promise<BankTransaction[]> {
    const [payments, receipts] = await Promise.all([
      apiClient.get<{ data: BankTransaction[] }>(
        `/transaction/v2/tenant/${tenantId}/journals/${PAYMENT_JOURNAL_ID}`,
        { tokenType: 'tenant', featureArea: 'transactions', tenantId, credentials }
      ),
      apiClient.get<{ data: BankTransaction[] }>(
        `/transaction/v2/tenant/${tenantId}/journals/${RECEIPT_JOURNAL_ID}`,
        { tokenType: 'tenant', featureArea: 'transactions', tenantId, credentials }
      ),
    ]);

    const allTransactions = [
      ...(payments.data || []).map(t => ({ ...t, type: 'payment' as const })),
      ...(receipts.data || []).map(t => ({ ...t, type: 'receipt' as const })),
    ];

    return allTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  /**
   * Upload transactions from CSV
   */
  async uploadFromCsv(
    tenantId: string,
    bankAccountId: string,
    transactions: Array<{
      type: 'payment' | 'receipt';
      date: string;
      description: string;
      reference: string;
      amount: number;
      category?: string;
    }>,
    credentials: Credentials
  ): Promise<CsvUploadResult[]> {
    const results: CsvUploadResult[] = [];

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      try {
        const requestData = {
          date: tx.date,
          bankAccountId,
          reference: tx.reference,
          description: tx.description,
          amount: tx.amount,
          category: tx.category,
        };

        let response: CreateTransactionResponse;
        if (tx.type === 'payment') {
          response = await this.createPayment(tenantId, requestData, credentials);
        } else {
          response = await this.createReceipt(tenantId, requestData, credentials);
        }

        results.push({
          row: i + 1,
          success: true,
          status: 201,
          data: {
            id: response.id,
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
          row: i + 1,
          success: false,
          status: error.status || 500,
          message: error.message || 'Unknown error',
        });
      }
    }

    return results;
  },
};
