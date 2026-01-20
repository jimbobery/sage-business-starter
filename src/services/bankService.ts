import { apiClient } from '@/lib/apiClient';
import { BankAccount, SageBankAccountRequest, SageOpeningBalanceRequest, OpeningBalance, Credentials } from '@/types/sage';
import { generateIdempotencyKey } from '@/lib/idempotency';

export interface CreateBankAccountResponse {
  id: string;
  accountName: string;
  accountNumber: string;
  sortCode: string;
  currency: string;
  balance: number;
  createdAt: string;
}

export interface CreateOpeningBalanceResponse {
  id: string;
  bankAccountId: string;
  amount: number;
  date: string;
}

export const bankService = {
  /**
   * Create a new bank account for a tenant
   */
  async createBankAccount(
    tenantId: string,
    data: SageBankAccountRequest,
    credentials: Credentials
  ): Promise<CreateBankAccountResponse> {
    const response = await apiClient.post<CreateBankAccountResponse>(
      '/v1/bank_accounts',
      data,
      { 
        tokenType: 'tenant', 
        featureArea: 'bank-accounts',
        tenantId,
        credentials,
        idempotencyKey: generateIdempotencyKey()
      }
    );

    return response;
  },

  /**
   * Get all bank accounts for a tenant
   */
  async getBankAccounts(tenantId: string, credentials: Credentials): Promise<BankAccount[]> {
    const response = await apiClient.get<{ data: BankAccount[] }>(
      '/v1/bank_accounts',
      { 
        tokenType: 'tenant', 
        featureArea: 'bank-accounts',
        tenantId,
        credentials
      }
    );

    return response.data || [];
  },

  /**
   * Set opening balance for a bank account
   */
  async createOpeningBalance(
    tenantId: string,
    data: SageOpeningBalanceRequest,
    credentials: Credentials
  ): Promise<CreateOpeningBalanceResponse> {
    const response = await apiClient.post<CreateOpeningBalanceResponse>(
      '/v1/bank_opening_balances',
      data,
      { 
        tokenType: 'tenant', 
        featureArea: 'bank-accounts',
        tenantId,
        credentials,
        idempotencyKey: generateIdempotencyKey()
      }
    );

    return response;
  },

  /**
   * Get opening balances for a tenant
   */
  async getOpeningBalances(tenantId: string, credentials: Credentials): Promise<OpeningBalance[]> {
    const response = await apiClient.get<{ data: OpeningBalance[] }>(
      '/v1/bank_opening_balances',
      { 
        tokenType: 'tenant', 
        featureArea: 'bank-accounts',
        tenantId,
        credentials
      }
    );

    return response.data || [];
  },
};
