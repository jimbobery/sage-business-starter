import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Credentials, Tenant, BankAccount, FinancialYear, BankTransaction, OpeningBalance } from '@/types/sage';

interface AppContextType extends AppState {
  login: (password: string) => boolean;
  logout: () => void;
  setCredentials: (creds: Credentials) => void;
  addTenant: (tenant: Omit<Tenant, 'createdAt' | 'status'>) => Tenant;
  setActiveTenant: (tenantId: string) => void;
  addBankAccount: (account: Omit<BankAccount, 'id' | 'createdAt'>) => BankAccount;
  addFinancialYear: (year: Omit<FinancialYear, 'id'>) => FinancialYear;
  addOpeningBalance: (balance: Omit<OpeningBalance, 'id'>) => OpeningBalance;
  addTransactions: (transactions: Omit<BankTransaction, 'id'>[]) => BankTransaction[];
  getActiveTenant: () => Tenant | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEMO_PASSWORD = 'sage2024';

const generateId = () => Math.random().toString(36).substr(2, 9);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentialsState] = useState<Credentials | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sage-demo-state');
    if (saved) {
      const state = JSON.parse(saved);
      setCredentialsState(state.credentials);
      setTenants(state.tenants || []);
      setActiveTenantId(state.activeTenantId);
      setBankAccounts(state.bankAccounts || []);
      setFinancialYears(state.financialYears || []);
      setTransactions(state.transactions || []);
    }
    
    const auth = sessionStorage.getItem('sage-demo-auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    const state = {
      credentials,
      tenants,
      activeTenantId,
      bankAccounts,
      financialYears,
      transactions,
    };
    localStorage.setItem('sage-demo-state', JSON.stringify(state));
  }, [credentials, tenants, activeTenantId, bankAccounts, financialYears, transactions]);

  const login = (password: string) => {
    if (password === DEMO_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('sage-demo-auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('sage-demo-auth');
  };

  const setCredentials = (creds: Credentials) => {
    setCredentialsState(creds);
  };

  const addTenant = (tenant: Omit<Tenant, 'createdAt' | 'status'>) => {
    const newTenant: Tenant = {
      ...tenant,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    setTenants(prev => [...prev, newTenant]);
    return newTenant;
  };

  const setActiveTenant = (tenantId: string) => {
    setActiveTenantId(tenantId);
  };

  const addBankAccount = (account: Omit<BankAccount, 'id' | 'createdAt'>) => {
    const newAccount: BankAccount = {
      ...account,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setBankAccounts(prev => [...prev, newAccount]);
    return newAccount;
  };

  const addFinancialYear = (year: Omit<FinancialYear, 'id'>) => {
    const newYear: FinancialYear = {
      ...year,
      id: generateId(),
    };
    setFinancialYears(prev => [...prev, newYear]);
    return newYear;
  };

  const addOpeningBalance = (balance: Omit<OpeningBalance, 'id'>) => {
    const newBalance: OpeningBalance = {
      ...balance,
      id: generateId(),
    };
    // Update the bank account balance
    setBankAccounts(prev => 
      prev.map(acc => 
        acc.id === balance.bankAccountId 
          ? { ...acc, balance: balance.amount }
          : acc
      )
    );
    return newBalance;
  };

  const addTransactions = (newTransactions: Omit<BankTransaction, 'id'>[]) => {
    const withIds = newTransactions.map(t => ({
      ...t,
      id: generateId(),
    }));
    setTransactions(prev => [...prev, ...withIds]);
    return withIds;
  };

  const getActiveTenant = () => {
    return tenants.find(t => t.id === activeTenantId) || null;
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        credentials,
        tenants,
        activeTenantId,
        bankAccounts,
        financialYears,
        transactions,
        login,
        logout,
        setCredentials,
        addTenant,
        setActiveTenant,
        addBankAccount,
        addFinancialYear,
        addOpeningBalance,
        addTransactions,
        getActiveTenant,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
