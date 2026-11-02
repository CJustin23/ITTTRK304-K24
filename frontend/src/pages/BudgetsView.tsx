import React, { useState } from 'react';
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
  Edit2,
  Trash2,
  X,
  DollarSign,
  Percent,
  Check,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Budget } from '../types';

export const BudgetsView: React.FC = () => {
  const { budgets, setBudgetModalOpen, updateBudget, deleteBudget } = useStore();

  // State chỉnh sửa ngân sách
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editAmountLimit, setEditAmountLimit] = useState('');
  const [editAlertThreshold, setEditAlertThreshold] = useState('80');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // State xác nhận xóa
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);

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

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setEditCategoryName(b.categoryName || 'Ăn uống & Cà phê');
    setEditAmountLimit(b.amountLimit.toString());
    setEditAlertThreshold((b.alertThreshold || 80).toString());
    setEditErrors({});
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;

    const errs: Record<string, string> = {};
    const numLimit = parseFloat(editAmountLimit);

    if (!editAmountLimit.trim()) {
      errs.amountLimit = 'Vui lòng nhập hạn mức ngân sách';
    } else if (isNaN(numLimit) || numLimit <= 0) {
      errs.amountLimit = 'Hạn mức ngân sách phải lớn hơn 0 ₫';
    }

    const numThreshold = parseFloat(editAlertThreshold);
    if (!editAlertThreshold.trim()) {
      errs.alertThreshold = 'Vui lòng nhập ngưỡng phần trăm cảnh báo';
    } else if (isNaN(numThreshold) || numThreshold < 10 || numThreshold > 100) {
      errs.alertThreshold = 'Ngưỡng cảnh báo phải nằm trong khoảng từ 10% đến 100%';
    }

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    updateBudget(editingBudget.id, {
      categoryName: editCategoryName,
      amountLimit: numLimit,
      alertThreshold: numThreshold || 80,
    });

    setEditingBudget(null);
  };

  const handleConfirmDelete = () => {
    if (deletingBudget) {
      deleteBudget(deletingBudget.id);
      setDeletingBudget(null);
    }
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
            Thiết lập, chỉnh sửa hạn mức chi theo danh mục kèm cơ chế cảnh báo đổi màu (80% / 100%)
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
            Tổng hạn mức thiết lập
          </p>
          <h3 className="text-2xl font-black text-slate-800">
            {new Intl.NumberFormat('vi-VN').format(totalLimit)} ₫
          </h3>
          <p className="text-xs text-slate-400 mt-2">{budgets.length} danh mục có hạn mức</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tổng tiền đã chi tiêu
          </p>
          <h3 className="text-2xl font-black text-slate-800">
            {new Intl.NumberFormat('vi-VN').format(totalSpent)} ₫
          </h3>
          <p className="text-xs text-emerald-600 mt-2 font-medium">
            Đạt {overallPercentage.toFixed(1)}% tổng ngân sách
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tiền còn lại trong hạn mức
          </p>
          <h3
            className={`text-2xl font-black ${
              totalRemaining < 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {new Intl.NumberFormat('vi-VN').format(Math.max(0, totalRemaining))} ₫
          </h3>
          <p className="text-xs text-emerald-600 mt-2 font-medium">Hạn mức tháng hiện tại</p>
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
      {budgets.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <PieChart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Chưa thiết lập ngân sách nào</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Hãy đặt hạn mức chi tiêu cho các danh mục (Ăn uống, Mua sắm, Di chuyển...) để kiểm soát dòng tiền tốt hơn.
          </p>
          <button
            onClick={() => setBudgetModalOpen(true)}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all"
          >
            + Thiết lập ngân sách đầu tiên
          </button>
        </div>
      ) : (
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

                  <div className="flex items-center gap-2">
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

                    {/* Nút Chỉnh sửa & Xóa */}
                    <div className="flex items-center gap-1 bg-slate-100/80 border border-slate-200 rounded-xl p-1">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        title="Chỉnh sửa hạn mức & cảnh báo"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingBudget(b)}
                        title="Xóa ngân sách này"
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
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
      )}

      {/* ===================== MODAL CHỈNH SỬA NGÂN SÁCH ===================== */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Chỉnh sửa Ngân sách</h3>
              </div>
              <button
                onClick={() => setEditingBudget(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} noValidate className="p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Hạng mục áp dụng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Ăn uống & Cà phê">Ăn uống & Cà phê</option>
                  <option value="Mua sắm & Gia đình">Mua sắm & Gia đình</option>
                  <option value="Di chuyển & Xăng xe">Di chuyển & Xăng xe</option>
                  <option value="Hóa đơn & Tiện ích">Hóa đơn & Tiện ích</option>
                  <option value="Sức khỏe & Y tế">Sức khỏe & Y tế</option>
                  <option value="Giáo dục & Khóa học">Giáo dục & Khóa học</option>
                  <option value="Giải trí & Du lịch">Giải trí & Du lịch</option>
                </select>
              </div>

              {/* Amount Limit */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Hạn mức tối đa tháng (VND) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    step="100000"
                    placeholder="VD: 5000000"
                    value={editAmountLimit}
                    onChange={(e) => {
                      setEditAmountLimit(e.target.value);
                      if (editErrors.amountLimit) setEditErrors((prev) => ({ ...prev, amountLimit: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-semibold ${
                      editErrors.amountLimit
                        ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500'
                        : 'border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {editErrors.amountLimit && (
                  <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 font-medium animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {editErrors.amountLimit}
                  </p>
                )}
              </div>

              {/* Alert Threshold */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Ngưỡng cảnh báo chi tiêu (%) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Percent className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="10"
                    max="100"
                    placeholder="80"
                    value={editAlertThreshold}
                    onChange={(e) => {
                      setEditAlertThreshold(e.target.value);
                      if (editErrors.alertThreshold) setEditErrors((prev) => ({ ...prev, alertThreshold: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-semibold ${
                      editErrors.alertThreshold
                        ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500'
                        : 'border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {editErrors.alertThreshold && (
                  <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1 font-medium animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {editErrors.alertThreshold}
                  </p>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL XÁC NHẬN XÓA NGÂN SÁCH ===================== */}
      {deletingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-800">Xóa hạn mức ngân sách?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Bạn có chắc chắn muốn xóa ngân sách danh mục <strong>"{deletingBudget.categoryName}"</strong> không? Hành động này sẽ bỏ theo dõi hạn mức chi của danh mục này.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBudget(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-rose-600/20 transition-all"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
