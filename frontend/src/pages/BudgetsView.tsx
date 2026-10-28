import React from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Utensils,
  ShoppingBag,
  Car,
  Receipt,
  Plane,
  HeartPulse,
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const BudgetsView: React.FC = () => {
  const { budgets, setBudgetModalOpen } = useStore();

  const totalLimit = budgets.reduce((sum, b) => sum + b.amountLimit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const totalRemaining = totalLimit - totalSpent;
  const overallPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  const warningBudgetsCount = budgets.filter((b) => (b.spentAmount / b.amountLimit) * 100 >= 80).length;

  const getCategoryIcon = (name: string) => {
    if (name.includes('Ăn uống')) return Utensils;
    if (name.includes('Mua sắm')) return ShoppingBag;
    if (name.includes('Di chuyển')) return Car;
    if (name.includes('Hóa đơn')) return Receipt;
    if (name.includes('Du lịch') || name.includes('Giải trí')) return Plane;
    return HeartPulse;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Quản lý Ngân sách & Hạn mức Chi tiêu
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập hạn mức chi theo danh mục kèm cơ chế cảnh báo đổi màu (80% / 100%)
          </p>
        </div>
        <button
          onClick={() => setBudgetModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thiết lập ngân sách mới</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tổng hạn mức tháng
          </p>
          <h3 className="text-2xl font-black text-slate-800">
            {new Intl.NumberFormat('vi-VN').format(totalLimit)} ₫
          </h3>
          <p className="text-xs text-slate-400 mt-2">Dành cho {budgets.length} danh mục</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tổng số tiền đã chi
          </p>
          <h3 className="text-2xl font-black text-rose-600">
            {new Intl.NumberFormat('vi-VN').format(totalSpent)} ₫
          </h3>
          <p className="text-xs text-slate-500 mt-2">Đạt {overallPercentage.toFixed(1)}% ngân sách</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Còn được phép tiêu (Left to spend)
          </p>
          <h3
            className={`text-2xl font-black ${
              totalRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {new Intl.NumberFormat('vi-VN').format(totalRemaining)} ₫
          </h3>
          <p className="text-xs text-emerald-600 mt-2 font-medium">Hạn mức tháng 10/2026</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Cảnh báo vượt ngưỡng
          </p>
          <h3
            className={`text-2xl font-black ${
              warningBudgetsCount > 0 ? 'text-amber-500' : 'text-emerald-600'
            }`}
          >
            {warningBudgetsCount} danh mục
          </h3>
          <p className="text-xs text-slate-400 mt-2">Đã chạm ngưỡng ≥ 80% hạn mức</p>
        </div>
      </div>

      {/* Main Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((b) => {
          const Icon = getCategoryIcon(b.categoryName || '');
          const percentage = (b.spentAmount / b.amountLimit) * 100;
          const leftToSpend = b.amountLimit - b.spentAmount;
          const isWarning = percentage >= b.alertThreshold && percentage < 100;
          const isOverspent = percentage >= 100;

          return (
            <div
              key={b.id}
              className={`bg-white rounded-3xl p-6 border transition-all ${
                isOverspent
                  ? 'border-rose-300 shadow-md shadow-rose-500/5 ring-1 ring-rose-200'
                  : isWarning
                  ? 'border-amber-300 shadow-md shadow-amber-500/5 ring-1 ring-amber-200'
                  : 'border-slate-200/80 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isOverspent
                        ? 'bg-rose-100 text-rose-600'
                        : isWarning
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{b.categoryName}</h4>
                    <p className="text-xs text-slate-400">
                      Hạn mức: {new Intl.NumberFormat('vi-VN').format(b.amountLimit)} ₫
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    isOverspent
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : isWarning
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {percentage.toFixed(0)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isOverspent
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Đã chi: {new Intl.NumberFormat('vi-VN').format(b.spentAmount)} ₫</span>
                  <span
                    className={`font-semibold ${
                      isOverspent
                        ? 'text-rose-600'
                        : isWarning
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {isOverspent ? 'Vượt: ' : 'Còn lại: '}
                    {new Intl.NumberFormat('vi-VN').format(Math.abs(leftToSpend))} ₫
                  </span>
                </div>
              </div>

              {/* Status Alert Badge */}
              <div
                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium border ${
                  isOverspent
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : isWarning
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                {isOverspent ? (
                  <>
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Cảnh báo đỏ: Đã vượt quá 100% ngân sách đề ra!</span>
                  </>
                ) : isWarning ? (
                  <>
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Cảnh báo vàng: Đã chạm ngưỡng {b.alertThreshold}% ngân sách!</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>An toàn: Tiến độ chi tiêu nằm trong tầm kiểm soát.</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
