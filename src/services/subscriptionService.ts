import { apiClient } from '@/lib/apiClient';
import { Tenant, SageTenantRequest, Credentials } from '@/types/sage';
import { getConfig } from '@/lib/configManager';

const SUBSCRIPTIONS_BASE_URL = 'https://api.sandbox.sbc.sage.com/slcsadapter/v2/subscriptions';

export interface CreateTenantResponse {
  id: string;
  name: string;
  businessName: string;
  status: string;
  createdAt: string;
}

export const subscriptionService = {
  /**
   * Create a new tenant via the subscription API
   */
  async createTenant(data: { name: string; businessName: string }, credentials: Credentials): Promise<CreateTenantResponse> {
    const config = await getConfig();
    const creds = config.credentials || credentials;
    
    const requestBody: SageTenantRequest = {
      name: data.name,
      businessName: data.businessName,
      productCode: creds.productCode || 'SAGE_ONE',
      platform: creds.platform || 'UK',
      businessTypeCode: creds.businessTypeCode || 'SOLE_TRADER',
    };

    const response = await apiClient.post<CreateTenantResponse>(
      `${SUBSCRIPTIONS_BASE_URL}/tenants`,
      requestBody,
      { tokenType: 'subscription', featureArea: 'tenants', credentials }
    );

    return response;
  },

  /**
   * Get all tenants from the subscription
   */
  async getTenants(credentials: Credentials): Promise<Tenant[]> {
    const response = await apiClient.get<{ data: Tenant[] }>(
      `${SUBSCRIPTIONS_BASE_URL}/tenants`,
      { tokenType: 'subscription', featureArea: 'tenants', credentials }
    );

    return response.data || [];
  },

  /**
   * Get subscription metadata
   */
  async getSubscription(credentials: Credentials): Promise<{
    productCode: string;
    platform: string;
    businessTypeCodes: string[];
  }> {
    const response = await apiClient.get<{
      productCode: string;
      platform: string;
      businessTypeCodes: string[];
    }>(
      SUBSCRIPTIONS_BASE_URL,
      { tokenType: 'subscription', featureArea: 'tenants', credentials }
    );

    return response;
  },
};
