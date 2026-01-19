import { apiClient } from '@/lib/apiClient';
import { Tenant, Credentials } from '@/types/sage';
import { getConfig } from '@/lib/configManager';
import { generateIdempotencyKey } from '@/lib/idempotency';

const SUBSCRIPTIONS_BASE_URL = 'https://api.sandbox.sbc.sage.com/slcsadapter/v2/subscriptions';

export interface CreateTenantRequest {
  ProductCode: string;
  ReferenceId: string;
  Business: {
    Name: string;
    BusinessTypeCode: string;
  };
  Platform: string;
}

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
    
    const requestBody: CreateTenantRequest = {
      ProductCode: creds.productCode || 'SAGE_ONE',
      ReferenceId: generateIdempotencyKey(),
      Business: {
        Name: data.businessName,
        BusinessTypeCode: creds.businessTypeCode || 'SOLE_TRADER',
      },
      Platform: creds.platform || 'UK',
    };

    const response = await apiClient.post<CreateTenantResponse>(
      SUBSCRIPTIONS_BASE_URL,
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
      SUBSCRIPTIONS_BASE_URL,
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
