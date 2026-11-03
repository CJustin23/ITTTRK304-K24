import React, { useState } from 'react';
import { X, Target, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

export const NewGoalModal: React.FC = () => {
  const { isGoalModalOpen, setGoalModalOpen, addSavingGoal } = useStore();

  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isGoalModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!goalName.trim()) {
      errs.goalName = 'Vui lòng đặt tên cho mục tiêu tiết kiệm';
    } else if (goalName.trim().length < 2) {
      errs.goalName = 'Tên mục tiêu phải có ít nhất 2 ký tự';
    }

    const numTarget = parseFloat(targetAmount);
    if (!targetAmount.trim()) {
      errs.targetAmount = 'Vui lòng nhập số tiền mục tiêu cần tích lũy';
    } else if (isNaN(numTarget) || numTarget <= 0) {
      errs.targetAmount = 'Số tiền mục tiêu phải lớn hơn 0 ₫';
    }

    const numDeposit = parseFloat(initialDeposit) || 0;
    if (numDeposit < 0) {
      errs.initialDeposit = 'Số tiền tích lũy ban đầu không được là số âm';
    } else if (numTarget > 0 && numDeposit > numTarget) {
      errs.initialDeposit = 'Số tiền ban đầu không được vượt quá số tiền mục tiêu';
    }

    if (deadline) {
      const selectedDate = new Date(deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errs.deadline = 'Hạn chót phải là ngày trong tương lai';
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    addSavingGoal({
      goalName: goalName.trim(),
      targetAmount: numTarget,
      currentAmount: numDeposit,
      deadline: deadline || undefined,
      status: 'IN_PROGRESS',
    });

    setGoalName('');
    setTargetAmount('');
    setInitialDeposit('');
    setDeadline('');
    setErrors({});
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
            onClick={() => {
              setErrors({});
              setGoalModalOpen(false);
            }}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tên mục tiêu tích lũy
            </label>
            <input
              type="text"
              placeholder="VD: Mua xe máy, Quỹ du lịch Châu Âu..."
              value={goalName}
              onChange={(e) => {
                setGoalName(e.target.value);
                if (errors.goalName) setErrors((prev) => ({ ...prev, goalName: '' }));
              }}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-medium ${
                errors.goalName
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
            {errors.goalName && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.goalName}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Số tiền mục tiêu cần tích lũy (VND)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                placeholder="VD: 50000000"
                value={targetAmount}
                onChange={(e) => {
                  setTargetAmount(e.target.value);
                  if (errors.targetAmount) setErrors((prev) => ({ ...prev, targetAmount: '' }));
                }}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-bold ${
                  errors.targetAmount
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
            </div>
            {errors.targetAmount && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.targetAmount}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Số tiền đã tích lũy sẵn (VND - Tùy chọn)
            </label>
            <input
              type="number"
              placeholder="Mặc định: 0"
              value={initialDeposit}
              onChange={(e) => {
                setInitialDeposit(e.target.value);
                if (errors.initialDeposit) setErrors((prev) => ({ ...prev, initialDeposit: '' }));
              }}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-semibold ${
                errors.initialDeposit
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
            {errors.initialDeposit && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.initialDeposit}</span>
              </p>
            )}
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
                onChange={(e) => {
                  setDeadline(e.target.value);
                  if (errors.deadline) setErrors((prev) => ({ ...prev, deadline: '' }));
                }}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-medium text-slate-700 ${
                  errors.deadline
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
            </div>
            {errors.deadline && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.deadline}</span>
              </p>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setGoalModalOpen(false);
              }}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95"
            >
              Lưu mục tiêu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
