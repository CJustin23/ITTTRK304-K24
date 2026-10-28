import { create } from 'zustand';
import {
  User,
  Wallet,
  Transaction,
  Budget,
  SavingGoal,
  FamilyMember,
  DashboardSummary,
  HabitRecommendation,
  Timeframe,
  NotificationItem,
} from '../types';

interface AppState {
  currentUser: User | null;
  token: string | null;

  wallets: Wallet[];
  recentTransactions: Transaction[];
  budgets: Budget[];
  savingGoals: SavingGoal[];
  familyMembers: FamilyMember[];
  notifications: NotificationItem[];

  dashboardSummary: DashboardSummary | null;
  botRecommendation: HabitRecommendation | null;
  activeTimeframe: Timeframe;

  // Modals
  isBotModalOpen: boolean;
  isTransactionModalOpen: boolean;
  isWalletModalOpen: boolean;
  isBudgetModalOpen: boolean;
  isGoalModalOpen: boolean;
  isFamilyModalOpen: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setActiveTimeframe: (timeframe: Timeframe) => void;

  // Notification actions
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Wallet actions
  setWallets: (wallets: Wallet[]) => void;
  addWallet: (wallet: Omit<Wallet, 'id'>) => void;

  // Transaction actions
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;

  // Budget actions
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;

  // Saving Goal actions
  setSavingGoals: (goals: SavingGoal[]) => void;
  addSavingGoal: (goal: Omit<SavingGoal, 'id'>) => void;
  depositToGoal: (goalId: number, walletId: number, amount: number) => void;

  // Family actions
  addFamilyMember: (member: Omit<FamilyMember, 'id' | 'joinedDate'>) => void;

  // Modal actions
  setBotModalOpen: (open: boolean) => void;
  setTransactionModalOpen: (open: boolean) => void;
  setWalletModalOpen: (open: boolean) => void;
  setBudgetModalOpen: (open: boolean) => void;
  setGoalModalOpen: (open: boolean) => void;
  setFamilyModalOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  token: null,
  activeTimeframe: 'Monthly',

  wallets: [
    { id: 1, walletName: 'Techcombank Primary', cardNumberMasked: '**** 4892', balance: 45200000, currency: 'VND', type: 'BANK', color: 'from-slate-900 to-indigo-950' },
    { id: 2, walletName: 'Visa Signature Card', cardNumberMasked: '**** 9012', balance: 18500000, currency: 'VND', type: 'CREDIT_CARD', color: 'from-emerald-900 to-teal-950' },
    { id: 3, walletName: 'Ví tiền mặt (Cash)', cardNumberMasked: '', balance: 3450000, currency: 'VND', type: 'CASH', color: 'from-amber-900 to-orange-950' },
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
      transactionDate: '2026-10-25 09:30',
      note: 'Lương chuyển khoản tháng 10/2026',
    },
    {
      id: 102,
      walletId: 2,
      walletName: 'Visa Signature Card',
      categoryName: 'Ăn uống & Cà phê',
      categoryIcon: 'Utensils',
      actionTitle: 'Tiệc tối gia đình tại Pizza 4P’s',
      amount: 1450000,
      transactionType: 'EXPENSE',
      balanceAfter: 65700000,
      transactionDate: '2026-10-26 19:45',
      note: 'Cuối tuần cùng gia đình',
    },
    {
      id: 103,
      walletId: 1,
      walletName: 'Techcombank Primary',
      categoryName: 'Hóa đơn & Tiện ích',
      categoryIcon: 'Receipt',
      actionTitle: 'Thanh toán tiền điện EVN',
      amount: 1820000,
      transactionType: 'EXPENSE',
      balanceAfter: 63880000,
      transactionDate: '2026-10-26 14:15',
    },
    {
      id: 104,
      walletId: 2,
      walletName: 'Visa Signature Card',
      categoryName: 'Mua sắm & Gia đình',
      categoryIcon: 'ShoppingBag',
      actionTitle: 'Siêu thị WinMart cuối tuần',
      amount: 980000,
      transactionType: 'EXPENSE',
      balanceAfter: 62900000,
      transactionDate: '2026-10-27 08:10',
    },
    {
      id: 105,
      walletId: 3,
      walletName: 'Ví tiền mặt (Cash)',
      categoryName: 'Di chuyển & Xăng xe',
      categoryIcon: 'Car',
      actionTitle: 'Đổ xăng xe máy Petrolimex',
      amount: 120000,
      transactionType: 'EXPENSE',
      balanceAfter: 62780000,
      transactionDate: '2026-10-27 11:30',
    },
  ],

  budgets: [
    {
      id: 1,
      categoryId: 1,
      categoryName: 'Ăn uống & Cà phê',
      categoryIcon: 'Utensils',
      amountLimit: 7000000,
      spentAmount: 5600000,
      periodMonth: 10,
      periodYear: 2026,
      alertThreshold: 80,
    },
    {
      id: 2,
      categoryId: 2,
      categoryName: 'Mua sắm & Gia đình',
      categoryIcon: 'ShoppingBag',
      amountLimit: 4000000,
      spentAmount: 3450000,
      periodMonth: 10,
      periodYear: 2026,
      alertThreshold: 80,
    },
    {
      id: 3,
      categoryId: 3,
      categoryName: 'Di chuyển & Xăng xe',
      categoryIcon: 'Car',
      amountLimit: 2500000,
      spentAmount: 1800000,
      periodMonth: 10,
      periodYear: 2026,
      alertThreshold: 80,
    },
    {
      id: 4,
      categoryId: 4,
      categoryName: 'Hóa đơn & Tiện ích',
      categoryIcon: 'Receipt',
      amountLimit: 3000000,
      spentAmount: 2400000,
      periodMonth: 10,
      periodYear: 2026,
      alertThreshold: 80,
    },
    {
      id: 5,
      categoryId: 5,
      categoryName: 'Giải trí & Du lịch',
      categoryIcon: 'Plane',
      amountLimit: 1500000,
      spentAmount: 1000000,
      periodMonth: 10,
      periodYear: 2026,
      alertThreshold: 80,
    },
  ],

  savingGoals: [
    {
      id: 1,
      goalName: 'Mua xe Honda SH 160i',
      targetAmount: 110000000,
      currentAmount: 65000000,
      deadline: '2026-12-31',
      status: 'IN_PROGRESS',
      color: 'emerald',
    },
    {
      id: 2,
      goalName: 'Du lịch gia đình Đà Nẵng',
      targetAmount: 25000000,
      currentAmount: 20000000,
      deadline: '2026-11-20',
      status: 'IN_PROGRESS',
      color: 'teal',
    },
    {
      id: 3,
      goalName: 'Quỹ dự phòng khẩn cấp 6 tháng',
      targetAmount: 60000000,
      currentAmount: 60000000,
      deadline: '2026-10-30',
      status: 'COMPLETED',
      color: 'blue',
    },
  ],

  familyMembers: [
    {
      id: 1,
      fullName: 'Nguyễn Tiến Thành (Bạn)',
      email: 'thanh.nt@budglee.com',
      role: 'FAMILY_ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      joinedDate: '20/10/2026',
      isOwner: true,
    },
    {
      id: 2,
      fullName: 'Nguyễn Trường An',
      email: 'an.nt@budglee.com',
      role: 'FAMILY_MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      joinedDate: '21/10/2026',
    },
    {
      id: 3,
      fullName: 'Bàng Trọng Tú',
      email: 'tu.bt@budglee.com',
      role: 'FAMILY_MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
      joinedDate: '22/10/2026',
    },
    {
      id: 4,
      fullName: 'Lê Hoàng Xuân Vinh',
      email: 'vinh.lhx@budglee.com',
      role: 'FAMILY_MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=faces',
      joinedDate: '22/10/2026',
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

  botRecommendation: {
    status: 'WARNING',
    primaryAdvice:
      'Tháng này chi tiêu cho Ăn uống và Cà phê đã tăng 22% so với tháng trước. Tỷ lệ tiết kiệm hiện tại đạt 18% (mục tiêu đề xuất: 25%).',
    actionItems: [
      'Hạn chế các bữa ăn tối tại nhà hàng cao cấp trong tuần cuối tháng.',
      'Tạm dừng các gói dịch vụ trực tuyến không sử dụng thường xuyên.',
      'Trích lập ngay 3.000.000 ₫ sang Mục tiêu Tiết kiệm xe SH.',
    ],
    categoryWarnings: [
      {
        categoryName: 'Ăn uống & Cà phê',
        increasePercentage: 24.8,
        recommendation: 'Giới hạn mức tiêu tối đa 200.000 ₫/ngày trong 7 ngày tới.',
      },
      {
        categoryName: 'Mua sắm & Quần áo',
        increasePercentage: 15.2,
        recommendation: 'Trì hoãn việc mua sắm không khẩn cấp sang tháng sau.',
      },
    ],
  },

  notifications: [
    {
      id: 'notif-1',
      title: 'Cảnh báo hạn mức ngân sách',
      message: 'Hạng mục "Ăn uống & Cà phê" đã tiêu 5.600.000 ₫ (đạt 80.0% hạn mức 7.000.000 ₫). Hãy chú ý chi tiêu!',
      time: '10 phút trước',
      type: 'WARNING',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'Hạn mức chi tiêu chạm mức cao',
      message: 'Hạng mục "Mua sắm & Gia đình" đã tiêu 3.450.000 ₫ (đạt 86.3% hạn mức 4.000.000 ₫).',
      time: '1 giờ trước',
      type: 'ALERT',
      read: false,
    },
    {
      id: 'notif-3',
      title: 'Chúc mừng đạt mục tiêu!',
      message: 'Mục tiêu "Quỹ dự phòng khẩn cấp 6 tháng" đã hoàn thành 100% với số tiền 60.000.000 ₫.',
      time: 'Hôm qua',
      type: 'SUCCESS',
      read: true,
    },
    {
      id: 'notif-4',
      title: 'Không gian gia đình FAM-001',
      message: 'Thành viên Nguyễn Trường An vừa tham gia và đồng bộ vào sổ quỹ gia đình.',
      time: '2 ngày trước',
      type: 'INFO',
      read: true,
    },
  ],

  isBotModalOpen: false,
  isTransactionModalOpen: false,
  isWalletModalOpen: false,
  isBudgetModalOpen: false,
  isGoalModalOpen: false,
  isFamilyModalOpen: false,

  setAuth: (user, token) => {
    localStorage.setItem('budglee_token', token);
    set({ currentUser: user, token });
  },

  logout: () => {
    localStorage.removeItem('budglee_token');
    set({ currentUser: null, token: null });
  },

  setActiveTimeframe: (activeTimeframe) => set({ activeTimeframe }),

  markNotificationAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllNotificationsAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  setWallets: (wallets) => set({ wallets }),

  addWallet: (walletData) => {
    const newWallet: Wallet = {
      ...walletData,
      id: Date.now(),
    };
    set((state) => ({ wallets: [...state.wallets, newWallet] }));
  },

  setTransactions: (recentTransactions) => set({ recentTransactions }),

  addTransaction: (txData) => {
    const newTx: Transaction = {
      ...txData,
      id: Date.now(),
    };
    set((state) => {
      // Cập nhật số dư ví
      const updatedWallets = state.wallets.map((w) => {
        if (w.id === txData.walletId) {
          const newBal =
            txData.transactionType === 'INCOME'
              ? w.balance + txData.amount
              : w.balance - txData.amount;
          return { ...w, balance: newBal };
        }
        return w;
      });

      return {
        recentTransactions: [newTx, ...state.recentTransactions],
        wallets: updatedWallets,
      };
    });
  },

  setBudgets: (budgets) => set({ budgets }),

  addBudget: (budgetData) => {
    const newBudget: Budget = {
      ...budgetData,
      id: Date.now(),
    };
    set((state) => ({ budgets: [...state.budgets, newBudget] }));
  },

  setSavingGoals: (savingGoals) => set({ savingGoals }),

  addSavingGoal: (goalData) => {
    const newGoal: SavingGoal = {
      ...goalData,
      id: Date.now(),
    };
    set((state) => ({ savingGoals: [...state.savingGoals, newGoal] }));
  },

  depositToGoal: (goalId, walletId, amount) => {
    set((state) => {
      const selectedWallet = state.wallets.find((w) => w.id === walletId);
      const selectedGoal = state.savingGoals.find((g) => g.id === goalId);

      // Trừ tiền từ ví
      const updatedWallets = state.wallets.map((w) => {
        if (w.id === walletId) {
          return { ...w, balance: Math.max(0, w.balance - amount) };
        }
        return w;
      });

      // Tăng tiền tích lũy cho mục tiêu
      const updatedGoals = state.savingGoals.map((g) => {
        if (g.id === goalId) {
          const updatedCurrent = g.currentAmount + amount;
          const isDone = updatedCurrent >= g.targetAmount;
          return {
            ...g,
            currentAmount: updatedCurrent,
            status: isDone ? ('COMPLETED' as const) : g.status,
          };
        }
        return g;
      });

      // Tạo giao dịch chuyển khoản vào mục tiêu
      const newTx: Transaction = {
        id: Date.now(),
        walletId,
        walletName: selectedWallet?.walletName || 'Tài khoản',
        categoryName: 'Tích lũy & Mục tiêu',
        categoryIcon: 'PiggyBank',
        actionTitle: `Nạp tiền tích lũy: ${selectedGoal?.goalName || 'Mục tiêu'}`,
        amount,
        transactionType: 'TRANSFER',
        balanceAfter: (selectedWallet?.balance || 0) - amount,
        transactionDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        note: `Trích tiền từ ${selectedWallet?.walletName || 'ví'} vào quỹ tích lũy`,
      };

      return {
        wallets: updatedWallets,
        savingGoals: updatedGoals,
        recentTransactions: [newTx, ...state.recentTransactions],
      };
    });
  },

  addFamilyMember: (memberData) => {
    const newMember: FamilyMember = {
      ...memberData,
      id: Date.now(),
      joinedDate: 'Hôm nay',
    };
    set((state) => ({ familyMembers: [...state.familyMembers, newMember] }));
  },

  setBotModalOpen: (isBotModalOpen) => set({ isBotModalOpen }),
  setTransactionModalOpen: (isTransactionModalOpen) => set({ isTransactionModalOpen }),
  setWalletModalOpen: (isWalletModalOpen) => set({ isWalletModalOpen }),
  setBudgetModalOpen: (isBudgetModalOpen) => set({ isBudgetModalOpen }),
  setGoalModalOpen: (isGoalModalOpen) => set({ isGoalModalOpen }),
  setFamilyModalOpen: (isFamilyModalOpen) => set({ isFamilyModalOpen }),
}));
