export type Role = 'INDIVIDUAL_USER' | 'FAMILY_ADMIN' | 'FAMILY_MEMBER' | 'SYSTEM_ADMIN';

export type WalletType = 'CASH' | 'BANK' | 'CREDIT_CARD';

export type CategoryType = 'INCOME' | 'EXPENSE';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  familyGroupId?: string;
  familyGroupName?: string;
  avatarUrl?: string;
}

export interface Wallet {
  id: number;
  walletName: string;
  cardNumberMasked?: string;
  balance: number;
  currency: string;
  type: WalletType;
  color?: string;
}

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  icon?: string;
  colorCode?: string;
}

export interface Transaction {
  id: number;
  walletId: number;
  walletName?: string;
  categoryId?: number;
  categoryName?: string;
  categoryIcon?: string;
  actionTitle: string;
  amount: number;
  transactionType: TransactionType;
  balanceAfter: number;
  transactionDate: string;
  note?: string;
}

export interface Budget {
  id: number;
  categoryId?: number;
  categoryName?: string;
  categoryIcon?: string;
  amountLimit: number;
  spentAmount: number;
  periodMonth: number;
  periodYear: number;
  alertThreshold: number; // percentage (e.g. 80)
}

export interface SavingGoal {
  id: number;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  color?: string;
}

export interface FamilyMember {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  joinedDate: string;
  isOwner?: boolean;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlySpending: number;
  leftToSpend: number;
  spendingPercentageOfBudget: number;
  categoryExpenses: Record<string, number>;
  spentTrends: { label: string; amount: number }[];
}

export interface HabitRecommendation {
  status: 'ON_TRACK' | 'WARNING' | 'OVERSPENT';
  primaryAdvice: string;
  actionItems: string[];
  categoryWarnings: {
    categoryName: string;
    increasePercentage: number;
    recommendation: string;
  }[];
}

export type Timeframe = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Custom';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'WARNING' | 'ALERT' | 'INFO' | 'SUCCESS';
  read: boolean;
}
