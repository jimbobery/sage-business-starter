import { apiRequest } from '@/lib/apiClient';
import { BankAccount, SageBankAccountRequest, SageOpeningBalanceRequest, OpeningBalance, Credentials } from '@/types/sage';
import { generateIdempotencyKey } from '@/lib/idempotency';

export type StatusCallback = (status: string) => void;

export interface CreateBankAccountResponse {
  Id: string;
}

export interface CreateOpeningBalanceResponse {
  id: string;
  bankAccountId: string;
  amount: number;
  date: string;
}

function sleep(seconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

export const bankService = {
  /**
   * Create a new bank account for a tenant
   * Handles 202 async responses with retry logic
   * URL: /bank/v2/tenant/{TenantId}/bank-accounts
   */
  async createBankAccount(
    tenantId: string,
    data: SageBankAccountRequest,
    credentials: Credentials,
    onStatusChange?: StatusCallback
  ): Promise<CreateBankAccountResponse> {
    const idempotencyKey = generateIdempotencyKey();
    const endpoint = `/bank/v2/tenant/${tenantId}/bank-accounts`;

    onStatusChange?.('Creating bank account...');

    const response = await apiRequest<CreateBankAccountResponse>(
      {
        method: 'POST',
        endpoint,
        body: data,
        tokenType: 'tenant',
        featureArea: 'bank-accounts',
        tenantId,
        idempotencyKey,
        retries: 0, // We handle retries ourselves for 202
      },
      credentials
    );

    // Handle 202 Accepted - async processing
    if (response.status === 202) {
      const retryAfter = parseInt(response.headers['retry-after'] || '3', 10);

      onStatusChange?.(`Processing... waiting ${retryAfter} seconds`);
      await sleep(retryAfter);

      onStatusChange?.('Checking status...');

      const retryResponse = await apiRequest<CreateBankAccountResponse>(
        {
          method: 'POST',
          endpoint,
          body: data,
          tokenType: 'tenant',
          featureArea: 'bank-accounts',
          tenantId,
          idempotencyKey, // Same key to get the result
          retries: 2,
        },
        credentials
      );

      if (!retryResponse.success || !retryResponse.data) {
        throw new Error(retryResponse.error || 'Failed to get bank account creation result');
      }

      return retryResponse.data;
    }

    // Handle immediate 200/201 success
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to create bank account');
  },

  /**
   * Get all bank accounts for a tenant
   * URL: /bank/v2/tenant/{TenantId}/bank-accounts
   */
  async getBankAccounts(tenantId: string, credentials: Credentials): Promise<BankAccount[]> {
    const response = await apiRequest<{ data: BankAccount[] }>(
      {
        method: 'GET',
        endpoint: `/bank/v2/tenant/${tenantId}/bank-accounts`,
        tokenType: 'tenant',
        featureArea: 'bank-accounts',
        tenantId,
      },
      credentials
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch bank accounts');
    }

    return response.data?.data || [];
  },

  /**
   * Set opening balance for a bank account
   * URL: /bank/v2/tenant/{TenantId}/bank-opening-balances
   */
  async createOpeningBalance(
    tenantId: string,
    data: SageOpeningBalanceRequest,
    credentials: Credentials
  ): Promise<CreateOpeningBalanceResponse> {
    const idempotencyKey = generateIdempotencyKey();
    const response = await apiRequest<CreateOpeningBalanceResponse>(
      {
        method: 'POST',
        endpoint: `/bank/v2/tenant/${tenantId}/bank-opening-balances`,
        body: data,
        tokenType: 'tenant',
        featureArea: 'bank-accounts',
        tenantId,
        idempotencyKey,
      },
      credentials
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create opening balance');
    }

    return response.data;
  },

  /**
   * Get opening balances for a tenant
   * URL: /bank/v2/tenant/{TenantId}/bank-opening-balances
   */
  async getOpeningBalances(tenantId: string, credentials: Credentials): Promise<OpeningBalance[]> {
    const response = await apiRequest<{ data: OpeningBalance[] }>(
      {
        method: 'GET',
        endpoint: `/bank/v2/tenant/${tenantId}/bank-opening-balances`,
        tokenType: 'tenant',
        featureArea: 'bank-accounts',
        tenantId,
      },
      credentials
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch opening balances');
    }

    return response.data?.data || [];
  },
};
