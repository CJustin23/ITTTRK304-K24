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
import {
  FamilyApiService,
  WalletService,
  TransactionService,
  BudgetService,
  DashboardService,
} from '../services/api';

// ============================================================================
// HÀM TIỆN ÍCH TẠO NGÀY GIỜ THỜI GIAN THỰC (REAL-TIME DYNAMIC DATES)
// ============================================================================
export const getRealtimeDate = (daysAgo: number, timeStr: string = '10:00'): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} ${timeStr}`;
};

export const getRealtimeMonthDate = (monthsAgo: number, day: number = 10, timeStr: string = '10:00'): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(day);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayStr} ${timeStr}`;
};

export const currentMonthNum = new Date().getMonth() + 1;
export const currentYearNum = new Date().getFullYear();
export const prevMonth1Num = new Date(currentYearNum, currentMonthNum - 2, 1).getMonth() + 1;
export const prevMonth2Num = new Date(currentYearNum, currentMonthNum - 3, 1).getMonth() + 1;

// ============================================================================
// DỮ LIỆU MẪU: 1 TÀI KHOẢN CÁ NHÂN (thanhcanhan@gmail.com) - 10-20 DỮ LIỆU MỖI CHỨC NĂNG
// ============================================================================
export const THANHCANHAN_DATA: {
  wallets: Wallet[];
  recentTransactions: Transaction[];
  budgets: Budget[];
  savingGoals: SavingGoal[];
  notifications: NotificationItem[];
  botRecommendation: HabitRecommendation;
} = {
  wallets: [
    { id: 1, walletName: 'Techcombank Lương', cardNumberMasked: '**** 4892', balance: 45200000, currency: 'VND', type: 'BANK', color: 'from-slate-900 to-indigo-950' },
    { id: 2, walletName: 'Visa Platinum Debit', cardNumberMasked: '**** 9012', balance: 18500000, currency: 'VND', type: 'CREDIT_CARD', color: 'from-emerald-900 to-teal-950' },
    { id: 3, walletName: 'Ví MoMo Pay', cardNumberMasked: '0987***283', balance: 5800000, currency: 'VND', type: 'CASH', color: 'from-pink-900 to-rose-950' },
    { id: 4, walletName: 'Ví Tiền mặt (Cash)', cardNumberMasked: '', balance: 3450000, currency: 'VND', type: 'CASH', color: 'from-amber-900 to-orange-950' },
  ],
  recentTransactions: [
    {
      id: 101,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Lương & Thưởng',
      categoryIcon: 'BadgeDollarSign',
      actionTitle: `Nhận lương tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
      amount: 35000000,
      transactionType: 'INCOME',
      balanceAfter: 45200000,
      transactionDate: getRealtimeDate(0, '09:30'),
      note: 'Lương chuyển khoản công ty Budglee',
    },
    {
      id: 102,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Lương & Thưởng',
      categoryIcon: 'BadgeDollarSign',
      actionTitle: 'Thưởng hoàn thành dự án Sprint 2',
      amount: 10000000,
      transactionType: 'INCOME',
      balanceAfter: 55200000,
      transactionDate: getRealtimeDate(1, '16:00'),
      note: 'Thưởng dự án xuất sắc',
    },
    {
      id: 103,
      walletId: 2,
      walletName: 'Visa Platinum Debit',
      categoryName: 'Thu nhập khác',
      categoryIcon: 'TrendingUp',
      actionTitle: 'Tiền làm thêm Freelance Web',
      amount: 6500000,
      transactionType: 'INCOME',
      balanceAfter: 25000000,
      transactionDate: getRealtimeDate(1, '11:20'),
      note: 'Thiết kế giao diện landing page',
    },
    {
      id: 104,
      walletId: 2,
      walletName: 'Visa Platinum Debit',
      categoryName: 'Ăn uống & Cà phê',
      categoryIcon: 'Utensils',
      actionTitle: 'Ăn tối Pizza 4P’s cùng bạn bè',
      amount: 850000,
      transactionType: 'EXPENSE',
      balanceAfter: 24150000,
      transactionDate: getRealtimeDate(2, '19:45'),
      note: 'Gặp gỡ bạn bè cuối tuần',
    },
    {
      id: 105,
      walletId: 3,
      walletName: 'Ví MoMo Pay',
      categoryName: 'Ăn uống & Cà phê',
      categoryIcon: 'Coffee',
      actionTitle: 'Highlands Coffee làm việc sáng',
      amount: 85000,
      transactionType: 'EXPENSE',
      balanceAfter: 5715000,
      transactionDate: getRealtimeDate(2, '08:30'),
      note: 'Freeze trà xanh size L',
    },
    {
      id: 106,
      walletId: 3,
      walletName: 'Ví MoMo Pay',
      categoryName: 'Ăn uống & Cà phê',
      categoryIcon: 'Utensils',
      actionTitle: 'Ăn trưa cơm văn phòng',
      amount: 55000,
      transactionType: 'EXPENSE',
      balanceAfter: 5660000,
      transactionDate: getRealtimeDate(3, '12:15'),
      note: 'Cơm sườn bì chả',
    },
    {
      id: 107,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Hóa đơn & Tiện ích',
      categoryIcon: 'Receipt',
      actionTitle: 'Thanh toán tiền điện sinh hoạt EVN',
      amount: 1250000,
      transactionType: 'EXPENSE',
      balanceAfter: 53950000,
      transactionDate: getRealtimeDate(3, '14:00'),
      note: 'Hóa đơn tiền điện tháng này',
    },
    {
      id: 108,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Hóa đơn & Tiện ích',
      categoryIcon: 'Receipt',
      actionTitle: 'Cước cáp quang Internet VNPT',
      amount: 330000,
      transactionType: 'EXPENSE',
      balanceAfter: 53620000,
      transactionDate: getRealtimeDate(4, '14:30'),
      note: 'Gói Home Net 200Mbps',
    },
    {
      id: 109,
      walletId: 4,
      walletName: 'Ví Tiền mặt (Cash)',
      categoryName: 'Di chuyển & Xăng xe',
      categoryIcon: 'Car',
      actionTitle: 'Đổ xăng xe máy Shell FuelSave',
      amount: 110000,
      transactionType: 'EXPENSE',
      balanceAfter: 3340000,
      transactionDate: getRealtimeDate(4, '07:45'),
      note: 'Xăng RON 95-V',
    },
    {
      id: 110,
      walletId: 2,
      walletName: 'Visa Platinum Debit',
      categoryName: 'Mua sắm cá nhân',
      categoryIcon: 'ShoppingBag',
      actionTitle: 'Mua bàn phím cơ Keychron K3 Pro',
      amount: 1450000,
      transactionType: 'EXPENSE',
      balanceAfter: 22700000,
      transactionDate: getRealtimeDate(5, '15:20'),
      note: 'Phục vụ lập trình code',
    },
    {
      id: 111,
      walletId: 3,
      walletName: 'Ví MoMo Pay',
      categoryName: 'Mua sắm cá nhân',
      categoryIcon: 'ShoppingBag',
      actionTitle: 'Mua sắm tạp hóa siêu thị WinMart',
      amount: 480000,
      transactionType: 'EXPENSE',
      balanceAfter: 5180000,
      transactionDate: getRealtimeDate(5, '18:30'),
      note: 'Sữa tươi, bánh mì, trái cây',
    },
    {
      id: 112,
      walletId: 3,
      walletName: 'Ví MoMo Pay',
      categoryName: 'Giải trí & Du lịch',
      categoryIcon: 'Film',
      actionTitle: 'Vé xem phim CGV cuối tuần',
      amount: 240000,
      transactionType: 'EXPENSE',
      balanceAfter: 4940000,
      transactionDate: getRealtimeDate(6, '20:00'),
      note: '2 vé phim IMAX 3D',
    },
    {
      id: 113,
      walletId: 2,
      walletName: 'Visa Platinum Debit',
      categoryName: 'Học tập & Phát triển',
      categoryIcon: 'BookOpen',
      actionTitle: 'Mua sách công nghệ chuyên sâu Tiki',
      amount: 350000,
      transactionType: 'EXPENSE',
      balanceAfter: 22350000,
      transactionDate: getRealtimeDate(6, '10:15'),
      note: 'Sách Thiết kế kiến trúc Microservices',
    },
    {
      id: 114,
      walletId: 2,
      walletName: 'Visa Platinum Debit',
      categoryName: 'Giải trí & Du lịch',
      categoryIcon: 'Music',
      actionTitle: 'Gia hạn gói Spotify Premium cá nhân',
      amount: 59000,
      transactionType: 'EXPENSE',
      balanceAfter: 22291000,
      transactionDate: getRealtimeDate(7, '09:00'),
      note: 'Tự động trừ thẻ hàng tháng',
    },
    {
      id: 115,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Sức khỏe & Thể thao',
      categoryIcon: 'Activity',
      actionTitle: 'Đóng phí thẻ tập Gym California',
      amount: 600000,
      transactionType: 'EXPENSE',
      balanceAfter: 53020000,
      transactionDate: getRealtimeDate(8, '17:30'),
      note: 'Gói thành viên Fitness 1 tháng',
    },
    {
      id: 116,
      walletId: 3,
      walletName: 'Ví MoMo Pay',
      categoryName: 'Ăn uống & Cà phê',
      categoryIcon: 'Coffee',
      actionTitle: 'Cà phê họp nhóm Phúc Long Tea',
      amount: 95000,
      transactionType: 'EXPENSE',
      balanceAfter: 4845000,
      transactionDate: getRealtimeDate(9, '15:00'),
      note: 'Trà sữa Oolong hạt sen',
    },
    {
      id: 117,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Tiết kiệm & Đầu tư',
      categoryIcon: 'PiggyBank',
      actionTitle: `Trích quỹ tiết kiệm định kỳ tháng ${new Date().getMonth() + 1}`,
      amount: 5000000,
      transactionType: 'EXPENSE',
      balanceAfter: 48020000,
      transactionDate: getRealtimeDate(10, '08:30'),
      note: 'Nạp vào Mục tiêu mua xe SH',
    },
    {
      id: 118,
      walletId: 4,
      walletName: 'Ví Tiền mặt (Cash)',
      categoryName: 'Di chuyển & Xăng xe',
      categoryIcon: 'Car',
      actionTitle: 'Bảo dưỡng thay dầu máy Motul',
      amount: 280000,
      transactionType: 'EXPENSE',
      balanceAfter: 3060000,
      transactionDate: getRealtimeDate(11, '10:00'),
      note: 'Thay dầu lap và dầu máy định kỳ',
    },
    // === DỮ LIỆU CÁC THÁNG VÀ NĂM CŨ (Hiển thị biểu đồ Monthly & Yearly) ===
    // Tháng 8/2026:
    {
      id: 120,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Lương & Thưởng',
      categoryIcon: 'BadgeDollarSign',
      actionTitle: 'Nhận lương tháng 8/2026',
      amount: 35000000,
      transactionType: 'INCOME',
      balanceAfter: 42000000,
      transactionDate: '2026-08-05 09:00',
      note: 'Lương công ty Budglee',
    },
    {
      id: 121,
      walletId: 2,
      walletName: 'Visa Platinum Debit',
      categoryName: 'Ăn uống & Cà phê',
      categoryIcon: 'Utensils',
      actionTitle: 'Ăn tối liên hoan cuối tuần tháng 8',
      amount: 850000,
      transactionType: 'EXPENSE',
      balanceAfter: 20000000,
      transactionDate: '2026-08-08 19:30',
      note: 'Họp mặt bạn bè',
    },
    {
      id: 122,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Hóa đơn & Tiện ích',
      categoryIcon: 'Receipt',
      actionTitle: 'Thanh toán tiền điện sinh hoạt EVN tháng 8',
      amount: 1150000,
      transactionType: 'EXPENSE',
      balanceAfter: 40850000,
      transactionDate: '2026-08-12 14:00',
      note: 'Hóa đơn tiền điện mùa hè',
    },
    {
      id: 123,
      walletId: 2,
      walletName: 'Visa Platinum Debit',
      categoryName: 'Mua sắm cá nhân',
      categoryIcon: 'ShoppingBag',
      actionTitle: 'Mua sắm trang phục công sở Routine',
      amount: 1250000,
      transactionType: 'EXPENSE',
      balanceAfter: 18750000,
      transactionDate: '2026-08-16 16:30',
      note: 'Áo sơ mi & quần tây',
    },
    {
      id: 124,
      walletId: 4,
      walletName: 'Ví Tiền mặt (Cash)',
      categoryName: 'Di chuyển & Xăng xe',
      categoryIcon: 'Car',
      actionTitle: 'Đổ xăng xe máy Petrolimex',
      amount: 120000,
      transactionType: 'EXPENSE',
      balanceAfter: 3500000,
      transactionDate: '2026-08-20 08:00',
      note: 'Xăng RON 95',
    },
    {
      id: 125,
      walletId: 2,
      walletName: 'Visa Platinum Debit',
      categoryName: 'Học tập & Phát triển',
      categoryIcon: 'BookOpen',
      actionTitle: 'Đăng ký khóa học Spring Boot & Microservices',
      amount: 890000,
      transactionType: 'EXPENSE',
      balanceAfter: 17860000,
      transactionDate: '2026-08-25 10:00',
      note: 'Nâng cao kỹ năng lập trình',
    },
    // 2 tháng trước:
    {
      id: 130,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Lương & Thưởng',
      categoryIcon: 'BadgeDollarSign',
      actionTitle: `Nhận lương tháng ${prevMonth2Num}/${currentYearNum}`,
      amount: 35000000,
      transactionType: 'INCOME',
      balanceAfter: 48000000,
      transactionDate: getRealtimeMonthDate(2, 5, '09:00'),
      note: 'Lương chuyển khoản',
    },
    {
      id: 131,
      walletId: 3,
      walletName: 'Ví MoMo Pay',
      categoryName: 'Ăn uống & Cà phê',
      categoryIcon: 'Coffee',
      actionTitle: `Cà phê làm việc & ăn trưa văn phòng tuần 1 tháng ${prevMonth2Num}`,
      amount: 450000,
      transactionType: 'EXPENSE',
      balanceAfter: 5200000,
      transactionDate: getRealtimeMonthDate(2, 8, '12:00'),
      note: 'Cơm trưa và cà phê',
    },
    {
      id: 132,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Hóa đơn & Tiện ích',
      categoryIcon: 'Receipt',
      actionTitle: `Thanh toán tiền điện và cáp quang Internet tháng ${prevMonth2Num}`,
      amount: 1480000,
      transactionType: 'EXPENSE',
      balanceAfter: 46520000,
      transactionDate: getRealtimeMonthDate(2, 12, '15:00'),
      note: 'EVN & VNPT',
    },
    {
      id: 133,
      walletId: 2,
      walletName: 'Visa Platinum Debit',
      categoryName: 'Mua sắm cá nhân',
      categoryIcon: 'ShoppingBag',
      actionTitle: 'Mua tai nghe chống ồn Sony WH-1000XM4',
      amount: 2350000,
      transactionType: 'EXPENSE',
      balanceAfter: 15510000,
      transactionDate: getRealtimeMonthDate(2, 17, '18:30'),
      note: 'Phục vụ tập trung làm việc',
    },
    {
      id: 134,
      walletId: 4,
      walletName: 'Ví Tiền mặt (Cash)',
      categoryName: 'Di chuyển & Xăng xe',
      categoryIcon: 'Car',
      actionTitle: 'Bảo dưỡng xe máy định kỳ thay dầu Motul',
      amount: 290000,
      transactionType: 'EXPENSE',
      balanceAfter: 3210000,
      transactionDate: getRealtimeMonthDate(2, 22, '09:30'),
      note: 'Bảo dưỡng tại trung tâm',
    },
    {
      id: 135,
      walletId: 2,
      walletName: 'Visa Platinum Debit',
      categoryName: 'Ăn uống & Cà phê',
      categoryIcon: 'Utensils',
      actionTitle: 'Ăn tối lẩu Haidilao cùng nhóm bạn thân',
      amount: 1250000,
      transactionType: 'EXPENSE',
      balanceAfter: 14260000,
      transactionDate: getRealtimeMonthDate(2, 26, '19:30'),
      note: 'Cuối tuần sum họp',
    },
    // Tháng trước:
    {
      id: 140,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Lương & Thưởng',
      categoryIcon: 'BadgeDollarSign',
      actionTitle: `Tạm ứng thu nhập đầu tháng ${prevMonth1Num}`,
      amount: 15000000,
      transactionType: 'INCOME',
      balanceAfter: 52000000,
      transactionDate: getRealtimeMonthDate(1, 5, '09:00'),
      note: 'Tạm ứng dự án',
    },
    {
      id: 141,
      walletId: 3,
      walletName: 'Ví MoMo Pay',
      categoryName: 'Ăn uống & Cà phê',
      categoryIcon: 'Utensils',
      actionTitle: `Chi tiêu ăn trưa & cà phê tuần 1 tháng ${prevMonth1Num}`,
      amount: 620000,
      transactionType: 'EXPENSE',
      balanceAfter: 4580000,
      transactionDate: getRealtimeMonthDate(1, 8, '12:30'),
      note: 'Ăn trưa công sở',
    },
    {
      id: 142,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Hóa đơn & Tiện ích',
      categoryIcon: 'Receipt',
      actionTitle: `Phí dịch vụ chung cư & nước sinh hoạt tháng ${prevMonth1Num}`,
      amount: 1250000,
      transactionType: 'EXPENSE',
      balanceAfter: 50750000,
      transactionDate: getRealtimeMonthDate(1, 12, '14:00'),
      note: 'Phí căn hộ',
    },
    {
      id: 143,
      walletId: 2,
      walletName: 'Visa Platinum Debit',
      categoryName: 'Giải trí & Du lịch',
      categoryIcon: 'Plane',
      actionTitle: 'Dã ngoại cắm trại Đồng Mô cuối tuần',
      amount: 1850000,
      transactionType: 'EXPENSE',
      balanceAfter: 12410000,
      transactionDate: getRealtimeMonthDate(1, 18, '17:00'),
      note: 'Thuê lều & ăn uống ngoài trời',
    },
    // Các năm trước (2023, 2024, 2025 cho biểu đồ Yearly):
    {
      id: 150,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Mua sắm cá nhân',
      categoryIcon: 'ShoppingBag',
      actionTitle: 'Chi tiêu sắm sửa trang thiết bị năm 2023',
      amount: 28500000,
      transactionType: 'EXPENSE',
      balanceAfter: 35000000,
      transactionDate: '2023-11-20 10:00',
      note: 'Tổng chi tiêu năm 2023',
    },
    {
      id: 151,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Giải trí & Du lịch',
      categoryIcon: 'Plane',
      actionTitle: 'Chuyến du lịch hè Đà Nẵng - Hội An năm 2024',
      amount: 38200000,
      transactionType: 'EXPENSE',
      balanceAfter: 42000000,
      transactionDate: '2024-07-15 14:00',
      note: 'Tổng chi tiêu năm 2024',
    },
    {
      id: 152,
      walletId: 1,
      walletName: 'Techcombank Lương',
      categoryName: 'Mua sắm cá nhân',
      categoryIcon: 'ShoppingBag',
      actionTitle: 'Nâng cấp dàn PC đồ họa & làm việc năm 2025',
      amount: 45600000,
      transactionType: 'EXPENSE',
      balanceAfter: 48000000,
      transactionDate: '2025-08-20 16:30',
      note: 'Tổng chi tiêu năm 2025',
    },
  ],
  budgets: [
    { id: 1, categoryId: 1, categoryName: 'Ăn uống & Cà phê', categoryIcon: 'Utensils', amountLimit: 5000000, spentAmount: 1085000, periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), alertThreshold: 80 },
    { id: 2, categoryId: 2, categoryName: 'Mua sắm cá nhân', categoryIcon: 'ShoppingBag', amountLimit: 3500000, spentAmount: 1930000, periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), alertThreshold: 80 },
    { id: 3, categoryId: 4, categoryName: 'Hóa đơn & Tiện ích', categoryIcon: 'Receipt', amountLimit: 2000000, spentAmount: 1580000, periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), alertThreshold: 80 },
    { id: 4, categoryId: 3, categoryName: 'Di chuyển & Xăng xe', categoryIcon: 'Car', amountLimit: 1500000, spentAmount: 390000, periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), alertThreshold: 80 },
    { id: 5, categoryId: 5, categoryName: 'Giải trí & Du lịch', categoryIcon: 'Plane', amountLimit: 1500000, spentAmount: 299000, periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), alertThreshold: 80 },
    { id: 6, categoryId: 6, categoryName: 'Học tập & Phát triển', categoryIcon: 'BookOpen', amountLimit: 1000000, spentAmount: 350000, periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), alertThreshold: 80 },
  ],
  savingGoals: [
    { id: 1, goalName: 'Mua xe Honda SH 160i ABS', targetAmount: 110000000, currentAmount: 75000000, deadline: '2026-12-31', status: 'IN_PROGRESS', color: 'emerald' },
    { id: 2, goalName: 'Quỹ dự phòng khẩn cấp 6 tháng', targetAmount: 60000000, currentAmount: 60000000, deadline: '2026-10-31', status: 'COMPLETED', color: 'blue' },
    { id: 3, goalName: 'Du lịch Nhật Bản ngắm hoa anh đào', targetAmount: 45000000, currentAmount: 18000000, deadline: '2027-04-15', status: 'IN_PROGRESS', color: 'teal' },
    { id: 4, goalName: 'Nâng cấp Laptop MacBook Pro M3', targetAmount: 35000000, currentAmount: 22000000, deadline: '2027-01-20', status: 'IN_PROGRESS', color: 'amber' },
  ],
  notifications: [
    {
      id: 'notif-1',
      title: `Lương tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()} đã về`,
      message: '+35.000.000 ₫ từ Công ty Công nghệ Budglee đã ghi nhận vào ví Techcombank.',
      time: 'Hôm nay',
      type: 'SUCCESS',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'Cảnh báo ngân sách Tiện ích',
      message: `Danh mục "Hóa đơn & Tiện ích" đã đạt 79% hạn mức chi tiêu tháng ${new Date().getMonth() + 1}.`,
      time: 'Hôm qua',
      type: 'WARNING',
      read: false,
    },
    {
      id: 'notif-3',
      title: 'Mục tiêu hoàn thành xuất sắc!',
      message: 'Chúc mừng bạn đã hoàn thành 100% mục tiêu "Quỹ dự phòng khẩn cấp 6 tháng"!',
      time: '2 ngày trước',
      type: 'SUCCESS',
      read: true,
    },
    {
      id: 'notif-4',
      title: 'Báo cáo tài chính tuần',
      message: 'Tuần qua bạn đã tiết kiệm được 32% thu nhập, đạt tỷ lệ tối ưu theo quy tắc 50/30/20.',
      time: 'Tuần trước',
      type: 'INFO',
      read: true,
    },
    {
      id: 'notif-5',
      title: 'Gợi ý từ Trợ lý AI',
      message: 'Bạn có khoản thưởng 10.000.000 ₫ chưa phân bổ. Hãy nạp thêm vào mục tiêu xe SH!',
      time: 'Tuần trước',
      type: 'INFO',
      read: true,
    },
  ],
  botRecommendation: {
    status: 'ON_TRACK',
    primaryAdvice:
      'Tỷ lệ tiết kiệm tháng này đạt 32%, vượt mục tiêu đề xuất 20%. Bạn đang cân đối ngân sách cá nhân rất tốt.',
    actionItems: [
      'Duy trì hạn mức chi tiêu ăn uống dưới 5.000.000 ₫ trong tháng.',
      'Chuyển thêm 3.000.000 ₫ vào Mục tiêu mua xe Honda SH để đạt kế hoạch trước Tết.',
      'Kiểm tra lại hóa đơn điện nước để tối ưu chi phí sinh hoạt cá nhân.',
    ],
    categoryWarnings: [
      {
        categoryName: 'Hóa đơn & Tiện ích',
        increasePercentage: 12.5,
        recommendation: 'Chi phí điện nước đang ở mức 79% hạn mức. Nên tắt thiết bị khi không dùng.',
      },
    ],
  },
};

// ============================================================================
// DỮ LIỆU MẪU: 3 TÀI KHOẢN CHI TIÊU GIA ĐÌNH (thanhba, thanhme, thanhcon)
// Nhóm: "Gia đình Hạnh Phúc" (FAM-HANHPHUC)
// ============================================================================
export const FAMILY_SHARED_DATA: {
  wallets: Wallet[];
  recentTransactions: Transaction[];
  budgets: Budget[];
  savingGoals: SavingGoal[];
  familyMembers: FamilyMember[];
  notifications: NotificationItem[];
  botRecommendation: HabitRecommendation;
} = {
  wallets: [
    { id: 201, walletName: 'Quỹ chung Gia đình (Vietcombank)', cardNumberMasked: '**** 8866', balance: 125000000, currency: 'VND', type: 'BANK', color: 'from-slate-900 to-indigo-950' },
    { id: 202, walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)', cardNumberMasked: '**** 6622', balance: 38400000, currency: 'VND', type: 'BANK', color: 'from-emerald-900 to-teal-950' },
    { id: 203, walletName: 'Két sắt tiền mặt gia đình', cardNumberMasked: '', balance: 12500000, currency: 'VND', type: 'CASH', color: 'from-amber-900 to-orange-950' },
  ],
  recentTransactions: [
    {
      id: 301,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Lương & Thưởng',
      categoryIcon: 'BadgeDollarSign',
      actionTitle: `Ba đóng góp quỹ chung gia đình tháng ${new Date().getMonth() + 1}`,
      amount: 40000000,
      transactionType: 'INCOME',
      balanceAfter: 125000000,
      transactionDate: getRealtimeDate(0, '08:30'),
      note: 'Đóng góp hàng tháng từ thu nhập của Ba',
    },
    {
      id: 302,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Lương & Thưởng',
      categoryIcon: 'BadgeDollarSign',
      actionTitle: `Mẹ đóng góp quỹ chung gia đình tháng ${new Date().getMonth() + 1}`,
      amount: 25000000,
      transactionType: 'INCOME',
      balanceAfter: 150000000,
      transactionDate: getRealtimeDate(0, '09:00'),
      note: 'Đóng góp hàng tháng từ lương của Mẹ',
    },
    {
      id: 303,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Học tập & Giáo dục con cái',
      categoryIcon: 'GraduationCap',
      actionTitle: 'Đóng học phí học kỳ năm học mới cho Con',
      amount: 8500000,
      transactionType: 'EXPENSE',
      balanceAfter: 141500000,
      transactionDate: getRealtimeDate(0, '10:00'),
      note: 'Chuyển khoản trường THPT / Đại học',
    },
    {
      id: 304,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Học tập & Giáo dục con cái',
      categoryIcon: 'GraduationCap',
      actionTitle: 'Đóng tiền học thêm tiếng Anh IELTS cho Con',
      amount: 3200000,
      transactionType: 'EXPENSE',
      balanceAfter: 35200000,
      transactionDate: getRealtimeDate(1, '15:30'),
      note: 'Khóa luyện thi chứng chỉ',
    },
    {
      id: 305,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Ăn uống & Đi chợ gia đình',
      categoryIcon: 'ShoppingBag',
      actionTitle: 'Mẹ đi siêu thị Co.opmart mua thực phẩm tuần',
      amount: 2450000,
      transactionType: 'EXPENSE',
      balanceAfter: 32750000,
      transactionDate: getRealtimeDate(1, '17:30'),
      note: 'Thịt bò, hải sản, rau củ quả cho cả tuần',
    },
    {
      id: 306,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Hóa đơn & Nhà ở',
      categoryIcon: 'Home',
      actionTitle: 'Phí dịch vụ quản lý tòa nhà & gửi xe chung cư',
      amount: 1850000,
      transactionType: 'EXPENSE',
      balanceAfter: 30900000,
      transactionDate: getRealtimeDate(2, '19:00'),
      note: 'Phí dịch vụ căn hộ 3 phòng ngủ',
    },
    {
      id: 307,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Hóa đơn & Nhà ở',
      categoryIcon: 'Receipt',
      actionTitle: 'Thanh toán tiền điện EVN gia đình',
      amount: 2150000,
      transactionType: 'EXPENSE',
      balanceAfter: 28750000,
      transactionDate: getRealtimeDate(2, '11:15'),
      note: 'Tiền điện 3 điều hòa và máy giặt sấy',
    },
    {
      id: 308,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Hóa đơn & Nhà ở',
      categoryIcon: 'Droplet',
      actionTitle: 'Thanh toán tiền nước sinh hoạt gia đình',
      amount: 380000,
      transactionType: 'EXPENSE',
      balanceAfter: 28370000,
      transactionDate: getRealtimeDate(3, '11:30'),
      note: 'Nước sinh hoạt gia đình',
    },
    {
      id: 309,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Mua sắm & Gia đình',
      categoryIcon: 'ShoppingBag',
      actionTitle: 'Mua sắm nồi chiên không dầu Philips gia đình',
      amount: 1950000,
      transactionType: 'EXPENSE',
      balanceAfter: 26420000,
      transactionDate: getRealtimeDate(3, '14:00'),
      note: 'Thay thế nồi chiên cũ bị hỏng',
    },
    {
      id: 310,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Y tế & Bảo hiểm',
      categoryIcon: 'HeartPulse',
      actionTitle: 'Đóng bảo hiểm nhân thọ gia đình Dai-ichi Life',
      amount: 6500000,
      transactionType: 'EXPENSE',
      balanceAfter: 135000000,
      transactionDate: getRealtimeDate(4, '16:30'),
      note: 'Phí bảo hiểm quý cho 3 người',
    },
    {
      id: 311,
      walletId: 203,
      walletName: 'Két sắt tiền mặt gia đình',
      categoryName: 'Y tế & Bảo hiểm',
      categoryIcon: 'HeartPulse',
      actionTitle: 'Mua thuốc cảm cúm & vitamin bổ sung cho nhà',
      amount: 450000,
      transactionType: 'EXPENSE',
      balanceAfter: 12050000,
      transactionDate: getRealtimeDate(4, '09:30'),
      note: 'Nhà thuốc Long Châu',
    },
    {
      id: 312,
      walletId: 203,
      walletName: 'Két sắt tiền mặt gia đình',
      categoryName: 'Học tập & Giáo dục con cái',
      categoryIcon: 'GraduationCap',
      actionTitle: 'Phát tiền ăn trưa & đồ dùng học tập cho Con',
      amount: 350000,
      transactionType: 'EXPENSE',
      balanceAfter: 11700000,
      transactionDate: getRealtimeDate(5, '12:00'),
      note: 'Tiền sinh hoạt tuần của con',
    },
    {
      id: 313,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Di chuyển & Xăng xe',
      categoryIcon: 'Car',
      actionTitle: 'Ba bảo dưỡng xe ô tô gia đình tại xưởng',
      amount: 3200000,
      transactionType: 'EXPENSE',
      balanceAfter: 131800000,
      transactionDate: getRealtimeDate(5, '10:00'),
      note: 'Bảo dưỡng định kỳ 20.000 km',
    },
    {
      id: 314,
      walletId: 203,
      walletName: 'Két sắt tiền mặt gia đình',
      categoryName: 'Ăn uống & Đi chợ gia đình',
      categoryIcon: 'Utensils',
      actionTitle: 'Đi chợ đầu mối mua hải sản tươi cuối tuần',
      amount: 1250000,
      transactionType: 'EXPENSE',
      balanceAfter: 10450000,
      transactionDate: getRealtimeDate(6, '17:00'),
      note: 'Tôm cua cá làm lẩu đãi ông bà',
    },
    {
      id: 315,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Ăn uống & Đi chợ gia đình',
      categoryIcon: 'Utensils',
      actionTitle: 'Cả nhà ăn tối liên hoan sum họp gia đình',
      amount: 1680000,
      transactionType: 'EXPENSE',
      balanceAfter: 24740000,
      transactionDate: getRealtimeDate(6, '19:30'),
      note: 'Bữa tối đầm ấm',
    },
    {
      id: 316,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Tiết kiệm & Đầu tư',
      categoryIcon: 'PiggyBank',
      actionTitle: 'Trích gửi tiết kiệm Quỹ đổi xe ô tô mới',
      amount: 10000000,
      transactionType: 'EXPENSE',
      balanceAfter: 121800000,
      transactionDate: getRealtimeDate(7, '08:00'),
      note: 'Chuyển vào Mục tiêu VinFast VF7',
    },
    // === DỮ LIỆU CÁC THÁNG VÀ NĂM CŨ (Hiển thị biểu đồ Monthly & Yearly quỹ gia đình) ===
    // Tháng 8/2026:
    {
      id: 320,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Lương & Thưởng',
      categoryIcon: 'BadgeDollarSign',
      actionTitle: 'Ba nộp quỹ chung gia đình tháng 8',
      amount: 40000000,
      transactionType: 'INCOME',
      balanceAfter: 110000000,
      transactionDate: '2026-08-01 08:30',
      note: 'Đóng góp thu nhập tháng 8',
    },
    {
      id: 321,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Lương & Thưởng',
      categoryIcon: 'BadgeDollarSign',
      actionTitle: 'Mẹ nộp quỹ chung gia đình tháng 8',
      amount: 25000000,
      transactionType: 'INCOME',
      balanceAfter: 135000000,
      transactionDate: '2026-08-01 09:00',
      note: 'Đóng góp thu nhập tháng 8',
    },
    {
      id: 322,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Ăn uống & Đi chợ gia đình',
      categoryIcon: 'Utensils',
      actionTitle: 'Đi siêu thị Mega Market mua thực phẩm gia đình tháng 8',
      amount: 4850000,
      transactionType: 'EXPENSE',
      balanceAfter: 28000000,
      transactionDate: '2026-08-06 17:30',
      note: 'Thịt bò, hải sản, rau quả',
    },
    {
      id: 323,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Hóa đơn & Nhà ở',
      categoryIcon: 'Home',
      actionTitle: 'Tiền điện EVN và dịch vụ quản lý căn hộ tháng 8',
      amount: 3950000,
      transactionType: 'EXPENSE',
      balanceAfter: 24050000,
      transactionDate: '2026-08-11 14:00',
      note: 'Tiền điện cao điểm hè',
    },
    {
      id: 324,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Học tập & Giáo dục con cái',
      categoryIcon: 'GraduationCap',
      actionTitle: 'Mua sắm sách vở và đồng phục năm học mới cho Con',
      amount: 3600000,
      transactionType: 'EXPENSE',
      balanceAfter: 131400000,
      transactionDate: '2026-08-16 10:00',
      note: 'Chuẩn bị năm học 2026-2027',
    },
    {
      id: 325,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Y tế & Bảo hiểm',
      categoryIcon: 'HeartPulse',
      actionTitle: 'Khám sức khỏe tổng quát định kỳ cho cả nhà tại BV Vinmec',
      amount: 5500000,
      transactionType: 'EXPENSE',
      balanceAfter: 125900000,
      transactionDate: '2026-08-21 15:30',
      note: 'Gói kiểm tra sức khỏe gia đình',
    },
    {
      id: 326,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Di chuyển & Xăng xe',
      categoryIcon: 'Car',
      actionTitle: 'Bảo dưỡng và thay lốp xe ô tô gia đình định kỳ',
      amount: 3500000,
      transactionType: 'EXPENSE',
      balanceAfter: 122400000,
      transactionDate: '2026-08-25 11:00',
      note: 'Bảo dưỡng định kỳ',
    },
    // 2 tháng trước:
    {
      id: 330,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Lương & Thưởng',
      categoryIcon: 'BadgeDollarSign',
      actionTitle: `Ba nộp quỹ chung gia đình tháng ${prevMonth2Num}`,
      amount: 40000000,
      transactionType: 'INCOME',
      balanceAfter: 130000000,
      transactionDate: getRealtimeMonthDate(2, 1, '08:30'),
      note: `Đóng góp thu nhập tháng ${prevMonth2Num}`,
    },
    {
      id: 331,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Lương & Thưởng',
      categoryIcon: 'BadgeDollarSign',
      actionTitle: `Mẹ nộp quỹ chung gia đình tháng ${prevMonth2Num}`,
      amount: 25000000,
      transactionType: 'INCOME',
      balanceAfter: 155000000,
      transactionDate: getRealtimeMonthDate(2, 1, '09:00'),
      note: `Đóng góp thu nhập tháng ${prevMonth2Num}`,
    },
    {
      id: 332,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Học tập & Giáo dục con cái',
      categoryIcon: 'GraduationCap',
      actionTitle: 'Đóng học phí đầu năm học mới cho Con',
      amount: 9500000,
      transactionType: 'EXPENSE',
      balanceAfter: 145500000,
      transactionDate: getRealtimeMonthDate(2, 4, '10:00'),
      note: 'Học phí học kỳ I',
    },
    {
      id: 333,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Ăn uống & Đi chợ gia đình',
      categoryIcon: 'Utensils',
      actionTitle: `Đi siêu thị Co.opmart mua thực phẩm sinh hoạt tháng ${prevMonth2Num}`,
      amount: 5200000,
      transactionType: 'EXPENSE',
      balanceAfter: 26000000,
      transactionDate: getRealtimeMonthDate(2, 9, '17:00'),
      note: 'Thực phẩm dinh dưỡng cho con đi học',
    },
    {
      id: 334,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Hóa đơn & Nhà ở',
      categoryIcon: 'Home',
      actionTitle: `Thanh toán tiền điện và phí gửi xe chung cư tháng ${prevMonth2Num}`,
      amount: 4200000,
      transactionType: 'EXPENSE',
      balanceAfter: 21800000,
      transactionDate: getRealtimeMonthDate(2, 14, '14:30'),
      note: 'Điện EVN & ban quản lý',
    },
    {
      id: 335,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Mua sắm & Gia đình',
      categoryIcon: 'ShoppingBag',
      actionTitle: 'Mua máy lọc không khí Sharp bảo vệ sức khỏe cả nhà',
      amount: 4800000,
      transactionType: 'EXPENSE',
      balanceAfter: 17000000,
      transactionDate: getRealtimeMonthDate(2, 19, '16:00'),
      note: 'Trang bị phòng ngủ và phòng khách',
    },
    {
      id: 336,
      walletId: 203,
      walletName: 'Két sắt tiền mặt gia đình',
      categoryName: 'Y tế & Bảo hiểm',
      categoryIcon: 'HeartPulse',
      actionTitle: 'Mua thuốc bổ xương khớp và vitamin cho gia đình',
      amount: 2100000,
      transactionType: 'EXPENSE',
      balanceAfter: 11000000,
      transactionDate: getRealtimeMonthDate(2, 24, '09:30'),
      note: 'Nhà thuốc Pharmacity',
    },
    {
      id: 337,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Ăn uống & Đi chợ gia đình',
      categoryIcon: 'Utensils',
      actionTitle: 'Bữa tối sum họp gia đình cuối tuần tại nhà hàng',
      amount: 1950000,
      transactionType: 'EXPENSE',
      balanceAfter: 15050000,
      transactionDate: getRealtimeMonthDate(2, 28, '19:30'),
      note: `Liên hoan tháng ${prevMonth2Num}`,
    },
    // Tháng trước:
    {
      id: 340,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Lương & Thưởng',
      categoryIcon: 'BadgeDollarSign',
      actionTitle: `Ba nộp quỹ chung gia đình tháng ${prevMonth1Num}`,
      amount: 40000000,
      transactionType: 'INCOME',
      balanceAfter: 135000000,
      transactionDate: getRealtimeMonthDate(1, 1, '08:30'),
      note: `Đóng góp thu nhập tháng ${prevMonth1Num}`,
    },
    {
      id: 341,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Lương & Thưởng',
      categoryIcon: 'BadgeDollarSign',
      actionTitle: `Mẹ nộp quỹ chung gia đình tháng ${prevMonth1Num}`,
      amount: 25000000,
      transactionType: 'INCOME',
      balanceAfter: 160000000,
      transactionDate: getRealtimeMonthDate(1, 1, '09:00'),
      note: `Đóng góp thu nhập tháng ${prevMonth1Num}`,
    },
    {
      id: 342,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Ăn uống & Đi chợ gia đình',
      categoryIcon: 'Utensils',
      actionTitle: `Đi chợ siêu thị thực phẩm tuần 1 tháng ${prevMonth1Num}`,
      amount: 3600000,
      transactionType: 'EXPENSE',
      balanceAfter: 28000000,
      transactionDate: getRealtimeMonthDate(1, 6, '17:00'),
      note: 'Thực phẩm dinh dưỡng',
    },
    {
      id: 343,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Hóa đơn & Nhà ở',
      categoryIcon: 'Home',
      actionTitle: `Thanh toán tiền điện EVN và dịch vụ internet tháng ${prevMonth1Num}`,
      amount: 4350000,
      transactionType: 'EXPENSE',
      balanceAfter: 23650000,
      transactionDate: getRealtimeMonthDate(1, 11, '14:00'),
      note: 'Hóa đơn sinh hoạt',
    },
    {
      id: 344,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Học tập & Giáo dục con cái',
      categoryIcon: 'GraduationCap',
      actionTitle: 'Đóng tiền học thêm tiếng Anh và kỹ năng mềm cho Con',
      amount: 4600000,
      transactionType: 'EXPENSE',
      balanceAfter: 155400000,
      transactionDate: getRealtimeMonthDate(1, 15, '10:30'),
      note: 'Lớp học thêm quý 4',
    },
    {
      id: 345,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Y tế & Bảo hiểm',
      categoryIcon: 'HeartPulse',
      actionTitle: 'Đóng bảo hiểm sức khỏe gia đình Bảo Việt',
      amount: 6200000,
      transactionType: 'EXPENSE',
      balanceAfter: 149200000,
      transactionDate: getRealtimeMonthDate(1, 19, '09:00'),
      note: 'Bảo hiểm thường niên',
    },
    {
      id: 346,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Di chuyển & Xăng xe',
      categoryIcon: 'Car',
      actionTitle: `Chi phí xăng xe và vé cầu đường cao tốc cả nhà tháng ${prevMonth1Num}`,
      amount: 2900000,
      transactionType: 'EXPENSE',
      balanceAfter: 146300000,
      transactionDate: getRealtimeMonthDate(1, 23, '15:30'),
      note: 'Di chuyển gia đình',
    },
    {
      id: 347,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Mua sắm & Gia đình',
      categoryIcon: 'ShoppingBag',
      actionTitle: 'Du lịch nghỉ dưỡng cuối tuần tại FLC Vĩnh Phúc',
      amount: 7800000,
      transactionType: 'EXPENSE',
      balanceAfter: 15850000,
      transactionDate: getRealtimeMonthDate(1, 27, '19:30'),
      note: 'Nghỉ dưỡng gia đình',
    },
    {
      id: 348,
      walletId: 202,
      walletName: 'Quỹ chi tiêu sinh hoạt (Techcombank)',
      categoryName: 'Ăn uống & Đi chợ gia đình',
      categoryIcon: 'Utensils',
      actionTitle: 'Tiệc liên hoan sinh nhật thành viên gia đình ấm cúng',
      amount: 2400000,
      transactionType: 'EXPENSE',
      balanceAfter: 13450000,
      transactionDate: getRealtimeMonthDate(1, 28, '18:30'),
      note: 'Bữa tiệc gia đình',
    },
    // Các năm trước (2023, 2024, 2025 cho biểu đồ Yearly quỹ gia đình):
    {
      id: 350,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Hóa đơn & Nhà ở',
      categoryIcon: 'Home',
      actionTitle: 'Tổng chi tiêu mua sắm nội thất gia đình năm 2023',
      amount: 78000000,
      transactionType: 'EXPENSE',
      balanceAfter: 85000000,
      transactionDate: '2023-11-15 10:00',
      note: 'Tổng hợp chi tiêu 2023',
    },
    {
      id: 351,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Hóa đơn & Nhà ở',
      categoryIcon: 'Home',
      actionTitle: 'Chi phí sửa chữa & bảo trì căn hộ gia đình năm 2024',
      amount: 115000000,
      transactionType: 'EXPENSE',
      balanceAfter: 95000000,
      transactionDate: '2024-07-20 15:00',
      note: 'Tổng hợp chi tiêu 2024',
    },
    {
      id: 352,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Học tập & Giáo dục con cái',
      categoryIcon: 'GraduationCap',
      actionTitle: 'Tổng chi tiêu học tập và sinh hoạt năm 2024',
      amount: 145000000,
      transactionType: 'EXPENSE',
      balanceAfter: 105000000,
      transactionDate: '2024-12-10 11:00',
      note: 'Tổng hợp chi tiêu 2024',
    },
    {
      id: 353,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Mua sắm & Gia đình',
      categoryIcon: 'ShoppingBag',
      actionTitle: 'Chuyến du lịch hè xuyên Việt cả gia đình năm 2025',
      amount: 58000000,
      transactionType: 'EXPENSE',
      balanceAfter: 115000000,
      transactionDate: '2025-06-25 14:00',
      note: 'Tổng hợp chi tiêu 2025',
    },
    {
      id: 354,
      walletId: 201,
      walletName: 'Quỹ chung Gia đình (Vietcombank)',
      categoryName: 'Y tế & Bảo hiểm',
      categoryIcon: 'HeartPulse',
      actionTitle: 'Chi phí bảo hiểm nhân thọ & sức khỏe năm 2025',
      amount: 175000000,
      transactionType: 'EXPENSE',
      balanceAfter: 120000000,
      transactionDate: '2025-11-18 16:30',
      note: 'Tổng hợp chi tiêu 2025',
    },
  ],
  budgets: [
    { id: 201, categoryId: 1, categoryName: 'Ăn uống & Đi chợ gia đình', categoryIcon: 'Utensils', amountLimit: 15000000, spentAmount: 5380000, periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), alertThreshold: 80 },
    { id: 202, categoryId: 6, categoryName: 'Học tập & Giáo dục con cái', categoryIcon: 'GraduationCap', amountLimit: 15000000, spentAmount: 12050000, periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), alertThreshold: 80 },
    { id: 203, categoryId: 4, categoryName: 'Hóa đơn & Nhà ở', categoryIcon: 'Home', amountLimit: 6000000, spentAmount: 4380000, periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), alertThreshold: 80 },
    { id: 204, categoryId: 7, categoryName: 'Y tế & Bảo hiểm', categoryIcon: 'HeartPulse', amountLimit: 8000000, spentAmount: 6950000, periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), alertThreshold: 80 },
    { id: 205, categoryId: 3, categoryName: 'Di chuyển & Xăng xe', categoryIcon: 'Car', amountLimit: 5000000, spentAmount: 3200000, periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear(), alertThreshold: 80 },
  ],
  savingGoals: [
    { id: 201, goalName: 'Đổi ô tô VinFast VF7 gia đình', targetAmount: 850000000, currentAmount: 420000000, deadline: '2027-12-31', status: 'IN_PROGRESS', color: 'emerald' },
    { id: 202, goalName: 'Quỹ học Đại học tương lai cho Con', targetAmount: 300000000, currentAmount: 185000000, deadline: '2029-06-30', status: 'IN_PROGRESS', color: 'blue' },
    { id: 203, goalName: 'Du lịch hè Phú Quốc cả gia đình', targetAmount: 35000000, currentAmount: 35000000, deadline: '2026-07-30', status: 'COMPLETED', color: 'teal' },
  ],
  familyMembers: [
    {
      id: 1002,
      fullName: 'Nguyễn Tiến Ba (Ba)',
      email: 'thanhba@gmail.com',
      role: 'FAMILY_ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      joinedDate: '01/10/2026',
      isOwner: true,
    },
    {
      id: 1003,
      fullName: 'Trần Thị Mẹ (Mẹ)',
      email: 'thanhme@gmail.com',
      role: 'FAMILY_ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
      joinedDate: '01/10/2026',
      isOwner: false,
    },
    {
      id: 1004,
      fullName: 'Nguyễn Tiến Con (Con)',
      email: 'thanhcon@gmail.com',
      role: 'FAMILY_MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=faces',
      joinedDate: '01/10/2026',
      isOwner: false,
    },
  ],
  notifications: [
    {
      id: 'fam-notif-1',
      title: `Ba đã nộp quỹ chung tháng ${new Date().getMonth() + 1}`,
      message: '+40.000.000 ₫ đã được chuyển vào Quỹ chung gia đình Vietcombank.',
      time: 'Hôm nay',
      type: 'SUCCESS',
      read: false,
    },
    {
      id: 'fam-notif-2',
      title: `Mẹ đã nộp quỹ chung tháng ${new Date().getMonth() + 1}`,
      message: '+25.000.000 ₫ đã được chuyển vào Quỹ chung gia đình Vietcombank.',
      time: 'Hôm nay',
      type: 'SUCCESS',
      read: false,
    },
    {
      id: 'fam-notif-3',
      title: 'Học phí kỳ I của Con đã đóng',
      message: 'Thanh toán 8.500.000 ₫ tiền học phí cho trường THPT thành công.',
      time: 'Hôm qua',
      type: 'INFO',
      read: true,
    },
    {
      id: 'fam-notif-4',
      title: 'Cảnh báo ngân sách Giáo dục',
      message: `Ngân sách Học tập & Giáo dục con cái đã đạt 80.3% (12.050.000 ₫ / 15.000.000 ₫).`,
      time: '2 ngày trước',
      type: 'WARNING',
      read: false,
    },
    {
      id: 'fam-notif-5',
      title: 'Mục tiêu hoàn thành!',
      message: 'Mục tiêu "Du lịch hè Phú Quốc cả gia đình" đã hoàn thành 100% với số tiền 35.000.000 ₫!',
      time: 'Tuần trước',
      type: 'SUCCESS',
      read: true,
    },
  ],
  botRecommendation: {
    status: 'WARNING',
    primaryAdvice:
      'Ngân sách Giáo dục của Con tháng này đã dùng hơn 80% do đóng học phí kỳ I và khóa IELTS. Quỹ sinh hoạt còn lại 26.350.000 ₫, đủ chi tiêu an toàn cho 22 ngày tới.',
    actionItems: [
      'Tối ưu các khoản mua sắm đồ gia dụng chưa cấp thiết trong tuần tới.',
      'Duy trì hạn mức đi chợ gia đình dưới 2.500.000 ₫/tuần.',
      'Trích chuyển đúng hạn 10.000.000 ₫ vào Quỹ đổi xe ô tô VinFast VF7.',
    ],
    categoryWarnings: [
      {
        categoryName: 'Học tập & Giáo dục con cái',
        increasePercentage: 45.0,
        recommendation: 'Đã hoàn thành các khoản học phí đầu năm, các tháng sau chi phí sẽ giảm xuống bình thường.',
      },
    ],
  },
};

// Helper: tính toán DashboardSummary theo dữ liệu hiện tại
export const calculateDashboardSummary = (
  wallets: Wallet[],
  transactions: Transaction[],
  budgets: Budget[]
): DashboardSummary => {
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  // Chỉ lấy các giao dịch thuộc tháng hiện tại cho Tổng thu tháng & Tổng chi tháng
  const currentMonthTxs = transactions.filter((t) => {
    if (!t.transactionDate) return false;
    const normalized = t.transactionDate.includes('T') ? t.transactionDate : t.transactionDate.replace(' ', 'T');
    const d = new Date(normalized);
    return !isNaN(d.getTime()) && d.getMonth() + 1 === curMonth && d.getFullYear() === curYear;
  });

  const txsForMonth = currentMonthTxs.length > 0 ? currentMonthTxs : transactions;

  const monthlyIncome = txsForMonth
    .filter((t) => t.transactionType === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlySpending = txsForMonth
    .filter((t) => t.transactionType === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);
  const leftToSpend = Math.max(0, monthlyIncome - monthlySpending);

  const totalLimit = budgets.reduce((sum, b) => sum + b.amountLimit, 0);
  const spendingPercentageOfBudget = totalLimit > 0 ? (monthlySpending / totalLimit) * 100 : 0;

  const categoryExpenses: Record<string, number> = {};
  txsForMonth
    .filter((t) => t.transactionType === 'EXPENSE')
    .forEach((t) => {
      const cat = t.categoryName || 'Khác';
      categoryExpenses[cat] = (categoryExpenses[cat] || 0) + t.amount;
    });

  // Biến động chi tiêu theo 4 tuần thực tế trong tháng hiện tại (Weekly Spent Trends)
  const weeklyAmounts: Record<string, number> = {
    'Tuần 1': 0,
    'Tuần 2': 0,
    'Tuần 3': 0,
    'Tuần 4': 0,
  };
  currentMonthTxs
    .filter((t) => t.transactionType === 'EXPENSE' && t.amount > 0 && t.transactionDate)
    .forEach((t) => {
      const normalized = t.transactionDate.includes('T') ? t.transactionDate : t.transactionDate.replace(' ', 'T');
      const d = new Date(normalized);
      if (!isNaN(d.getTime())) {
        const day = d.getDate();
        if (day <= 7) weeklyAmounts['Tuần 1'] += t.amount;
        else if (day <= 14) weeklyAmounts['Tuần 2'] += t.amount;
        else if (day <= 21) weeklyAmounts['Tuần 3'] += t.amount;
        else weeklyAmounts['Tuần 4'] += t.amount;
      }
    });

  const spentTrends = [
    { label: 'Tuần 1', amount: weeklyAmounts['Tuần 1'] },
    { label: 'Tuần 2', amount: weeklyAmounts['Tuần 2'] },
    { label: 'Tuần 3', amount: weeklyAmounts['Tuần 3'] },
    { label: 'Tuần 4', amount: weeklyAmounts['Tuần 4'] },
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

export const mergeSeedTransactions = (existing: Transaction[], seed: Transaction[]): Transaction[] => {
  const seedMap = new Map(seed.map((s) => [s.id, s]));
  const existingMap = new Map<number, Transaction>();

  existing.forEach((t) => {
    // Nếu là transaction mẫu thì cập nhật ngày giờ và tiêu đề thời gian thực mới nhất
    if (seedMap.has(t.id)) {
      const st = seedMap.get(t.id)!;
      existingMap.set(t.id, {
        ...t,
        transactionDate: st.transactionDate,
        actionTitle: st.actionTitle,
      });
    } else {
      existingMap.set(t.id, t);
    }
  });

  seed.forEach((st) => {
    if (!existingMap.has(st.id)) {
      existingMap.set(st.id, st);
    }
  });

  return Array.from(existingMap.values()).sort(
    (a, b) =>
      new Date(b.transactionDate.includes('T') ? b.transactionDate : b.transactionDate.replace(' ', 'T')).getTime() -
      new Date(a.transactionDate.includes('T') ? a.transactionDate : a.transactionDate.replace(' ', 'T')).getTime()
  );
};

export const mergeRealtimeNotifications = (
  savedNotifs: NotificationItem[] | undefined,
  defaultNotifs: NotificationItem[]
): NotificationItem[] => {
  if (!savedNotifs || savedNotifs.length === 0) return defaultNotifs;
  // Giữ lại các thông báo lời mời gia đình và thông báo động đặc biệt
  const dynamicNotifs = savedNotifs.filter(
    (n) => n.actionType === 'FAMILY_INVITATION' || n.id.startsWith('accepted-') || n.id.startsWith('member-joined-')
  );
  const notifMap = new Map<string, NotificationItem>();
  defaultNotifs.forEach((dn) => notifMap.set(dn.id, dn));
  dynamicNotifs.forEach((dyn) => notifMap.set(dyn.id, dyn));
  return Array.from(notifMap.values());
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
  fetchFamilyMembers: () => Promise<void>;
  addFamilyMember: (member: Omit<FamilyMember, 'id' | 'joinedDate'>) => void;
  removeFamilyMember: (id: number) => void;
  updateMemberRole: (id: number, role: Role) => void;
  upgradeToFamilyAdmin: (
    familyGroupName: string,
    initialMembers?: Omit<FamilyMember, 'id' | 'joinedDate'>[]
  ) => void;

  // Core Data API Sync
  fetchCoreData: () => Promise<void>;

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
    const emailKey = user.email.toLowerCase();
    const storageKey = 'budglee_data_' + emailKey;
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

    // Nếu thuộc nhóm gia đình, đồng bộ thêm vào budglee_family_data_<familyGroupId>
    const isFamilyUser = ['thanhba@gmail.com', 'thanhme@gmail.com', 'thanhcon@gmail.com'].includes(emailKey) || !!user.familyGroupId;
    const famId = user.familyGroupId || (isFamilyUser ? 'FAM-HANHPHUC' : null);
    if (famId) {
      const famKey = 'budglee_family_data_' + famId;
      localStorage.setItem(
        famKey,
        JSON.stringify({
          wallets: payload.wallets,
          recentTransactions: payload.recentTransactions,
          budgets: payload.budgets,
          savingGoals: payload.savingGoals,
          familyMembers: payload.familyMembers,
        })
      );
    }
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
    const isPersonalThanh = emailKey === 'thanhcanhan@gmail.com' || emailKey === 'demo@budglee.com';
    const isFamilyThanh = ['thanhba@gmail.com', 'thanhme@gmail.com', 'thanhcon@gmail.com'].includes(emailKey) || user.familyGroupId === 'FAM-HANHPHUC';
    const famId = user.familyGroupId || (isFamilyThanh ? 'FAM-HANHPHUC' : null);

    const storageKey = 'budglee_data_' + emailKey;
    const savedDataStr = localStorage.getItem(storageKey);
    const famKey = famId ? 'budglee_family_data_' + famId : null;
    const famDataStr = famKey ? localStorage.getItem(famKey) : null;

    if (isFamilyThanh && famDataStr) {
      const famSaved = JSON.parse(famDataStr);
      const personalSaved = savedDataStr ? JSON.parse(savedDataStr) : {};
      const loadedWallets = famSaved.wallets ?? FAMILY_SHARED_DATA.wallets;
      const loadedTxs = mergeSeedTransactions(famSaved.recentTransactions ?? [], FAMILY_SHARED_DATA.recentTransactions);
      const loadedBudgets = famSaved.budgets ?? FAMILY_SHARED_DATA.budgets;
      const loadedGoals = famSaved.savingGoals ?? FAMILY_SHARED_DATA.savingGoals;
      const loadedMembers = famSaved.familyMembers ?? FAMILY_SHARED_DATA.familyMembers;
      const loadedNotifs = mergeRealtimeNotifications(personalSaved.notifications, FAMILY_SHARED_DATA.notifications);
      const loadedSummary = calculateDashboardSummary(loadedWallets, loadedTxs, loadedBudgets);
      const loadedBot = personalSaved.botRecommendation ?? FAMILY_SHARED_DATA.botRecommendation;

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
        botRecommendation: loadedBot,
        receivedInvitations: [],
        sentInvitations: [],
      };
    }

    if (savedDataStr) {
      const saved = JSON.parse(savedDataStr);
      const defaultSet = isPersonalThanh ? THANHCANHAN_DATA : (isFamilyThanh ? FAMILY_SHARED_DATA : null);
      const loadedWallets = saved.wallets ?? (defaultSet ? defaultSet.wallets : []);
      const loadedTxs = defaultSet
        ? mergeSeedTransactions(saved.recentTransactions ?? [], defaultSet.recentTransactions)
        : (saved.recentTransactions ?? []);
      const loadedBudgets = saved.budgets ?? (defaultSet ? defaultSet.budgets : []);
      const loadedGoals = saved.savingGoals ?? (defaultSet ? defaultSet.savingGoals : []);
      const loadedMembers = saved.familyMembers ?? (isFamilyThanh ? FAMILY_SHARED_DATA.familyMembers : []);
      const loadedNotifs = mergeRealtimeNotifications(saved.notifications, defaultSet ? defaultSet.notifications : []);
      const loadedSummary = calculateDashboardSummary(loadedWallets, loadedTxs, loadedBudgets);

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
        botRecommendation: saved.botRecommendation ?? (defaultSet ? defaultSet.botRecommendation : null),
        receivedInvitations: [],
        sentInvitations: [],
      };
    }

    if (isPersonalThanh) {
      const initialPersonal = {
        wallets: THANHCANHAN_DATA.wallets,
        recentTransactions: THANHCANHAN_DATA.recentTransactions,
        budgets: THANHCANHAN_DATA.budgets,
        savingGoals: THANHCANHAN_DATA.savingGoals,
        familyMembers: [],
        notifications: THANHCANHAN_DATA.notifications,
        dashboardSummary: calculateDashboardSummary(THANHCANHAN_DATA.wallets, THANHCANHAN_DATA.recentTransactions, THANHCANHAN_DATA.budgets),
        botRecommendation: THANHCANHAN_DATA.botRecommendation,
      };
      persistCurrentUserData(user, initialPersonal);
      return {
        currentUser: user,
        token: storedToken,
        ...initialPersonal,
        receivedInvitations: [],
        sentInvitations: [],
      };
    }

    if (isFamilyThanh) {
      const initialFam = {
        wallets: FAMILY_SHARED_DATA.wallets,
        recentTransactions: FAMILY_SHARED_DATA.recentTransactions,
        budgets: FAMILY_SHARED_DATA.budgets,
        savingGoals: FAMILY_SHARED_DATA.savingGoals,
        familyMembers: FAMILY_SHARED_DATA.familyMembers,
        notifications: FAMILY_SHARED_DATA.notifications,
        dashboardSummary: calculateDashboardSummary(FAMILY_SHARED_DATA.wallets, FAMILY_SHARED_DATA.recentTransactions, FAMILY_SHARED_DATA.budgets),
        botRecommendation: FAMILY_SHARED_DATA.botRecommendation,
      };
      persistCurrentUserData(user, initialFam);
      return {
        currentUser: user,
        token: storedToken,
        ...initialFam,
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

    // Platform admins use the dedicated administration area and must not load finance data.
    if (user.role === 'SYSTEM_ADMIN') {
      set({
        currentUser: user,
        token,
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
      return;
    }

    const emailKey = user.email.toLowerCase();
    const isPersonalThanh = emailKey === 'thanhcanhan@gmail.com' || emailKey === 'demo@budglee.com';
    const isFamilyThanh = ['thanhba@gmail.com', 'thanhme@gmail.com', 'thanhcon@gmail.com'].includes(emailKey) || user.familyGroupId === 'FAM-HANHPHUC';
    const famId = user.familyGroupId || (isFamilyThanh ? 'FAM-HANHPHUC' : null);

    const storageKey = 'budglee_data_' + emailKey;
    const savedDataStr = localStorage.getItem(storageKey);
    const famKey = famId ? 'budglee_family_data_' + famId : null;
    const famDataStr = famKey ? localStorage.getItem(famKey) : null;

    // Nếu là thành viên gia đình và đã có dữ liệu gia đình dùng chung được lưu trước đó:
    if (isFamilyThanh && famDataStr && !isNewRegistration) {
      try {
        const famSaved = JSON.parse(famDataStr);
        const personalSaved = savedDataStr ? JSON.parse(savedDataStr) : {};
        const loadedWallets = famSaved.wallets ?? FAMILY_SHARED_DATA.wallets;
        const loadedTxs = mergeSeedTransactions(famSaved.recentTransactions ?? [], FAMILY_SHARED_DATA.recentTransactions);
        const loadedBudgets = famSaved.budgets ?? FAMILY_SHARED_DATA.budgets;
        const loadedGoals = famSaved.savingGoals ?? FAMILY_SHARED_DATA.savingGoals;
        const loadedMembers = famSaved.familyMembers ?? FAMILY_SHARED_DATA.familyMembers;
        const loadedNotifs = mergeRealtimeNotifications(personalSaved.notifications, FAMILY_SHARED_DATA.notifications);
        const loadedSummary = calculateDashboardSummary(loadedWallets, loadedTxs, loadedBudgets);
        const loadedBot = personalSaved.botRecommendation ?? FAMILY_SHARED_DATA.botRecommendation;

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
          botRecommendation: loadedBot,
        });
        setTimeout(() => {
          get().fetchReceivedInvitations();
          get().fetchSentInvitations();
          get().fetchFamilyMembers();
          get().fetchCoreData();
        }, 50);
        return;
      } catch (err) {
        console.error('Failed to parse saved family data:', err);
      }
    }

    // Nếu đã có dữ liệu lưu trữ từ trước của cá nhân và không phải đăng ký mới:
    if (savedDataStr && !isNewRegistration) {
      try {
        const saved = JSON.parse(savedDataStr);
        const defaultSet = isPersonalThanh ? THANHCANHAN_DATA : (isFamilyThanh ? FAMILY_SHARED_DATA : null);
        const loadedWallets = saved.wallets ?? (defaultSet ? defaultSet.wallets : []);
        const loadedTxs = defaultSet
          ? mergeSeedTransactions(saved.recentTransactions ?? [], defaultSet.recentTransactions)
          : (saved.recentTransactions ?? []);
        const loadedBudgets = saved.budgets ?? (defaultSet ? defaultSet.budgets : []);
        const loadedGoals = saved.savingGoals ?? (defaultSet ? defaultSet.savingGoals : []);
        const loadedMembers = saved.familyMembers ?? (isFamilyThanh ? FAMILY_SHARED_DATA.familyMembers : []);
        const loadedNotifs = mergeRealtimeNotifications(saved.notifications, defaultSet ? defaultSet.notifications : []);
        const loadedSummary = calculateDashboardSummary(loadedWallets, loadedTxs, loadedBudgets);

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
          botRecommendation: saved.botRecommendation ?? (defaultSet ? defaultSet.botRecommendation : null),
        });
        setTimeout(() => {
          get().fetchReceivedInvitations();
          get().fetchSentInvitations();
          get().fetchCoreData();
        }, 50);
        return;
      } catch (err) {
        console.error('Failed to parse saved user data:', err);
      }
    }

    // Lần đầu đăng nhập tài khoản cá nhân: nạp bộ dữ liệu phong phú THANHCANHAN_DATA
    if (isPersonalThanh && !isNewRegistration) {
      const personalSummary = calculateDashboardSummary(THANHCANHAN_DATA.wallets, THANHCANHAN_DATA.recentTransactions, THANHCANHAN_DATA.budgets);
      const personalState = {
        wallets: THANHCANHAN_DATA.wallets,
        recentTransactions: THANHCANHAN_DATA.recentTransactions,
        budgets: THANHCANHAN_DATA.budgets,
        savingGoals: THANHCANHAN_DATA.savingGoals,
        familyMembers: [],
        notifications: THANHCANHAN_DATA.notifications,
        dashboardSummary: personalSummary,
        botRecommendation: THANHCANHAN_DATA.botRecommendation,
      };
      set({
        currentUser: user,
        token,
        ...personalState,
      });
      persistCurrentUserData(user, personalState);
      setTimeout(() => {
        get().fetchReceivedInvitations();
        get().fetchSentInvitations();
        get().fetchCoreData();
      }, 50);
      return;
    }

    // Lần đầu đăng nhập tài khoản gia đình: nạp bộ dữ liệu mẫu FAMILY_SHARED_DATA
    if (isFamilyThanh && !isNewRegistration) {
      const famSummary = calculateDashboardSummary(FAMILY_SHARED_DATA.wallets, FAMILY_SHARED_DATA.recentTransactions, FAMILY_SHARED_DATA.budgets);
      const famState = {
        wallets: FAMILY_SHARED_DATA.wallets,
        recentTransactions: FAMILY_SHARED_DATA.recentTransactions,
        budgets: FAMILY_SHARED_DATA.budgets,
        savingGoals: FAMILY_SHARED_DATA.savingGoals,
        familyMembers: FAMILY_SHARED_DATA.familyMembers,
        notifications: FAMILY_SHARED_DATA.notifications,
        dashboardSummary: famSummary,
        botRecommendation: FAMILY_SHARED_DATA.botRecommendation,
      };
      set({
        currentUser: user,
        token,
        ...famState,
      });
      persistCurrentUserData(user, famState);
      setTimeout(() => {
        get().fetchReceivedInvitations();
        get().fetchSentInvitations();
        get().fetchCoreData();
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

    if (get().token) {
      WalletService.create({
        name: walletData.walletName,
        walletType: walletData.type || 'BANK',
        initialBalance: walletData.balance,
        currency: walletData.currency || 'VND',
        bankName: (walletData as any).bankName || '',
        accountNumber: walletData.cardNumberMasked || '',
      }).catch((e) => console.warn('Background sync wallet to API:', e?.message));
    }
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
    set((state) => {
      const targetWallet =
        state.wallets.find((w) => w.id === txData.walletId) ||
        state.wallets.find((w) => w.walletName === txData.walletName) ||
        state.wallets[0];

      const actualWalletId = targetWallet ? targetWallet.id : txData.walletId;
      const actualWalletName = targetWallet ? targetWallet.walletName : (txData.walletName || 'Ví chính');

      const updatedWallets = state.wallets.map((w) => {
        if (w.id === actualWalletId) {
          const newBal =
            txData.transactionType === 'INCOME'
              ? w.balance + txData.amount
              : w.balance - txData.amount;
          return { ...w, balance: newBal };
        }
        return w;
      });

      const actualBalanceAfter = targetWallet
        ? (txData.transactionType === 'INCOME'
            ? targetWallet.balance + txData.amount
            : targetWallet.balance - txData.amount)
        : txData.balanceAfter;

      const newTx: Transaction = {
        ...txData,
        id: Date.now(),
        walletId: actualWalletId,
        walletName: actualWalletName,
        balanceAfter: actualBalanceAfter,
      };

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

    if (get().token) {
      const targetW = get().wallets.find((w) => w.id === txData.walletId) || get().wallets[0];
      TransactionService.create({
        walletId: targetW ? targetW.id : txData.walletId,
        categoryId: txData.categoryId || 1,
        amount: txData.amount,
        transactionType: txData.transactionType,
        note: txData.note || txData.actionTitle || '',
        transactionDate: txData.transactionDate || new Date().toISOString(),
      }).catch((e) => console.warn('Background sync transaction to API:', e?.message));
    }
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

    if (get().token) {
      BudgetService.create({
        categoryId: budgetData.categoryId || 1,
        amountLimit: budgetData.amountLimit,
        periodMonth: budgetData.periodMonth || (new Date().getMonth() + 1),
        periodYear: budgetData.periodYear || new Date().getFullYear(),
      }).catch((e) => console.warn('Background sync budget to API:', e?.message));
    }
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

      const famId = state.currentUser?.familyGroupId || 'FAM-HANHPHUC';
      try {
        const famKey = 'budglee_family_data_' + famId;
        const famSavedStr = localStorage.getItem(famKey);
        if (famSavedStr) {
          const famSaved = JSON.parse(famSavedStr);
          famSaved.familyMembers = updated;
          localStorage.setItem(famKey, JSON.stringify(famSaved));
        }
      } catch (e) {}

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('budglee_invitation_update', { detail: { action: 'MEMBER_REMOVED', id } }));
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

  fetchCoreData: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [walletsRes, txsRes, budgetsRes, summaryRes, botRes] = await Promise.allSettled([
        WalletService.getAll(),
        TransactionService.getAll(0, 100),
        BudgetService.getAll(month, year),
        DashboardService.getSummary(year, month),
        DashboardService.getRecommendations(year, month),
      ]);

      const updates: any = {};
      if (walletsRes.status === 'fulfilled' && Array.isArray(walletsRes.value) && walletsRes.value.length > 0) {
        updates.wallets = walletsRes.value.map((w: any) => ({
          id: w.id,
          walletName: w.name || w.walletName,
          cardNumberMasked: w.accountNumber || w.cardNumberMasked || '',
          balance: Number(w.balance || w.initialBalance || 0),
          currency: w.currency || 'VND',
          type: w.walletType || w.type || 'BANK',
          color: w.color || 'from-slate-900 to-indigo-950',
          bankName: w.bankName,
        }));
      }

      if (txsRes.status === 'fulfilled' && txsRes.value && Array.isArray(txsRes.value.content) && txsRes.value.content.length > 0) {
        updates.recentTransactions = txsRes.value.content.map((t: any) => ({
          id: t.id,
          walletId: t.wallet?.id || t.walletId || 1,
          walletName: t.wallet?.name || t.walletName || 'Ví',
          categoryName: t.category?.name || t.categoryName || 'Chi tiêu',
          categoryIcon: t.category?.icon || t.categoryIcon || 'ShoppingBag',
          actionTitle: t.note || t.actionTitle || 'Giao dịch',
          amount: Number(t.amount || 0),
          transactionType: t.transactionType,
          transactionDate: t.transactionDate,
          balanceAfter: Number(t.balanceAfter || 0),
          note: t.note,
        }));
      }

      if (budgetsRes.status === 'fulfilled' && Array.isArray(budgetsRes.value) && budgetsRes.value.length > 0) {
        updates.budgets = budgetsRes.value.map((b: any) => ({
          id: b.id,
          categoryName: b.category?.name || b.categoryName || 'Danh mục',
          categoryIcon: b.category?.icon || b.categoryIcon || 'Tag',
          amountLimit: Number(b.amountLimit || 0),
          spentAmount: Number(b.spentAmount || b.actualSpent || 0),
          periodMonth: b.periodMonth || month,
          periodYear: b.periodYear || year,
        }));
      }

      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        updates.dashboardSummary = summaryRes.value;
      }

      if (botRes.status === 'fulfilled' && botRes.value) {
        updates.botRecommendation = botRes.value;
      }

      if (Object.keys(updates).length > 0) {
        set((state) => {
          const finalWallets = updates.wallets || state.wallets;
          const finalTxs = updates.recentTransactions || state.recentTransactions;
          const finalBudgets = updates.budgets || state.budgets;
          const finalSummary = updates.dashboardSummary || calculateDashboardSummary(finalWallets, finalTxs, finalBudgets);
          const finalBot = updates.botRecommendation || state.botRecommendation;
          const newState = {
            wallets: finalWallets,
            recentTransactions: finalTxs,
            budgets: finalBudgets,
            dashboardSummary: finalSummary,
            botRecommendation: finalBot,
          };
          persistCurrentUserData(state.currentUser, newState);
          return newState;
        });
      }
    } catch (err) {
      console.warn('fetchCoreData background sync error:', err);
    }
  },

  fetchFamilyMembers: async () => {
    const user = get().currentUser;
    if (!user) return;
    const isFamily = user.role === 'FAMILY_ADMIN' || user.role === 'FAMILY_MEMBER';
    if (!isFamily) return;

    const famId = user.familyGroupId || 'FAM-HANHPHUC';
    let members: FamilyMember[] = [];

    // 1. Thử lấy danh sách thành viên từ API backend
    try {
      const apiMembers = await FamilyApiService.getMembers();
      if (apiMembers && Array.isArray(apiMembers) && apiMembers.length > 0) {
        members = apiMembers.map((m: any) => ({
          id: m.id || m.userId,
          fullName: m.fullName || m.name || m.email,
          email: m.email,
          role: (m.role as Role) || 'FAMILY_MEMBER',
          avatarUrl: m.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
          joinedDate: m.joinedDate || 'Hôm nay',
          isOwner: m.isOwner || m.role === 'FAMILY_ADMIN',
        }));
      }
    } catch (e) {}

    // 2. Đồng bộ từ shared family storage local
    const famKey = 'budglee_family_data_' + famId;
    const famSavedStr = localStorage.getItem(famKey);
    if (famSavedStr) {
      try {
        const famSaved = JSON.parse(famSavedStr);
        if (famSaved.familyMembers && Array.isArray(famSaved.familyMembers)) {
          famSaved.familyMembers.forEach((fm: FamilyMember) => {
            if (!members.some((m) => m.email.toLowerCase() === fm.email.toLowerCase())) {
              members.push(fm);
            }
          });
        }
      } catch (e) {}
    }

    if (members.length === 0) {
      members = get().familyMembers.length > 0 ? get().familyMembers : FAMILY_SHARED_DATA.familyMembers;
    }

    set({ familyMembers: members });
  },

  fetchReceivedInvitations: async () => {
    const user = get().currentUser;
    if (!user || !user.email) return;

    let invites: FamilyInvitation[] = [];
    try {
      invites = await FamilyApiService.getReceivedInvitations();
    } catch (e) {
      // Backend request fallback
    }

    // Kiểm tra thêm ở hàng đợi lời mời localStorage của tài khoản
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
        let newNotifs = [...state.notifications];
        let hasChanges = false;
        pendingInvites.forEach((inv) => {
          const notifId = 'invite-notif-' + inv.id;
          const existingIndex = newNotifs.findIndex((n) => n.id === notifId);
          if (existingIndex < 0) {
            newNotifs.unshift({
              id: notifId,
              title: 'Lời mời tham gia Quỹ Gia đình',
              message: `${inv.invitedByName || 'Chủ hộ'} (${inv.invitedByEmail || 'chủ nhóm'}) đã gửi lời mời bạn tham gia nhóm gia đình "${inv.familyGroupName}". Hãy nhấn vào đây để xem và xác nhận!`,
              time: 'Hôm nay',
              type: 'INFO',
              read: false,
              actionType: 'FAMILY_INVITATION',
              actionData: inv,
            });
            hasChanges = true;
          }
        });
        if (hasChanges) {
          persistCurrentUserData(user, { notifications: newNotifs });
          return { notifications: newNotifs };
        }
        return {};
      });
    }
  },

  fetchSentInvitations: async () => {
    const user = get().currentUser;
    if (!user || !user.email) return;

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

    // 1. Lưu vào hàng đợi local cho người nhận để người nhận có thể thấy ngay
    try {
      const recipientKey = 'budglee_invitations_for_' + trimmedEmail;
      const existRecv: FamilyInvitation[] = JSON.parse(localStorage.getItem(recipientKey) || '[]');
      const filteredRecv = existRecv.filter((i) => i.id !== invitation.id && i.status === 'PENDING');
      filteredRecv.unshift(invitation);
      localStorage.setItem(recipientKey, JSON.stringify(filteredRecv));

      // 2. Lưu vào danh sách lời mời đã gửi của người gửi
      const senderKey = 'budglee_sent_invitations_' + user.email.toLowerCase();
      const existSent: FamilyInvitation[] = JSON.parse(localStorage.getItem(senderKey) || '[]');
      const filteredSent = existSent.filter((i) => i.id !== invitation.id);
      filteredSent.unshift(invitation);
      localStorage.setItem(senderKey, JSON.stringify(filteredSent));

      // 3. ĐẨY TRỰC TIẾP THÔNG BÁO VÀO CHUÔNG CỦA NGƯỜI NHẬN
      const recipientDataKey = 'budglee_data_' + trimmedEmail;
      const existDataStr = localStorage.getItem(recipientDataKey);
      let existData = existDataStr ? JSON.parse(existDataStr) : {};
      if (!Array.isArray(existData.notifications)) {
        existData.notifications = [];
      }
      const notifId = 'invite-notif-' + invitation.id;
      existData.notifications = existData.notifications.filter((n: any) => n.id !== notifId);
      existData.notifications.unshift({
        id: notifId,
        title: 'Lời mời tham gia Quỹ Gia đình',
        message: `${user.fullName} (${user.email}) đã gửi lời mời bạn tham gia nhóm gia đình "${invitation.familyGroupName}". Hãy nhấn vào đây để xem và xác nhận!`,
        time: 'Hôm nay',
        type: 'INFO',
        read: false,
        actionType: 'FAMILY_INVITATION',
        actionData: invitation,
      });
      localStorage.setItem(recipientDataKey, JSON.stringify(existData));

      // 4. Phát sự kiện storage và event tùy chỉnh để cập nhật chuông ngay lập tức trên các tab
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('budglee_invitation_update', {
        detail: { email: trimmedEmail, invitation }
      }));
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

    // Cập nhật trạng thái trong storage người gửi
    if (inv?.invitedByEmail) {
      try {
        const senderKey = 'budglee_sent_invitations_' + inv.invitedByEmail.toLowerCase();
        const existSent: FamilyInvitation[] = JSON.parse(localStorage.getItem(senderKey) || '[]');
        const updatedSent = existSent.map((i) => (i.id === invitationId ? { ...i, status: 'ACCEPTED' as const } : i));
        localStorage.setItem(senderKey, JSON.stringify(updatedSent));

        // Gửi thông báo cho chủ hộ (người gửi)
        const senderDataKey = 'budglee_data_' + inv.invitedByEmail.toLowerCase();
        const senderDataStr = localStorage.getItem(senderDataKey);
        let senderData = senderDataStr ? JSON.parse(senderDataStr) : {};
        if (!Array.isArray(senderData.notifications)) senderData.notifications = [];
        senderData.notifications.unshift({
          id: 'member-joined-' + Date.now(),
          title: 'Thành viên mới gia nhập',
          message: `${user.fullName} (${user.email}) đã chấp nhận lời mời và chính thức gia nhập sổ quỹ gia đình "${groupName}"!`,
          time: 'Hôm nay',
          type: 'SUCCESS',
          read: false,
        });
        localStorage.setItem(senderDataKey, JSON.stringify(senderData));
      } catch (e) {}
    }

    // Tạo member mới cho danh sách
    const newMember: FamilyMember = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: 'FAMILY_MEMBER',
      avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      joinedDate: 'Hôm nay',
      isOwner: false,
    };

    // Đồng bộ vào shared family data budglee_family_data_<groupId>
    const famKey = 'budglee_family_data_' + groupId;
    try {
      const famDataStr = localStorage.getItem(famKey);
      let famData = famDataStr ? JSON.parse(famDataStr) : {};
      if (!Array.isArray(famData.familyMembers)) {
        famData.familyMembers = [...FAMILY_SHARED_DATA.familyMembers];
      }
      if (!famData.familyMembers.some((m: FamilyMember) => m.email.toLowerCase() === user.email.toLowerCase())) {
        famData.familyMembers.push(newMember);
      }
      localStorage.setItem(famKey, JSON.stringify(famData));

      if (groupId === 'FAM-HANHPHUC') {
        localStorage.setItem('budglee_family_data_FAM-HANHPHUC', JSON.stringify(famData));
      }
    } catch (e) {}

    // Thông báo thành công cho người nhận
    const successNotif: NotificationItem = {
      id: 'accepted-' + Date.now(),
      title: 'Gia nhập gia đình thành công!',
      message: `Chúc mừng bạn đã trở thành thành viên của "${groupName}". Bạn đã có thể bắt đầu xem và quản lý sổ quỹ chung!`,
      time: 'Hôm nay',
      type: 'SUCCESS',
      read: false,
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

    // Phát sự kiện đồng bộ giữa các tab
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('budglee_invitation_update', {
      detail: { status: 'ACCEPTED', invitationId }
    }));

    get().fetchFamilyMembers();
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

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('budglee_invitation_update', { detail: { action: 'INVITE_CANCELLED', invitationId } }));
  },
}));
