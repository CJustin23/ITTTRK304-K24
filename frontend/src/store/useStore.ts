import { create } from 'zustand';
import { User, Wallet, Transaction, DashboardSummary, HabitRecommendation } from '../types';

interface AppState {
  currentUser: User | null;
  token: string | null;
  wallets: Wallet[];
  recentTransactions: Transaction[];
  dashboardSummary: DashboardSummary | null;
  botRecommendation: HabitRecommendation | null;
  isBotModalOpen: boolean;
  isTransactionModalOpen: boolean;
  
  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setWallets: (wallets: Wallet[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setDashboardSummary: (summary: DashboardSummary) => void;
  setBotRecommendation: (rec: HabitRecommendation | null) => void;
  setBotModalOpen: (open: boolean) => void;
  setTransactionModalOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  currentUser: null,
  token: null,
  wallets: [
    { id: 1, walletName: 'Techcombank Primary', cardNumberMasked: '**** 4892', balance: 45200000, currency: 'VND', type: 'BANK' },
    { id: 2, walletName: 'Visa Signature Card', cardNumberMasked: '**** 9012', balance: 18500000, currency: 'VND', type: 'CREDIT_CARD' },
    { id: 3, walletName: 'Ví tiền mặt (Cash)', cardNumberMasked: '', balance: 3450000, currency: 'VND', type: 'CASH' },
  ],
  recentTransactions: [
    {
      id: 101,
      walletId: 1,
      walletName: 'Techcombank Primary',
      categoryName: 'Lương & Thưởng',
      categoryIcon: 'BadgeDollarSign',
      actionTitle: 'Nhận lương tháng 10',
      amount: 32000000,
      transactionType: 'INCOME',
      balanceAfter: 67150000,
      transactionDate: '2026-10-25 09:30:00',
    },
    {
      id: 102,
      walletId: 2,
      walletName: 'Visa Signature Card',
      categoryName: 'Ăn uống & Nhà hàng',
      categoryIcon: 'Utensils',
      actionTitle: 'Tiệc tối gia đình tại Pizza 4P’s',
      amount: 1450000,
      transactionType: 'EXPENSE',
      balanceAfter: 65700000,
      transactionDate: '2026-10-26 19:45:00',
    },
    {
      id: 103,
      walletId: 1,
      walletName: 'Techcombank Primary',
      categoryName: 'Hóa đơn & Điện nước',
      categoryIcon: 'Receipt',
      actionTitle: 'Thanh toán tiền điện EVN',
      amount: 1820000,
      transactionType: 'EXPENSE',
      balanceAfter: 63880000,
      transactionDate: '2026-10-26 14:15:00',
    },
    {
      id: 104,
      walletId: 2,
      walletName: 'Visa Signature Card',
      categoryName: 'Mua sắm & Siêu thị',
      categoryIcon: 'ShoppingBag',
      actionTitle: 'Siêu thị WinMart cuối tuần',
      amount: 980000,
      transactionType: 'EXPENSE',
      balanceAfter: 62900000,
      transactionDate: '2026-10-27 08:10:00',
    },
  ],
  dashboardSummary: {
    totalBalance: 67150000,
    monthlyIncome: 35000000,
    monthlySpending: 14250000,
    leftToSpend: 20750000,
    spendingPercentageOfBudget: 68.5,
    categoryExpenses: {
      'Ăn uống & Cà phê': 5600000,
      'Mua sắm & Gia đình': 3450000,
      'Di chuyển & Xăng xe': 1800000,
      'Hóa đơn & Tiện ích': 2400000,
      'Giải trí & Du lịch': 1000000,
    },
    spentTrends: [
      { label: 'Thứ 2', amount: 1200000 },
      { label: 'Thứ 3', amount: 2450000 },
      { label: 'Thứ 4', amount: 850000 },
      { label: 'Thứ 5', amount: 3100000 },
      { label: 'Thứ 6', amount: 1950000 },
      { label: 'Thứ 7', amount: 3500000 },
      { label: 'Chủ nhật', amount: 1200000 },
    ],
  },
  botRecommendation: null,
  isBotModalOpen: false,
  isTransactionModalOpen: false,

  setAuth: (user, token) => {
    localStorage.setItem('budglee_token', token);
    set({ currentUser: user, token });
  },
  logout: () => {
    localStorage.removeItem('budglee_token');
    set({ currentUser: null, token: null });
  },
  setWallets: (wallets) => set({ wallets }),
  setTransactions: (recentTransactions) => set({ recentTransactions }),
  setDashboardSummary: (dashboardSummary) => set({ dashboardSummary }),
  setBotRecommendation: (botRecommendation) => set({ botRecommendation }),
  setBotModalOpen: (isBotModalOpen) => set({ isBotModalOpen }),
  setTransactionModalOpen: (isTransactionModalOpen) => set({ isTransactionModalOpen }),
}));
