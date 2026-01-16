import { apiClient } from '@/lib/apiClient';
import { BankAccount, SageBankAccountRequest, SageOpeningBalanceRequest, OpeningBalance } from '@/types/sage';

const TENANT_API_BASE = 'https://api.sandbox.sbc.sage.com/v1';

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
    data: SageBankAccountRequest
  ): Promise<CreateBankAccountResponse> {
    const response = await apiClient.post<CreateBankAccountResponse>(
      `${TENANT_API_BASE}/bank_accounts`,
      data,
      { 
        tokenType: 'tenant', 
        featureArea: 'bank-accounts',
        tenantId 
      }
    );

    return response;
  },

  /**
   * Get all bank accounts for a tenant
   */
  async getBankAccounts(tenantId: string): Promise<BankAccount[]> {
    const response = await apiClient.get<{ data: BankAccount[] }>(
      `${TENANT_API_BASE}/bank_accounts`,
      { 
        tokenType: 'tenant', 
        featureArea: 'bank-accounts',
        tenantId 
      }
    );

    return response.data || [];
  },

  /**
   * Set opening balance for a bank account
   */
  async createOpeningBalance(
    tenantId: string,
    data: SageOpeningBalanceRequest
  ): Promise<CreateOpeningBalanceResponse> {
    const response = await apiClient.post<CreateOpeningBalanceResponse>(
      `${TENANT_API_BASE}/bank_opening_balances`,
      data,
      { 
        tokenType: 'tenant', 
        featureArea: 'bank-accounts',
        tenantId 
      }
    );

    return response;
  },

  /**
   * Get opening balances for a tenant
   */
  async getOpeningBalances(tenantId: string): Promise<OpeningBalance[]> {
    const response = await apiClient.get<{ data: OpeningBalance[] }>(
      `${TENANT_API_BASE}/bank_opening_balances`,
      { 
        tokenType: 'tenant', 
        featureArea: 'bank-accounts',
        tenantId 
      }
    );

    return response.data || [];
  },
};
