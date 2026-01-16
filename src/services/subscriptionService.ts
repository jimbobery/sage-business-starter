import { apiClient } from '@/lib/apiClient';
import { Tenant, SageTenantRequest } from '@/types/sage';
import { configManager } from '@/lib/configManager';

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
  async createTenant(data: { name: string; businessName: string }): Promise<CreateTenantResponse> {
    const config = configManager.getConfig();
    
    const requestBody: SageTenantRequest = {
      name: data.name,
      businessName: data.businessName,
      productCode: config.productCode || 'SAGE_ONE',
      platform: config.platform || 'UK',
      businessTypeCode: config.businessTypeCode || 'SOLE_TRADER',
    };

    const response = await apiClient.post<CreateTenantResponse>(
      `${SUBSCRIPTIONS_BASE_URL}/tenants`,
      requestBody,
      { tokenType: 'subscription', featureArea: 'tenants' }
    );

    return response;
  },

  /**
   * Get all tenants from the subscription
   */
  async getTenants(): Promise<Tenant[]> {
    const response = await apiClient.get<{ data: Tenant[] }>(
      `${SUBSCRIPTIONS_BASE_URL}/tenants`,
      { tokenType: 'subscription', featureArea: 'tenants' }
    );

    return response.data || [];
  },

  /**
   * Get subscription metadata
   */
  async getSubscription(): Promise<{
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
      { tokenType: 'subscription', featureArea: 'tenants' }
    );

    return response;
  },
};
