import { apiClient } from '@/lib/apiClient';
import { BankTransaction, SageBankPaymentRequest, SageBankReceiptRequest, CsvUploadResult } from '@/types/sage';

const TENANT_API_BASE = 'https://api.sandbox.sbc.sage.com/v1';

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
   * Create a bank payment
   */
  async createPayment(
    tenantId: string,
    data: SageBankPaymentRequest
  ): Promise<CreateTransactionResponse> {
    const response = await apiClient.post<CreateTransactionResponse>(
      `${TENANT_API_BASE}/bank_payments`,
      data,
      { 
        tokenType: 'tenant', 
        featureArea: 'transactions',
        tenantId 
      }
    );

    return response;
  },

  /**
   * Create a bank receipt
   */
  async createReceipt(
    tenantId: string,
    data: SageBankReceiptRequest
  ): Promise<CreateTransactionResponse> {
    const response = await apiClient.post<CreateTransactionResponse>(
      `${TENANT_API_BASE}/bank_receipts`,
      data,
      { 
        tokenType: 'tenant', 
        featureArea: 'transactions',
        tenantId 
      }
    );

    return response;
  },

  /**
   * Get all transactions for a tenant
   */
  async getTransactions(tenantId: string): Promise<BankTransaction[]> {
    // Fetch both payments and receipts
    const [payments, receipts] = await Promise.all([
      apiClient.get<{ data: BankTransaction[] }>(
        `${TENANT_API_BASE}/bank_payments`,
        { tokenType: 'tenant', featureArea: 'transactions', tenantId }
      ),
      apiClient.get<{ data: BankTransaction[] }>(
        `${TENANT_API_BASE}/bank_receipts`,
        { tokenType: 'tenant', featureArea: 'transactions', tenantId }
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
   * Upload transactions from CSV data
   * Returns results for each row with success/failure status
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
    }>
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
          response = await this.createPayment(tenantId, requestData);
        } else {
          response = await this.createReceipt(tenantId, requestData);
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
