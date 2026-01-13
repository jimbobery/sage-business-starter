export interface Credentials {
  clientId: string;
  clientSecret: string;
  subscriptionClientId: string;
  subscriptionClientSecret: string;
  productCode: string;
  platform: string;
  businessTypeCode: string;
}

export interface Tenant {
  id: string;
  name: string;
  businessName: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface BankAccount {
  id: string;
  tenantId: string;
  accountName: string;
  accountNumber: string;
  sortCode: string;
  currency: string;
  balance: number;
  createdAt: string;
}

export interface FinancialYear {
  id: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed';
}

export interface BankTransaction {
  id: string;
  tenantId: string;
  bankAccountId: string;
  type: 'payment' | 'receipt';
  date: string;
  description: string;
  reference: string;
  amount: number;
  category: string;
}

export interface OpeningBalance {
  id: string;
  bankAccountId: string;
  amount: number;
  date: string;
}

export interface ProfitLossReport {
  periodStart: string;
  periodEnd: string;
  income: {
    category: string;
    amount: number;
  }[];
  expenses: {
    category: string;
    amount: number;
  }[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export interface AppState {
  isAuthenticated: boolean;
  credentials: Credentials | null;
  tenants: Tenant[];
  activeTenantId: string | null;
  bankAccounts: BankAccount[];
  financialYears: FinancialYear[];
  transactions: BankTransaction[];
}
