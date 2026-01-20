import { apiClient } from '@/lib/apiClient';
import { Credentials } from '@/types/sage';

export interface ProfitLossApiResponse {
  periodStart: string;
  periodEnd: string;
  income: Array<{ category: string; amount: number }>;
  expenses: Array<{ category: string; amount: number }>;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  rawData?: any; // Raw API response for developer mode
}

export const reportingService = {
  /**
   * Get Profit & Loss report for a tenant
   * URL: /reportengine/v1/tenant/{TenantId}/reports/ProfitAndLoss
   */
  async getProfitAndLoss(
    tenantId: string,
    params: { startDate: string; endDate: string },
    credentials: Credentials
  ): Promise<ProfitLossApiResponse> {
    const queryParams = new URLSearchParams({
      from_date: params.startDate,
      to_date: params.endDate,
    });

    const response = await apiClient.get<any>(
      `/reportengine/v1/tenant/${tenantId}/reports/ProfitAndLoss?${queryParams}`,
      { 
        tokenType: 'tenant', 
        featureArea: 'reports',
        tenantId,
        credentials
      }
    );

    // Transform API response to our format
    // The actual structure depends on the Sage API response format
    const transformed: ProfitLossApiResponse = {
      periodStart: params.startDate,
      periodEnd: params.endDate,
      income: response.income || [],
      expenses: response.expenses || [],
      totalIncome: response.totalIncome || response.total_income || 0,
      totalExpenses: response.totalExpenses || response.total_expenses || 0,
      netProfit: response.netProfit || response.net_profit || 0,
      rawData: response, // Keep raw data for developer mode
    };

    return transformed;
  },

  /**
   * Get balance sheet report (if available)
   * URL: /reportengine/v1/tenant/{TenantId}/reports/BalanceSheet
   */
  async getBalanceSheet(
    tenantId: string,
    params: { date: string },
    credentials: Credentials
  ): Promise<any> {
    const queryParams = new URLSearchParams({
      as_of_date: params.date,
    });

    const response = await apiClient.get<any>(
      `/reportengine/v1/tenant/${tenantId}/reports/BalanceSheet?${queryParams}`,
      { 
        tokenType: 'tenant', 
        featureArea: 'reports',
        tenantId,
        credentials
      }
    );

    return response;
  },
};
