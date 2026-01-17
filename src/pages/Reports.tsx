import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useApp } from '@/contexts/AppContext';
import { useDeveloperMode } from '@/contexts/DeveloperModeContext';
import { Button } from '@/components/ui/button';
import { 
  FileText,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Loader2,
  Code
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ProfitLossReport } from '@/types/sage';
import { ApiIntegrationPanel } from '@/components/developer/ApiIntegrationPanel';
import { reportingService } from '@/services/reportingService';
import { useToast } from '@/hooks/use-toast';

export default function Reports() {
  const { transactions, financialYears, activeTenantId, getActiveTenant, credentials } = useApp();
  const { isDeveloperMode } = useDeveloperMode();
  const { toast } = useToast();
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiReport, setApiReport] = useState<any>(null);
  const [rawJson, setRawJson] = useState<string>('');

  const activeTenant = getActiveTenant();
  const tenantYears = financialYears.filter(y => y.tenantId === activeTenantId);
  const tenantTransactions = transactions.filter(t => t.tenantId === activeTenantId);

  // Local calculation as fallback
  const localReport = useMemo<ProfitLossReport | null>(() => {
    if (!selectedYearId || tenantTransactions.length === 0) return null;

    const year = tenantYears.find(y => y.id === selectedYearId);
    if (!year) return null;

    // Filter transactions within the financial year
    const yearTransactions = tenantTransactions.filter(t => {
      const date = new Date(t.date);
      return date >= new Date(year.startDate) && date <= new Date(year.endDate);
    });

    // Group by category
    const incomeByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};

    yearTransactions.forEach(t => {
      if (t.type === 'receipt') {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      } else {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      }
    });

    const income = Object.entries(incomeByCategory).map(([category, amount]) => ({ category, amount }));
    const expenses = Object.entries(expensesByCategory).map(([category, amount]) => ({ category, amount }));
    
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      periodStart: year.startDate,
      periodEnd: year.endDate,
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
    };
  }, [selectedYearId, tenantTransactions, tenantYears]);

  const report = apiReport || localReport;

  const handleGenerate = async () => {
    if (!selectedYearId || !activeTenantId) return;
    
    const year = tenantYears.find(y => y.id === selectedYearId);
    if (!year) return;

    setIsGenerating(true);
    
    // Check if credentials are configured
    if (credentials?.clientId && credentials?.clientSecret) {
      try {
        const response = await reportingService.getProfitAndLoss(activeTenantId, {
          startDate: year.startDate,
          endDate: year.endDate,
        }, credentials);
        
        setApiReport(response);
        setRawJson(JSON.stringify(response.rawData, null, 2));
        
        toast({
          title: "Report generated",
          description: "P&L report has been fetched from the API.",
        });
      } catch (error: any) {
        // Fallback to local calculation
        toast({
          title: "Using local data",
          description: error.message || "API call failed, showing local calculation instead.",
          variant: "destructive",
        });
        setApiReport(null);
        setRawJson('');
      }
    } else {
      // Use local calculation
      setApiReport(null);
      setRawJson('');
    }
    
    setIsGenerating(false);
  };

  if (!activeTenantId) {
    return (
      <MainLayout>
        <div className="animate-fade-in">
          <div className="page-header">
            <h1 className="page-title">P&L Report</h1>
          </div>
          
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-warning flex-shrink-0" />
            <div>
              <h3 className="font-medium text-foreground">No tenant selected</h3>
              <p className="text-muted-foreground mt-1">
                Please select or create a tenant first to view reports.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Profit & Loss Report</h1>
          <p className="page-description">
            View financial performance for {activeTenant?.businessName}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select Financial Year
              </label>
              <Select value={selectedYearId} onValueChange={setSelectedYearId} disabled={isGenerating}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Choose a year" />
                </SelectTrigger>
                <SelectContent>
                  {tenantYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      FY {new Date(year.startDate).getFullYear()}/{new Date(year.endDate).getFullYear()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleGenerate}
              disabled={!selectedYearId || isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Generate Report
            </Button>
          </div>
        </div>

        {/* Report */}
        {!report ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No report generated</h3>
            <p className="text-muted-foreground">
              {tenantYears.length === 0 
                ? "Create a financial year first to generate reports."
                : tenantTransactions.length === 0
                  ? "Upload some transactions to generate a report."
                  : "Select a financial year and click Generate Report."}
            </p>
          </div>
        ) : (
          <Tabs defaultValue="summary" className="space-y-6">
            {isDeveloperMode && rawJson && (
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="raw">
                  <Code className="w-4 h-4 mr-2" />
                  Raw JSON
                </TabsTrigger>
              </TabsList>
            )}
            
            <TabsContent value="summary" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-success" />
                    </div>
                    <span className="stat-label">Total Income</span>
                  </div>
                  <div className="stat-value text-success">
                    £{report.totalIncome.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    </div>
                    <span className="stat-label">Total Expenses</span>
                  </div>
                  <div className="stat-value text-destructive">
                    £{report.totalExpenses.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      report.netProfit >= 0 ? "bg-success/10" : "bg-destructive/10"
                    )}>
                      {report.netProfit >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-success" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <span className="stat-label">Net Profit</span>
                  </div>
                  <div className={cn(
                    "stat-value",
                    report.netProfit >= 0 ? "text-success" : "text-destructive"
                  )}>
                    £{Math.abs(report.netProfit).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Detailed Report */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
                  <div>
                    <h2 className="section-title">Profit & Loss Statement</h2>
                    <p className="section-description">
                      {new Date(report.periodStart).toLocaleDateString('en-GB')} - {new Date(report.periodEnd).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
                
                <div className="p-6">
                  {/* Income Section */}
                  <div className="mb-8">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-success" />
                      Income
                    </h3>
                    <div className="space-y-2">
                      {report.income.map((item, index) => (
                        <div key={index} className="flex justify-between py-2 border-b border-border/50">
                          <span className="text-foreground">{item.category}</span>
                          <span className="font-medium text-success">
                            £{item.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold">
                        <span>Total Income</span>
                        <span className="text-success">
                          £{report.totalIncome.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div className="mb-8">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-destructive" />
                      Expenses
                    </h3>
                    <div className="space-y-2">
                      {report.expenses.map((item, index) => (
                        <div key={index} className="flex justify-between py-2 border-b border-border/50">
                          <span className="text-foreground">{item.category}</span>
                          <span className="font-medium text-destructive">
                            £{item.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold">
                        <span>Total Expenses</span>
                        <span className="text-destructive">
                          £{report.totalExpenses.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className="border-t-2 border-border pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Net Profit / (Loss)</span>
                      <span className={report.netProfit >= 0 ? "text-success" : "text-destructive"}>
                        {report.netProfit < 0 && '('}
                        £{Math.abs(report.netProfit).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        {report.netProfit < 0 && ')'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {isDeveloperMode && rawJson && (
              <TabsContent value="raw">
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/50">
                    <h2 className="section-title">Raw API Response</h2>
                    <p className="section-description">
                      Complete JSON response from the P&L endpoint
                    </p>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm font-mono bg-muted/30 max-h-96">
                    {rawJson}
                  </pre>
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* API Integration Panel - Only visible in Developer Mode */}
        {isDeveloperMode && (
          <div className="mt-8">
            <ApiIntegrationPanel featureArea="reports" />
          </div>
        )}

        {/* API Info - Always visible when not in dev mode */}
        {!isDeveloperMode && (
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-medium text-foreground mb-2">API Integration</h3>
            <p className="text-sm text-muted-foreground">
              The P&L report is generated via <code className="bg-background px-1 rounded">GET /reports/profit_and_loss</code> 
              with date range parameters matching the selected financial year.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
