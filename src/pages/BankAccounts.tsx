import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Landmark,
  AlertCircle,
  Banknote
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function BankAccounts() {
  const { bankAccounts, activeTenantId, addBankAccount, addOpeningBalance, getActiveTenant } = useApp();
  const { toast } = useToast();
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  const [accountForm, setAccountForm] = useState({
    accountName: '',
    accountNumber: '',
    sortCode: '',
    currency: 'GBP',
  });
  
  const [balanceForm, setBalanceForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const activeTenant = getActiveTenant();
  const tenantAccounts = bankAccounts.filter(a => a.tenantId === activeTenantId);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenantId) return;
    
    addBankAccount({
      ...accountForm,
      tenantId: activeTenantId,
      balance: 0,
    });
    
    setAccountForm({ accountName: '', accountNumber: '', sortCode: '', currency: 'GBP' });
    setIsAccountDialogOpen(false);
    toast({
      title: "Bank account created",
      description: `${accountForm.accountName} has been added successfully.`,
    });
  };

  const handleSetBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;
    
    addOpeningBalance({
      bankAccountId: selectedAccountId,
      amount: parseFloat(balanceForm.amount),
      date: balanceForm.date,
    });
    
    setBalanceForm({ amount: '', date: new Date().toISOString().split('T')[0] });
    setIsBalanceDialogOpen(false);
    setSelectedAccountId(null);
    toast({
      title: "Opening balance set",
      description: "The opening balance has been recorded.",
    });
  };

  if (!activeTenantId) {
    return (
      <MainLayout>
        <div className="animate-fade-in">
          <div className="page-header">
            <h1 className="page-title">Bank Accounts</h1>
          </div>
          
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-warning flex-shrink-0" />
            <div>
              <h3 className="font-medium text-foreground">No tenant selected</h3>
              <p className="text-muted-foreground mt-1">
                Please select or create a tenant first to manage bank accounts.
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
        <div className="flex items-center justify-between mb-8">
          <div className="page-header mb-0">
            <h1 className="page-title">Bank Accounts</h1>
            <p className="page-description">
              Manage bank accounts for {activeTenant?.businessName}
            </p>
          </div>
          
          <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Bank Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Bank Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAccount} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={accountForm.accountName}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, accountName: e.target.value }))}
                    placeholder="e.g., Business Current Account"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={accountForm.accountNumber}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="12345678"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sortCode">Sort Code</Label>
                    <Input
                      id="sortCode"
                      value={accountForm.sortCode}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, sortCode: e.target.value }))}
                      placeholder="12-34-56"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={accountForm.currency} 
                    onValueChange={(value) => setAccountForm(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Account
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Accounts List */}
        {tenantAccounts.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Landmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No bank accounts</h3>
            <p className="text-muted-foreground mb-6">
              Add your first bank account to start recording transactions.
            </p>
            <Button onClick={() => setIsAccountDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Account
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="data-table">
              <thead>
                <tr className="bg-muted/50">
                  <th>Account Name</th>
                  <th>Account Number</th>
                  <th>Sort Code</th>
                  <th>Currency</th>
                  <th className="text-right">Balance</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenantAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="font-medium">{account.accountName}</td>
                    <td className="font-mono text-sm">{account.accountNumber}</td>
                    <td className="font-mono text-sm">{account.sortCode}</td>
                    <td>{account.currency}</td>
                    <td className="text-right font-semibold">
                      {account.currency === 'GBP' ? '£' : account.currency === 'EUR' ? '€' : '$'}
                      {account.balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAccountId(account.id);
                          setIsBalanceDialogOpen(true);
                        }}
                      >
                        <Banknote className="w-4 h-4 mr-1" />
                        Set Balance
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Opening Balance Dialog */}
        <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Opening Balance</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSetBalance} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Opening Balance</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={balanceForm.amount}
                  onChange={(e) => setBalanceForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">As of Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={balanceForm.date}
                  onChange={(e) => setBalanceForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsBalanceDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Set Balance
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* API Info */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-foreground mb-2">API Integration</h3>
          <p className="text-sm text-muted-foreground">
            Bank accounts are created via <code className="bg-background px-1 rounded">POST /bank_accounts</code> and 
            opening balances via <code className="bg-background px-1 rounded">POST /bank_opening_balances</code>.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
