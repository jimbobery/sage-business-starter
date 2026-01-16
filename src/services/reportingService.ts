import { apiClient } from '@/lib/apiClient';
import { ProfitLossReport } from '@/types/sage';

const TENANT_API_BASE = 'https://api.sandbox.sbc.sage.com/v1';

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
   */
  async getProfitAndLoss(
    tenantId: string,
    params: { startDate: string; endDate: string }
  ): Promise<ProfitLossApiResponse> {
    const queryParams = new URLSearchParams({
      from_date: params.startDate,
      to_date: params.endDate,
    });

    const response = await apiClient.get<any>(
      `${TENANT_API_BASE}/reports/profit_and_loss?${queryParams}`,
      { 
        tokenType: 'tenant', 
        featureArea: 'reports',
        tenantId 
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
   */
  async getBalanceSheet(
    tenantId: string,
    params: { date: string }
  ): Promise<any> {
    const queryParams = new URLSearchParams({
      as_of_date: params.date,
    });

    const response = await apiClient.get<any>(
      `${TENANT_API_BASE}/reports/balance_sheet?${queryParams}`,
      { 
        tokenType: 'tenant', 
        featureArea: 'reports',
        tenantId 
      }
    );

    return response;
  },
};
