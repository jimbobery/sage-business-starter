import { apiClient } from '@/lib/apiClient';
import { FinancialYear, SageFinancialYearRequest, Credentials } from '@/types/sage';

const TENANT_API_BASE = 'https://api.sandbox.sbc.sage.com/v1';

export interface CreateFinancialYearResponse {
  id: string;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed';
}

export const financialService = {
  async createFinancialYear(
    tenantId: string,
    data: SageFinancialYearRequest,
    credentials: Credentials
  ): Promise<CreateFinancialYearResponse> {
    const response = await apiClient.post<CreateFinancialYearResponse>(
      `${TENANT_API_BASE}/financial_settings`,
      data,
      { tokenType: 'tenant', featureArea: 'financial-years', tenantId, credentials }
    );
    return response;
  },

  async getFinancialYears(tenantId: string, credentials: Credentials): Promise<FinancialYear[]> {
    const response = await apiClient.get<{ data: FinancialYear[] }>(
      `${TENANT_API_BASE}/financial_settings`,
      { tokenType: 'tenant', featureArea: 'financial-years', tenantId, credentials }
    );
    return response.data || [];
  },
};
