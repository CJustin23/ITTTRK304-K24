import React, { useState } from 'react';
import { X, Target, Calendar, DollarSign } from 'lucide-react';
import { useStore } from '../store/useStore';

export const NewGoalModal: React.FC = () => {
  const { isGoalModalOpen, setGoalModalOpen, addSavingGoal } = useStore();

  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [deadline, setDeadline] = useState('');

  if (!isGoalModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !targetAmount) return;

    addSavingGoal({
      goalName,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(initialDeposit) || 0,
      deadline: deadline || undefined,
      status: 'IN_PROGRESS',
    });

    setGoalName('');
    setTargetAmount('');
    setInitialDeposit('');
    setDeadline('');
    setGoalModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Tạo Mục tiêu Tiết kiệm mới</h3>
          </div>
          <button
            onClick={() => setGoalModalOpen(false)}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tên mục tiêu tích lũy
            </label>
            <input
              type="text"
              required
              placeholder="VD: Mua xe máy, Quỹ du lịch Châu Âu..."
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Số tiền mục tiêu cần tích lũy (VND)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                required
                min="100000"
                step="100000"
                placeholder="VD: 50000000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Số tiền đã tích lũy sẵn (VND - Tùy chọn)
            </label>
            <input
              type="number"
              min="0"
              placeholder="Mặc định: 0"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Hạn chót hoàn thành (Deadline)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium text-slate-700"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setGoalModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20"
            >
              Lưu mục tiêu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
