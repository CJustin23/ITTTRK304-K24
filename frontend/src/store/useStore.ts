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
  Role,
  FamilyInvitation,
} from '../types';
import { FamilyApiService } from '../services/api';

// Dữ liệu mẫu (Rich Demo Data) dành riêng cho tài khoản Demo
export const DEMO_WALLETS: Wallet[] = [
  { id: 1, walletName: 'Techcombank Primary', cardNumberMasked: '**** 4892', balance: 45200000, currency: 'VND', type: 'BANK', color: 'from-slate-900 to-indigo-950' },
  { id: 2, walletName: 'Visa Signature Card', cardNumberMasked: '**** 9012', balance: 18500000, currency: 'VND', type: 'CREDIT_CARD', color: 'from-emerald-900 to-teal-950' },
  { id: 3, walletName: 'Ví tiền mặt (Cash)', cardNumberMasked: '', balance: 3450000, currency: 'VND', type: 'CASH', color: 'from-amber-900 to-orange-950' },
];

export const DEMO_TRANSACTIONS: Transaction[] = [
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
];

export const DEMO_BUDGETS: Budget[] = [
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
];

export const DEMO_GOALS: SavingGoal[] = [
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
];

export const DEMO_MEMBERS: FamilyMember[] = [
  {
    id: 1,
    fullName: 'Nguyễn Tiến Thành (Bạn)',
    email: 'demo@budglee.com',
    role: 'FAMILY_MEMBER',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    joinedDate: '20/10/2026',
    isOwner: false,
  },
  {
    id: 2,
    fullName: 'Nguyễn Trường An (Chủ hộ)',
    email: 'an.nt@budglee.com',
    role: 'FAMILY_ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    joinedDate: '20/10/2026',
    isOwner: true,
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
];

export const DEMO_SUMMARY: DashboardSummary = {
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
};

export const DEMO_BOT_RECOMMENDATION: HabitRecommendation = {
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
};

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
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
];

// Helper: tính toán DashboardSummary theo dữ liệu hiện tại
export const calculateDashboardSummary = (
  wallets: Wallet[],
  transactions: Transaction[],
  budgets: Budget[]
): DashboardSummary => {
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const monthlyIncome = transactions
    .filter((t) => t.transactionType === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlySpending = transactions
    .filter((t) => t.transactionType === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);
  const leftToSpend = Math.max(0, monthlyIncome - monthlySpending);

  const totalLimit = budgets.reduce((sum, b) => sum + b.amountLimit, 0);
  const spendingPercentageOfBudget = totalLimit > 0 ? (monthlySpending / totalLimit) * 100 : 0;

  const categoryExpenses: Record<string, number> = {};
  transactions
    .filter((t) => t.transactionType === 'EXPENSE')
    .forEach((t) => {
      const cat = t.categoryName || 'Khác';
      categoryExpenses[cat] = (categoryExpenses[cat] || 0) + t.amount;
    });

  const spentTrends = [
    { label: 'Thứ 2', amount: 0 },
    { label: 'Thứ 3', amount: 0 },
    { label: 'Thứ 4', amount: 0 },
    { label: 'Thứ 5', amount: 0 },
    { label: 'Thứ 6', amount: 0 },
    { label: 'Thứ 7', amount: 0 },
    { label: 'Chủ nhật', amount: 0 },
  ];

  return {
    totalBalance,
    monthlyIncome,
    monthlySpending,
    leftToSpend,
    spendingPercentageOfBudget,
    categoryExpenses,
    spentTrends,
  };
};

interface AppState {
  currentUser: User | null;
  token: string | null;

  wallets: Wallet[];
  recentTransactions: Transaction[];
  budgets: Budget[];
  savingGoals: SavingGoal[];
  familyMembers: FamilyMember[];
  notifications: NotificationItem[];
  receivedInvitations: FamilyInvitation[];
  sentInvitations: FamilyInvitation[];

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
  isConfirmInviteModalOpen: boolean;
  selectedInvitationForConfirm: FamilyInvitation | null;

  // Actions
  setAuth: (
    user: User,
    token: string,
    isNewRegistration?: boolean,
    initialMembers?: Omit<FamilyMember, 'id' | 'joinedDate'>[]
  ) => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
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
  updateBudget: (id: number, budgetData: Partial<Budget>) => void;
  deleteBudget: (id: number) => void;

  // Saving Goal actions
  setSavingGoals: (goals: SavingGoal[]) => void;
  addSavingGoal: (goal: Omit<SavingGoal, 'id'>) => void;
  depositToGoal: (goalId: number, walletId: number, amount: number) => void;

  // Family actions
  addFamilyMember: (member: Omit<FamilyMember, 'id' | 'joinedDate'>) => void;
  removeFamilyMember: (id: number) => void;
  updateMemberRole: (id: number, role: Role) => void;
  upgradeToFamilyAdmin: (
    familyGroupName: string,
    initialMembers?: Omit<FamilyMember, 'id' | 'joinedDate'>[]
  ) => void;

  // Family Invitation actions
  fetchReceivedInvitations: () => Promise<void>;
  fetchSentInvitations: () => Promise<void>;
  sendFamilyInvitation: (email: string) => Promise<FamilyInvitation>;
  acceptFamilyInvitation: (invitationId: number) => Promise<void>;
  rejectFamilyInvitation: (invitationId: number) => Promise<void>;
  cancelSentInvitation: (invitationId: number) => Promise<void>;

  // Modal actions
  setBotModalOpen: (open: boolean) => void;
  setTransactionModalOpen: (open: boolean) => void;
  setWalletModalOpen: (open: boolean) => void;
  setBudgetModalOpen: (open: boolean) => void;
  setGoalModalOpen: (open: boolean) => void;
  setFamilyModalOpen: (open: boolean) => void;
  setConfirmInviteModalOpen: (open: boolean) => void;
  setSelectedInvitationForConfirm: (invitation: FamilyInvitation | null) => void;
}

// Lưu trữ tập trung dữ liệu tài khoản vào localStorage
export const persistCurrentUserData = (
  user: User | null,
  data: {
    wallets?: Wallet[];
    recentTransactions?: Transaction[];
    budgets?: Budget[];
    savingGoals?: SavingGoal[];
    familyMembers?: FamilyMember[];
    notifications?: NotificationItem[];
    dashboardSummary?: DashboardSummary | null;
    botRecommendation?: HabitRecommendation | null;
  }
) => {
  if (!user || !user.email || typeof window === 'undefined') return;
  try {
    const storageKey = 'budglee_data_' + user.email.toLowerCase();
    const existingStr = localStorage.getItem(storageKey);
    let existingData: any = {};
    if (existingStr) {
      try {
        existingData = JSON.parse(existingStr);
      } catch {}
    }

    const payload = {
      wallets: data.wallets ?? existingData.wallets ?? [],
      recentTransactions: data.recentTransactions ?? existingData.recentTransactions ?? [],
      budgets: data.budgets ?? existingData.budgets ?? [],
      savingGoals: data.savingGoals ?? existingData.savingGoals ?? [],
      familyMembers: data.familyMembers ?? existingData.familyMembers ?? [],
      notifications: data.notifications ?? existingData.notifications ?? [],
      dashboardSummary: data.dashboardSummary !== undefined ? data.dashboardSummary : (existingData.dashboardSummary ?? null),
      botRecommendation: data.botRecommendation !== undefined ? data.botRecommendation : (existingData.botRecommendation ?? null),
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (err) {
    console.error('Lỗi khi lưu dữ liệu người dùng vào localStorage:', err);
  }
};

// Khôi phục trạng thái đăng nhập từ localStorage khi reload / F5 trang
const loadInitialAuthState = () => {
  if (typeof window === 'undefined') {
    return {
      currentUser: null,
      token: null,
      wallets: [],
      recentTransactions: [],
      budgets: [],
      savingGoals: [],
      familyMembers: [],
      notifications: [],
      dashboardSummary: null,
      botRecommendation: null,
      receivedInvitations: [],
      sentInvitations: [],
    };
  }

  const storedUserStr = localStorage.getItem('budglee_current_user');
  const storedToken = localStorage.getItem('budglee_token');

  if (!storedUserStr || !storedToken) {
    return {
      currentUser: null,
      token: null,
      wallets: [],
      recentTransactions: [],
      budgets: [],
      savingGoals: [],
      familyMembers: [],
      notifications: [],
      dashboardSummary: null,
      botRecommendation: null,
      receivedInvitations: [],
      sentInvitations: [],
    };
  }

  try {
    const user: User = JSON.parse(storedUserStr);
    const emailKey = user.email ? user.email.toLowerCase() : 'default';
    const isDemo = emailKey === 'demo@budglee.com';
    const storageKey = 'budglee_data_' + emailKey;
    const savedDataStr = localStorage.getItem(storageKey);

    if (savedDataStr) {
      const saved = JSON.parse(savedDataStr);
      const loadedWallets = saved.wallets ?? (isDemo ? DEMO_WALLETS : []);
      const loadedTxs = saved.recentTransactions ?? (isDemo ? DEMO_TRANSACTIONS : []);
      const loadedBudgets = saved.budgets ?? (isDemo ? DEMO_BUDGETS : []);
      const loadedGoals = saved.savingGoals ?? (isDemo ? DEMO_GOALS : []);
      const loadedMembers = saved.familyMembers ?? (isDemo ? DEMO_MEMBERS : []);
      const loadedNotifs = saved.notifications ?? (isDemo ? DEMO_NOTIFICATIONS : []);
      const loadedSummary = saved.dashboardSummary || calculateDashboardSummary(loadedWallets, loadedTxs, loadedBudgets);

      return {
        currentUser: user,
        token: storedToken,
        wallets: loadedWallets,
        recentTransactions: loadedTxs,
        budgets: loadedBudgets,
        savingGoals: loadedGoals,
        familyMembers: loadedMembers,
        notifications: loadedNotifs,
        dashboardSummary: loadedSummary,
        botRecommendation: saved.botRecommendation ?? (isDemo ? DEMO_BOT_RECOMMENDATION : null),
        receivedInvitations: [],
        sentInvitations: [],
      };
    }

    if (isDemo) {
      const demoData = {
        wallets: DEMO_WALLETS,
        recentTransactions: DEMO_TRANSACTIONS,
        budgets: DEMO_BUDGETS,
        savingGoals: DEMO_GOALS,
        familyMembers: DEMO_MEMBERS,
        notifications: DEMO_NOTIFICATIONS,
        dashboardSummary: DEMO_SUMMARY,
        botRecommendation: DEMO_BOT_RECOMMENDATION,
      };
      persistCurrentUserData(user, demoData);
      return {
        currentUser: user,
        token: storedToken,
        ...demoData,
        receivedInvitations: [],
        sentInvitations: [],
      };
    }

    const defaultData = {
      wallets: [],
      recentTransactions: [],
      budgets: [],
      savingGoals: [],
      familyMembers: [],
      notifications: [],
      dashboardSummary: calculateDashboardSummary([], [], []),
      botRecommendation: null,
    };
    persistCurrentUserData(user, defaultData);
    return {
      currentUser: user,
      token: storedToken,
      ...defaultData,
      receivedInvitations: [],
      sentInvitations: [],
    };
  } catch (err) {
    console.error('Lỗi khi khôi phục phiên đăng nhập:', err);
    return {
      currentUser: null,
      token: null,
      wallets: [],
      recentTransactions: [],
      budgets: [],
      savingGoals: [],
      familyMembers: [],
      notifications: [],
      dashboardSummary: null,
      botRecommendation: null,
      receivedInvitations: [],
      sentInvitations: [],
    };
  }
};

const initialAuthState = loadInitialAuthState();

export const useStore = create<AppState>((set, get) => ({
  currentUser: initialAuthState.currentUser,
  token: initialAuthState.token,
  activeTimeframe: 'Monthly',

  wallets: initialAuthState.wallets,
  recentTransactions: initialAuthState.recentTransactions,
  budgets: initialAuthState.budgets,
  savingGoals: initialAuthState.savingGoals,
  familyMembers: initialAuthState.familyMembers,
  notifications: initialAuthState.notifications,
  receivedInvitations: initialAuthState.receivedInvitations,
  sentInvitations: initialAuthState.sentInvitations,

  dashboardSummary: initialAuthState.dashboardSummary,
  botRecommendation: initialAuthState.botRecommendation,

  isBotModalOpen: false,
  isTransactionModalOpen: false,
  isWalletModalOpen: false,
  isBudgetModalOpen: false,
  isGoalModalOpen: false,
  isFamilyModalOpen: false,
  isConfirmInviteModalOpen: false,
  selectedInvitationForConfirm: null,

  setAuth: (user, token, isNewRegistration, initialMembers) => {
    localStorage.setItem('budglee_token', token);
    localStorage.setItem('budglee_current_user', JSON.stringify(user));

    const isDemo = user.email.toLowerCase() === 'demo@budglee.com';
    const storageKey = 'budglee_data_' + user.email.toLowerCase();
    const savedDataStr = localStorage.getItem(storageKey);

    // Nếu đã có dữ liệu lưu trữ từ trước (kể cả demo hay user thực) và không phải đăng ký mới:
    if (savedDataStr && !isNewRegistration) {
      try {
        const saved = JSON.parse(savedDataStr);
        const loadedWallets = saved.wallets ?? (isDemo ? DEMO_WALLETS : []);
        const loadedTxs = saved.recentTransactions ?? (isDemo ? DEMO_TRANSACTIONS : []);
        const loadedBudgets = saved.budgets ?? (isDemo ? DEMO_BUDGETS : []);
        const loadedGoals = saved.savingGoals ?? (isDemo ? DEMO_GOALS : []);
        const loadedMembers = saved.familyMembers ?? (isDemo ? DEMO_MEMBERS : []);
        const loadedNotifs = saved.notifications ?? (isDemo ? DEMO_NOTIFICATIONS : []);
        const loadedSummary = saved.dashboardSummary || calculateDashboardSummary(loadedWallets, loadedTxs, loadedBudgets);

        set({
          currentUser: user,
          token,
          wallets: loadedWallets,
          recentTransactions: loadedTxs,
          budgets: loadedBudgets,
          savingGoals: loadedGoals,
          familyMembers: loadedMembers,
          notifications: loadedNotifs,
          dashboardSummary: loadedSummary,
          botRecommendation: saved.botRecommendation ?? (isDemo ? DEMO_BOT_RECOMMENDATION : null),
        });
        setTimeout(() => {
          get().fetchReceivedInvitations();
          get().fetchSentInvitations();
        }, 50);
        return;
      } catch (err) {
        console.error('Failed to parse saved user data:', err);
      }
    }

    if (isDemo && !isNewRegistration) {
      // Lần đầu mở demo: nạp bộ dữ liệu mẫu phong phú
      const demoState = {
        wallets: DEMO_WALLETS,
        recentTransactions: DEMO_TRANSACTIONS,
        budgets: DEMO_BUDGETS,
        savingGoals: DEMO_GOALS,
        familyMembers: DEMO_MEMBERS,
        notifications: DEMO_NOTIFICATIONS,
        dashboardSummary: DEMO_SUMMARY,
        botRecommendation: DEMO_BOT_RECOMMENDATION,
      };
      set({
        currentUser: user,
        token,
        ...demoState,
      });
      persistCurrentUserData(user, demoState);
      setTimeout(() => {
        get().fetchReceivedInvitations();
        get().fetchSentInvitations();
      }, 50);
      return;
    }

    // KHỞI TẠO TÀI KHOẢN MỚI HOÀN TOÀN SẠCH (KHÔNG DÍNH DỮ LIỆU TÀI KHOẢN KHÁC)
    const newMembers: FamilyMember[] = [];
    if (user.role === 'FAMILY_ADMIN') {
      newMembers.push({
        id: user.id || Date.now(),
        fullName: user.fullName + ' (Bạn)',
        email: user.email,
        role: 'FAMILY_ADMIN',
        avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
        joinedDate: 'Hôm nay',
        isOwner: true,
      });

      if (initialMembers && initialMembers.length > 0) {
        initialMembers.forEach((m, idx) => {
          newMembers.push({
            id: Date.now() + idx + 10,
            fullName: m.fullName,
            email: m.email,
            role: m.role || 'FAMILY_MEMBER',
            avatarUrl: m.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
            joinedDate: 'Hôm nay',
            isOwner: false,
          });
        });
      }
    }

    const emptySummary = calculateDashboardSummary([], [], []);
    const welcomeNotifications: NotificationItem[] = [
      {
        id: 'welcome-001',
        title: 'Chào mừng bạn đến với Budglee!',
        message: `Tài khoản ${user.fullName} đã sẵn sàng. Hãy bắt đầu bằng việc thêm ví hoặc thiết lập ngân sách chi tiêu!`,
        time: 'Vừa xong',
        type: 'INFO',
        read: false,
      },
    ];

    const freshState = {
      wallets: [],
      recentTransactions: [],
      budgets: [],
      savingGoals: [],
      familyMembers: newMembers,
      notifications: welcomeNotifications,
      dashboardSummary: emptySummary,
      botRecommendation: null,
    };

    set({
      currentUser: user,
      token,
      ...freshState,
    });
    persistCurrentUserData(user, freshState);
    setTimeout(() => {
      get().fetchReceivedInvitations();
      get().fetchSentInvitations();
    }, 50);
  },

  logout: () => {
    localStorage.removeItem('budglee_token');
    localStorage.removeItem('budglee_current_user');
    localStorage.removeItem('budglee_active_tab');
    set({
      currentUser: null,
      token: null,
      wallets: [],
      recentTransactions: [],
      budgets: [],
      savingGoals: [],
      familyMembers: [],
      notifications: [],
      receivedInvitations: [],
      sentInvitations: [],
      dashboardSummary: null,
      botRecommendation: null,
    });
  },

  updateProfile: (data) => {
    set((state) => {
      if (!state.currentUser) return state;
      const updatedUser = { ...state.currentUser, ...data };
      localStorage.setItem('budglee_current_user', JSON.stringify(updatedUser));

      if (updatedUser.email) {
        const userKey = 'budglee_user_' + updatedUser.email.toLowerCase();
        const existing = localStorage.getItem(userKey);
        if (existing) {
          try {
            const parsed = JSON.parse(existing);
            localStorage.setItem(userKey, JSON.stringify({ ...parsed, ...data }));
          } catch {}
        }
      }

      persistCurrentUserData(updatedUser, state);
      return { currentUser: updatedUser };
    });
  },

  setActiveTimeframe: (activeTimeframe) => set({ activeTimeframe }),

  markNotificationAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      const newState = { notifications: updated };
      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  markAllNotificationsAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      const newState = { notifications: updated };
      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  setWallets: (wallets) => {
    set((state) => {
      const updatedSummary = calculateDashboardSummary(wallets, state.recentTransactions, state.budgets);
      const newState = { wallets, dashboardSummary: updatedSummary };
      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  addWallet: (walletData) => {
    const newWallet: Wallet = {
      ...walletData,
      id: Date.now(),
      cardNumberMasked: walletData.cardNumberMasked || '',
    };
    set((state) => {
      const updatedWallets = [...state.wallets, newWallet];
      const updatedSummary = calculateDashboardSummary(updatedWallets, state.recentTransactions, state.budgets);
      const newState = { wallets: updatedWallets, dashboardSummary: updatedSummary };
      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  setTransactions: (recentTransactions) => {
    set((state) => {
      const updatedSummary = calculateDashboardSummary(state.wallets, recentTransactions, state.budgets);
      const newState = { recentTransactions, dashboardSummary: updatedSummary };
      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  addTransaction: (txData) => {
    const newTx: Transaction = {
      ...txData,
      id: Date.now(),
    };
    set((state) => {
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

      const updatedTxs = [newTx, ...state.recentTransactions];

      // Cập nhật số tiền đã chi tiêu của ngân sách tương ứng nếu là giao dịch CHI TIÊU
      const updatedBudgets = state.budgets.map((b) => {
        if (txData.transactionType === 'EXPENSE' && b.categoryName === txData.categoryName) {
          return { ...b, spentAmount: (b.spentAmount || 0) + txData.amount };
        }
        return b;
      });

      const updatedSummary = calculateDashboardSummary(updatedWallets, updatedTxs, updatedBudgets);

      const newState = {
        recentTransactions: updatedTxs,
        wallets: updatedWallets,
        budgets: updatedBudgets,
        dashboardSummary: updatedSummary,
      };

      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  setBudgets: (budgets) => {
    set((state) => {
      const updatedSummary = calculateDashboardSummary(state.wallets, state.recentTransactions, budgets);
      const newState = { budgets, dashboardSummary: updatedSummary };
      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  addBudget: (budgetData) => {
    const newBudget: Budget = {
      ...budgetData,
      id: Date.now(),
    };
    set((state) => {
      const updatedBudgets = [...state.budgets, newBudget];
      const updatedSummary = calculateDashboardSummary(state.wallets, state.recentTransactions, updatedBudgets);
      const newState = { budgets: updatedBudgets, dashboardSummary: updatedSummary };
      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  updateBudget: (id, budgetData) => {
    set((state) => {
      const updatedBudgets = state.budgets.map((b) =>
        b.id === id ? { ...b, ...budgetData } : b
      );
      const updatedSummary = calculateDashboardSummary(state.wallets, state.recentTransactions, updatedBudgets);
      const newState = { budgets: updatedBudgets, dashboardSummary: updatedSummary };
      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  deleteBudget: (id) => {
    set((state) => {
      const updatedBudgets = state.budgets.filter((b) => b.id !== id);
      const updatedSummary = calculateDashboardSummary(state.wallets, state.recentTransactions, updatedBudgets);
      const newState = { budgets: updatedBudgets, dashboardSummary: updatedSummary };
      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  setSavingGoals: (savingGoals) => {
    set((state) => {
      const newState = { savingGoals };
      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  addSavingGoal: (goalData) => {
    const newGoal: SavingGoal = {
      ...goalData,
      id: Date.now(),
    };
    set((state) => {
      const updatedGoals = [...state.savingGoals, newGoal];
      const newState = { savingGoals: updatedGoals };
      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  depositToGoal: (goalId, walletId, amount) => {
    set((state) => {
      const selectedWallet = state.wallets.find((w) => w.id === walletId);
      const selectedGoal = state.savingGoals.find((g) => g.id === goalId);

      const updatedWallets = state.wallets.map((w) => {
        if (w.id === walletId) {
          return { ...w, balance: Math.max(0, w.balance - amount) };
        }
        return w;
      });

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

      const updatedTxs = [newTx, ...state.recentTransactions];
      const updatedSummary = calculateDashboardSummary(updatedWallets, updatedTxs, state.budgets);

      const newState = {
        wallets: updatedWallets,
        savingGoals: updatedGoals,
        recentTransactions: updatedTxs,
        dashboardSummary: updatedSummary,
      };

      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  addFamilyMember: (memberData) => {
    const newMember: FamilyMember = {
      ...memberData,
      id: Date.now(),
      joinedDate: 'Hôm nay',
    };
    set((state) => {
      const updated = [...state.familyMembers, newMember];
      const newState = { familyMembers: updated };
      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  removeFamilyMember: (id) => {
    set((state) => {
      const updated = state.familyMembers.filter((m) => m.id !== id);
      const newState = { familyMembers: updated };
      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  updateMemberRole: (id, role) => {
    set((state) => {
      const updated = state.familyMembers.map((m) =>
        m.id === id ? { ...m, role } : m
      );
      const newState = { familyMembers: updated };
      persistCurrentUserData(state.currentUser, newState);
      return newState;
    });
  },

  upgradeToFamilyAdmin: (familyGroupName, initialMembers) => {
    set((state) => {
      if (!state.currentUser) return state;
      const updatedUser: User = {
        ...state.currentUser,
        role: 'FAMILY_ADMIN',
        familyGroupId: 'FAM-' + Math.floor(100 + Math.random() * 900),
        familyGroupName,
      };

      const newMembers: FamilyMember[] = [
        {
          id: updatedUser.id,
          fullName: updatedUser.fullName + ' (Bạn)',
          email: updatedUser.email,
          role: 'FAMILY_ADMIN',
          avatarUrl: updatedUser.avatarUrl,
          joinedDate: 'Hôm nay',
          isOwner: true,
        },
      ];

      if (initialMembers && initialMembers.length > 0) {
        initialMembers.forEach((m, idx) => {
          newMembers.push({
            id: Date.now() + idx + 1,
            fullName: m.fullName,
            email: m.email,
            role: m.role || 'FAMILY_MEMBER',
            avatarUrl: m.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
            joinedDate: 'Hôm nay',
            isOwner: false,
          });
        });
      }

      localStorage.setItem('budglee_current_user', JSON.stringify(updatedUser));
      const newState = {
        currentUser: updatedUser,
        familyMembers: newMembers,
      };

      persistCurrentUserData(updatedUser, newState);
      return newState;
    });
  },

  setBotModalOpen: (isBotModalOpen) => set({ isBotModalOpen }),
  setTransactionModalOpen: (isTransactionModalOpen) => set({ isTransactionModalOpen }),
  setWalletModalOpen: (isWalletModalOpen) => set({ isWalletModalOpen }),
  setBudgetModalOpen: (isBudgetModalOpen) => set({ isBudgetModalOpen }),
  setGoalModalOpen: (isGoalModalOpen) => set({ isGoalModalOpen }),
  setFamilyModalOpen: (isFamilyModalOpen) => set({ isFamilyModalOpen }),
  setConfirmInviteModalOpen: (isConfirmInviteModalOpen) => set({ isConfirmInviteModalOpen }),
  setSelectedInvitationForConfirm: (selectedInvitationForConfirm) => set({ selectedInvitationForConfirm }),

  fetchReceivedInvitations: async () => {
    const user = get().currentUser;
    if (!user) return;

    let invites: FamilyInvitation[] = [];
    try {
      invites = await FamilyApiService.getReceivedInvitations();
    } catch (e) {
      // Backend request fallback
    }

    // Kiểm tra thêm ở hàng đợi lời mời localStorage
    const localStr = localStorage.getItem('budglee_invitations_for_' + user.email.toLowerCase());
    if (localStr) {
      try {
        const localInvites: FamilyInvitation[] = JSON.parse(localStr);
        localInvites.forEach((li) => {
          if (!invites.some((i) => i.id === li.id)) {
            invites.push(li);
          }
        });
      } catch (e) {}
    }

    set({ receivedInvitations: invites });

    // Tự động đẩy thông báo lên chuông thông báo nếu có lời mời PENDING
    const pendingInvites = invites.filter((i) => i.status === 'PENDING');
    if (pendingInvites.length > 0) {
      set((state) => {
        const newNotifs = [...state.notifications];
        pendingInvites.forEach((inv) => {
          const notifId = 'invite-notif-' + inv.id;
          if (!newNotifs.some((n) => n.id === notifId)) {
            newNotifs.unshift({
              id: notifId,
              title: 'Lời mời tham gia Quỹ Gia đình',
              message: `${inv.invitedByName || 'Chủ hộ'} (${inv.invitedByEmail || 'chủ nhóm'}) đã gửi lời mời bạn tham gia nhóm gia đình "${inv.familyGroupName}". Hãy nhấn vào đây để xem và xác nhận!`,
              time: 'Vừa xong',
              type: 'INFO',
              read: false,
              actionType: 'FAMILY_INVITATION',
              actionData: inv,
            });
          }
        });
        return { notifications: newNotifs };
      });
    }
  },

  fetchSentInvitations: async () => {
    const user = get().currentUser;
    if (!user) return;

    let invites: FamilyInvitation[] = [];
    try {
      invites = await FamilyApiService.getSentInvitations();
    } catch (e) {}

    const localStr = localStorage.getItem('budglee_sent_invitations_' + user.email.toLowerCase());
    if (localStr) {
      try {
        const localInvites: FamilyInvitation[] = JSON.parse(localStr);
        localInvites.forEach((li) => {
          if (!invites.some((i) => i.id === li.id)) {
            invites.push(li);
          }
        });
      } catch (e) {}
    }

    set({ sentInvitations: invites });
  },

  sendFamilyInvitation: async (email: string) => {
    const user = get().currentUser;
    if (!user) throw new Error('Chưa đăng nhập');

    const trimmedEmail = email.trim().toLowerCase();
    let invitation: FamilyInvitation;

    try {
      invitation = await FamilyApiService.sendInvitation(trimmedEmail);
    } catch (err: any) {
      // Fallback local invitation
      invitation = {
        id: Date.now(),
        familyGroupId: user.familyGroupId || 'FAM-' + user.id,
        familyGroupName: user.familyGroupName || `Gia đình của ${user.fullName}`,
        invitedById: user.id,
        invitedByName: user.fullName,
        invitedByEmail: user.email,
        inviteeEmail: trimmedEmail,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      };
    }

    // Lưu vào hàng đợi local cho người nhận để test mượt trên localhost
    try {
      const recipientKey = 'budglee_invitations_for_' + trimmedEmail;
      const existRecv = JSON.parse(localStorage.getItem(recipientKey) || '[]');
      existRecv.unshift(invitation);
      localStorage.setItem(recipientKey, JSON.stringify(existRecv));

      const senderKey = 'budglee_sent_invitations_' + user.email.toLowerCase();
      const existSent = JSON.parse(localStorage.getItem(senderKey) || '[]');
      existSent.unshift(invitation);
      localStorage.setItem(senderKey, JSON.stringify(existSent));
    } catch (e) {}

    set((state) => ({
      sentInvitations: [invitation, ...state.sentInvitations.filter((i) => i.id !== invitation.id)],
    }));

    return invitation;
  },

  acceptFamilyInvitation: async (invitationId: number) => {
    const state = get();
    const user = state.currentUser;
    if (!user) return;

    let inv = state.receivedInvitations.find((i) => i.id === invitationId);
    if (!inv && state.selectedInvitationForConfirm) {
      inv = state.selectedInvitationForConfirm;
    }

    try {
      await FamilyApiService.acceptInvitation(invitationId);
    } catch (e) {}

    const groupName = inv?.familyGroupName || 'Sổ quỹ Gia đình';
    const groupId = inv?.familyGroupId || user.familyGroupId || 'FAM-JOINED';

    const updatedUser: User = {
      ...user,
      role: 'FAMILY_MEMBER',
      familyGroupId: groupId,
      familyGroupName: groupName,
    };

    localStorage.setItem('budglee_current_user', JSON.stringify(updatedUser));

    // Cập nhật trạng thái trong storage người nhận
    const recipientKey = 'budglee_invitations_for_' + user.email.toLowerCase();
    try {
      const existRecv: FamilyInvitation[] = JSON.parse(localStorage.getItem(recipientKey) || '[]');
      const updated = existRecv.map((i) => (i.id === invitationId ? { ...i, status: 'ACCEPTED' as const } : i));
      localStorage.setItem(recipientKey, JSON.stringify(updated));
    } catch (e) {}

    // Thông báo thành công
    const successNotif: NotificationItem = {
      id: 'accepted-' + Date.now(),
      title: 'Gia nhập gia đình thành công!',
      message: `Chúc mừng bạn đã trở thành thành viên của "${groupName}". Bạn đã có thể bắt đầu xem và quản lý sổ quỹ chung!`,
      time: 'Vừa xong',
      type: 'SUCCESS',
      read: false,
    };

    // Tạo member mới cho danh sách
    const newMember: FamilyMember = {
      id: user.id,
      fullName: user.fullName + ' (Bạn)',
      email: user.email,
      role: 'FAMILY_MEMBER',
      avatarUrl: user.avatarUrl,
      joinedDate: 'Vừa xong',
      isOwner: false,
    };

    set((s) => ({
      currentUser: updatedUser,
      receivedInvitations: s.receivedInvitations.map((i) =>
        i.id === invitationId ? { ...i, status: 'ACCEPTED' as const } : i
      ),
      familyMembers: [...s.familyMembers.filter((m) => m.email.toLowerCase() !== user.email.toLowerCase()), newMember],
      notifications: [
        successNotif,
        ...s.notifications.map((n) => (n.id === 'invite-notif-' + invitationId ? { ...n, read: true } : n)),
      ],
      isConfirmInviteModalOpen: false,
      selectedInvitationForConfirm: null,
    }));

    persistCurrentUserData(updatedUser, get());
  },

  rejectFamilyInvitation: async (invitationId: number) => {
    const user = get().currentUser;
    if (!user) return;

    try {
      await FamilyApiService.rejectInvitation(invitationId);
    } catch (e) {}

    const recipientKey = 'budglee_invitations_for_' + user.email.toLowerCase();
    try {
      const existRecv: FamilyInvitation[] = JSON.parse(localStorage.getItem(recipientKey) || '[]');
      const updated = existRecv.map((i) => (i.id === invitationId ? { ...i, status: 'REJECTED' as const } : i));
      localStorage.setItem(recipientKey, JSON.stringify(updated));
    } catch (e) {}

    set((s) => ({
      receivedInvitations: s.receivedInvitations.map((i) =>
        i.id === invitationId ? { ...i, status: 'REJECTED' as const } : i
      ),
      notifications: s.notifications.map((n) => (n.id === 'invite-notif-' + invitationId ? { ...n, read: true } : n)),
      isConfirmInviteModalOpen: false,
      selectedInvitationForConfirm: null,
    }));
  },

  cancelSentInvitation: async (invitationId: number) => {
    const user = get().currentUser;
    if (!user) return;

    try {
      await FamilyApiService.cancelInvitation(invitationId);
    } catch (e) {}

    const senderKey = 'budglee_sent_invitations_' + user.email.toLowerCase();
    try {
      const existSent: FamilyInvitation[] = JSON.parse(localStorage.getItem(senderKey) || '[]');
      const updated = existSent.filter((i) => i.id !== invitationId);
      localStorage.setItem(senderKey, JSON.stringify(updated));
    } catch (e) {}

    set((s) => ({
      sentInvitations: s.sentInvitations.filter((i) => i.id !== invitationId),
    }));
  },
}));
