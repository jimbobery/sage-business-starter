import { apiClient, apiRequest } from '@/lib/apiClient';
import { Credentials } from '@/types/sage';

/**
 * Sage Report Engine API integration
 * 
 * Two-step flow:
 * 1. POST .../ProfitAndLoss/run  → 201 with { Id: executionId }
 * 2. GET  .../executions/{executionId} → 200 with full report data
 * 
 * PDF export:
 * 1. POST .../ProfitAndLoss/run?ExportType=pdf → 201 with { Id: executionId }
 * 2. GET  .../exports/{executionId} → 200 with { Url: downloadUrl }
 */

export const reportingService = {
  /**
   * Run & fetch the Profit & Loss report for a tenant (two-step)
   */
  async getProfitAndLoss(
    tenantId: string,
    params: { startDate: string; endDate: string },
    credentials: Credentials
  ): Promise<any> {
    const body = {
      Filters: {
        Date: 'Custom',
        CustomDateRange: {
          StartDate: params.startDate,
          EndDate: params.endDate,
        },
        ExcludeZeroValues: true,
      },
    };

    // Step 1: POST to run the report
    const runResponse = await apiRequest<{ Id: string }>(
      {
        method: 'POST',
        endpoint: `/reportengine/v1/tenant/${tenantId}/reports/ProfitAndLoss/run`,
        body,
        tokenType: 'tenant',
        featureArea: 'reports',
        tenantId,
      },
      credentials
    );

    if (!runResponse.success || !runResponse.data?.Id) {
      throw new Error(runResponse.error || 'Failed to run P&L report');
    }

    const executionId = runResponse.data.Id;

    // Step 2: GET the execution result
    const execResponse = await apiRequest<any>(
      {
        method: 'GET',
        endpoint: `/reportengine/v1/tenant/${tenantId}/reports/executions/${executionId}`,
        tokenType: 'tenant',
        featureArea: 'reports',
        tenantId,
      },
      credentials
    );

    if (!execResponse.success || !execResponse.data) {
      throw new Error(execResponse.error || 'Failed to fetch P&L execution result');
    }

    return execResponse.data;
  },

  /**
   * Export P&L as PDF (two-step) – returns the download URL
   */
  async exportProfitAndLossPdf(
    tenantId: string,
    params: { startDate: string; endDate: string },
    credentials: Credentials
  ): Promise<string> {
    const body = {
      Filters: {
        Date: 'Custom',
        CustomDateRange: {
          StartDate: params.startDate,
          EndDate: params.endDate,
        },
        ExcludeZeroValues: true,
      },
    };

    // Step 1: POST with ExportType=pdf
    const runResponse = await apiRequest<{ Id: string }>(
      {
        method: 'POST',
        endpoint: `/reportengine/v1/tenant/${tenantId}/reports/ProfitAndLoss/run?ExportType=pdf`,
        body,
        tokenType: 'tenant',
        featureArea: 'reports',
        tenantId,
      },
      credentials
    );

    if (!runResponse.success || !runResponse.data?.Id) {
      throw new Error(runResponse.error || 'Failed to run P&L PDF export');
    }

    const executionId = runResponse.data.Id;

    // Step 2: GET the export result (contains download URL)
    const exportResponse = await apiRequest<{ Url: string }>(
      {
        method: 'GET',
        endpoint: `/reportengine/v1/tenant/${tenantId}/reports/exports/${executionId}`,
        tokenType: 'tenant',
        featureArea: 'reports',
        tenantId,
      },
      credentials
    );

    if (!exportResponse.success || !exportResponse.data?.Url) {
      throw new Error(exportResponse.error || 'Failed to fetch PDF export URL');
    }

    return exportResponse.data.Url;
  },
};
