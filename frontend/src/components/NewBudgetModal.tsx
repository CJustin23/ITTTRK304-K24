import React, { useState } from 'react';
import { X, PieChart, Percent, DollarSign } from 'lucide-react';
import { useStore } from '../store/useStore';

export const NewBudgetModal: React.FC = () => {
  const { isBudgetModalOpen, setBudgetModalOpen, addBudget } = useStore();

  const [categoryName, setCategoryName] = useState('Ăn uống & Cà phê');
  const [amountLimit, setAmountLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');

  if (!isBudgetModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountLimit) return;

    addBudget({
      categoryName,
      amountLimit: parseFloat(amountLimit),
      spentAmount: 0,
      periodMonth: 10,
      periodYear: 2026,
      alertThreshold: parseFloat(alertThreshold) || 80,
    });

    setAmountLimit('');
    setAlertThreshold('80');
    setBudgetModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Thiết lập Ngân sách mới</h3>
          </div>
          <button
            onClick={() => setBudgetModalOpen(false)}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Hạng mục áp dụng</label>
            <select
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
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
              Hạn mức tối đa tháng (VND)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                required
                min="50000"
                step="50000"
                placeholder="VD: 5000000"
                value={amountLimit}
                onChange={(e) => setAmountLimit(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-bold"
              />
            </div>
          </div>

          {/* Alert Threshold */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Ngưỡng cảnh báo chi tiêu (%)
            </label>
            <div className="relative">
              <Percent className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min="50"
                max="100"
                placeholder="Mặc định: 80%"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-semibold"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Hệ thống sẽ đổi màu sang cảnh báo vàng khi chi tiêu chạm ngưỡng này.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setBudgetModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20"
            >
              Lưu ngân sách
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
