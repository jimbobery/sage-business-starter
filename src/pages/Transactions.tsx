import { useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useApp } from '@/contexts/AppContext';
import { useDeveloperMode } from '@/contexts/DeveloperModeContext';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BankTransaction, CsvUploadResult } from '@/types/sage';
import { ApiIntegrationPanel } from '@/components/developer/ApiIntegrationPanel';
import { transactionService } from '@/services/transactionService';

const SAMPLE_CSV = `date,type,description,reference,amount,category
2024-01-15,receipt,Client Payment - ABC Corp,INV-001,5000.00,Sales
2024-01-18,payment,Office Supplies,PO-123,150.00,Office Expenses
2024-01-20,receipt,Consulting Fee,INV-002,2500.00,Sales
2024-01-22,payment,Software Subscription,SUB-001,99.00,Software
2024-01-25,payment,Travel Expenses,EXP-001,350.00,Travel
2024-01-28,receipt,Product Sale,INV-003,1200.00,Sales`;

export default function Transactions() {
  const { 
    bankAccounts, 
    transactions, 
    activeTenantId, 
    addTransactions, 
    getActiveTenant,
    credentials 
  } = useApp();
  const { isDeveloperMode } = useDeveloperMode();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [uploadResults, setUploadResults] = useState<CsvUploadResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const activeTenant = getActiveTenant();
  const tenantAccounts = bankAccounts.filter(a => a.tenantId === activeTenantId);
  const tenantTransactions = transactions.filter(t => t.tenantId === activeTenantId);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedAccountId || !activeTenantId) return;

    if (!credentials?.clientId || !credentials?.clientSecret) {
      toast({
        title: "Configuration required",
        description: "Please configure your API credentials in Admin Settings first.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadResults([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const parsedTransactions: Array<{
        type: 'payment' | 'receipt';
        date: string;
        description: string;
        reference: string;
        amount: number;
        category?: string;
      }> = [];
      
      // Parse CSV
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        if (row.date && row.type && row.amount) {
          parsedTransactions.push({
            type: row.type.toLowerCase() as 'payment' | 'receipt',
            date: row.date,
            description: row.description || '',
            reference: row.reference || '',
            amount: parseFloat(row.amount) || 0,
            category: row.category || 'Uncategorized',
          });
        }
      }

      if (parsedTransactions.length === 0) {
        toast({
          title: "No valid transactions",
          description: "The CSV file doesn't contain any valid transaction rows.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      try {
        // Call real API for each transaction
        const results = await transactionService.uploadFromCsv(
          activeTenantId,
          selectedAccountId,
          parsedTransactions
        );

        setUploadResults(results);

        // Add successful transactions to local state
        const successfulTransactions = results
          .filter(r => r.success && r.data)
          .map(r => r.data as BankTransaction);
        
        if (successfulTransactions.length > 0) {
          addTransactions(successfulTransactions.map(t => ({
            tenantId: t.tenantId,
            bankAccountId: t.bankAccountId,
            type: t.type,
            date: t.date,
            description: t.description,
            reference: t.reference,
            amount: t.amount,
            category: t.category,
          })));
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        toast({
          title: "Upload complete",
          description: `${successCount} transactions uploaded${failCount > 0 ? `, ${failCount} failed` : ''}.`,
          variant: failCount > 0 ? "destructive" : "default",
        });
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error.message || "An error occurred while uploading transactions.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeTenantId) {
    return (
      <MainLayout>
        <div className="animate-fade-in">
          <div className="page-header">
            <h1 className="page-title">Transactions</h1>
          </div>
          
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-warning flex-shrink-0" />
            <div>
              <h3 className="font-medium text-foreground">No tenant selected</h3>
              <p className="text-muted-foreground mt-1">
                Please select or create a tenant first to manage transactions.
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
          <h1 className="page-title">Transactions</h1>
          <p className="page-description">
            Upload and manage bank transactions for {activeTenant?.businessName}
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="section-title mb-4">Upload Transactions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Select Bank Account
                </label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId} disabled={isUploading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                  disabled={isUploading}
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedAccountId || tenantAccounts.length === 0 || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload CSV File'}
                </Button>
              </div>

              {/* Upload Results */}
              {uploadResults.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {uploadResults.map((result) => (
                    <div
                      key={result.row}
                      className={cn(
                        "flex items-center gap-2 text-sm p-2 rounded",
                        result.success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {result.success ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Row {result.row}: {result.success ? 'Success' : `Failed - ${result.message}`}
                      {result.status && ` (${result.status})`}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-2">CSV Format</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Your CSV should include these columns:
              </p>
              <code className="text-xs bg-background p-2 rounded block overflow-x-auto">
                date, type, description, reference, amount, category
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>type</strong>: "payment" or "receipt"
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={downloadSampleCSV}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {tenantTransactions.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No transactions</h3>
            <p className="text-muted-foreground">
              Upload a CSV file to import bank payments and receipts.
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50">
              <h2 className="section-title">Recent Transactions</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr className="bg-muted/30">
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Category</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {tenantTransactions.slice().reverse().map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.date).toLocaleDateString('en-GB')}</td>
                    <td>
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        transaction.type === 'receipt' 
                          ? "bg-success/10 text-success" 
                          : "bg-destructive/10 text-destructive"
                      )}>
                        {transaction.type === 'receipt' ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {transaction.type === 'receipt' ? 'Receipt' : 'Payment'}
                      </span>
                    </td>
                    <td>{transaction.description}</td>
                    <td className="font-mono text-sm">{transaction.reference}</td>
                    <td>{transaction.category}</td>
                    <td className={cn(
                      "text-right font-semibold",
                      transaction.type === 'receipt' ? "text-success" : "text-destructive"
                    )}>
                      {transaction.type === 'receipt' ? '+' : '-'}£{transaction.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* API Integration Panel - Only visible in Developer Mode */}
        {isDeveloperMode && (
          <div className="mt-8">
            <ApiIntegrationPanel featureArea="transactions" />
          </div>
        )}

        {/* API Info - Always visible when not in dev mode */}
        {!isDeveloperMode && (
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-medium text-foreground mb-2">API Integration</h3>
            <p className="text-sm text-muted-foreground">
              Bank payments are created via <code className="bg-background px-1 rounded">POST /bank_payments</code> and 
              receipts via <code className="bg-background px-1 rounded">POST /bank_receipts</code>.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
