import { useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  ArrowDownLeft,
  ArrowUpRight
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
import { BankTransaction } from '@/types/sage';

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
    getActiveTenant 
  } = useApp();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [uploadedCount, setUploadedCount] = useState(0);

  const activeTenant = getActiveTenant();
  const tenantAccounts = bankAccounts.filter(a => a.tenantId === activeTenantId);
  const tenantTransactions = transactions.filter(t => t.tenantId === activeTenantId);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedAccountId || !activeTenantId) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const newTransactions: Omit<BankTransaction, 'id'>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        if (row.date && row.type && row.amount) {
          newTransactions.push({
            tenantId: activeTenantId,
            bankAccountId: selectedAccountId,
            type: row.type.toLowerCase() as 'payment' | 'receipt',
            date: row.date,
            description: row.description || '',
            reference: row.reference || '',
            amount: parseFloat(row.amount) || 0,
            category: row.category || 'Uncategorized',
          });
        }
      }
      
      if (newTransactions.length > 0) {
        addTransactions(newTransactions);
        setUploadedCount(newTransactions.length);
        toast({
          title: "Transactions uploaded",
          description: `${newTransactions.length} transactions have been imported.`,
        });
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
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
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
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedAccountId || tenantAccounts.length === 0}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV File
                </Button>
              </div>

              {uploadedCount > 0 && (
                <div className="flex items-center gap-2 text-success text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  {uploadedCount} transactions uploaded successfully
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

        {/* API Info */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-foreground mb-2">API Integration</h3>
          <p className="text-sm text-muted-foreground">
            Bank payments are created via <code className="bg-background px-1 rounded">POST /bank_payments</code> and 
            receipts via <code className="bg-background px-1 rounded">POST /bank_receipts</code>.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
