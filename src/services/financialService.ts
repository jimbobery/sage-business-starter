import { apiClient } from '@/lib/apiClient';
import { FinancialYear, SageFinancialYearRequest } from '@/types/sage';

const TENANT_API_BASE = 'https://api.sandbox.sbc.sage.com/v1';

export interface CreateFinancialYearResponse {
  id: string;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed';
}

export const financialService = {
  /**
   * Create a new financial year for a tenant
   */
  async createFinancialYear(
    tenantId: string,
    data: SageFinancialYearRequest
  ): Promise<CreateFinancialYearResponse> {
    const response = await apiClient.post<CreateFinancialYearResponse>(
      `${TENANT_API_BASE}/financial_settings`,
      data,
      { 
        tokenType: 'tenant', 
        featureArea: 'financial-years',
        tenantId 
      }
    );

    return response;
  },

  /**
   * Get financial years for a tenant
   */
  async getFinancialYears(tenantId: string): Promise<FinancialYear[]> {
    const response = await apiClient.get<{ data: FinancialYear[] }>(
      `${TENANT_API_BASE}/financial_settings`,
      { 
        tokenType: 'tenant', 
        featureArea: 'financial-years',
        tenantId 
      }
    );

    return response.data || [];
  },
};
