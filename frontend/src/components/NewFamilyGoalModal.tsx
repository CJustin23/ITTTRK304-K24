import React, { useState } from 'react';
import { X, Target, Calendar, DollarSign, AlertCircle, Shield, Wallet as WalletIcon } from 'lucide-react';
import { useStore, consolidateWallets } from '../store/useStore';

export const NewFamilyGoalModal: React.FC = () => {
  const {
    isFamilyGoalModalOpen,
    setFamilyGoalModalOpen,
    addFamilySavingGoal,
    currentUser,
    wallets: rawWallets,
  } = useStore();

  const wallets = consolidateWallets(rawWallets);

  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<number | ''>(wallets[0]?.id || '');
  const [deadline, setDeadline] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isFamilyGoalModalOpen) return null;

  const isOwnerOrAdmin =
    currentUser?.role === 'FAMILY_ADMIN' ||
    (currentUser as any)?.isOwner ||
    currentUser?.email === 'thanhba@gmail.com';

  const handleTargetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      setTargetAmount('');
      return;
    }
    const formatted = new Intl.NumberFormat('vi-VN').format(Number(digits));
    setTargetAmount(formatted);
    if (errors.targetAmount) setErrors((prev) => ({ ...prev, targetAmount: '' }));
  };

  const handleInitialDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      setInitialDeposit('');
      return;
    }
    const formatted = new Intl.NumberFormat('vi-VN').format(Number(digits));
    setInitialDeposit(formatted);
    if (errors.initialDeposit) setErrors((prev) => ({ ...prev, initialDeposit: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) {
      setErrors({ permission: 'Chỉ có Chủ hộ mới có quyền tạo mục tiêu chung cho gia đình!' });
      return;
    }

    const errs: Record<string, string> = {};

    if (!goalName.trim()) {
      errs.goalName = 'Vui lòng đặt tên cho mục tiêu chung của gia đình';
    } else if (goalName.trim().length < 2) {
      errs.goalName = 'Tên mục tiêu phải có ít nhất 2 ký tự';
    }

    const rawTarget = targetAmount.replace(/\./g, '');
    const numTarget = parseFloat(rawTarget);
    if (!rawTarget.trim()) {
      errs.targetAmount = 'Vui lòng nhập số tiền mục tiêu cần tích lũy';
    } else if (isNaN(numTarget) || numTarget <= 0) {
      errs.targetAmount = 'Số tiền mục tiêu phải lớn hơn 0 ₫';
    }

    const rawDeposit = initialDeposit.replace(/\./g, '');
    const numDeposit = parseFloat(rawDeposit) || 0;
    if (numDeposit < 0) {
      errs.initialDeposit = 'Số tiền tích lũy ban đầu không hợp lệ';
    } else if (numTarget > 0 && numDeposit > numTarget) {
      errs.initialDeposit = 'Số tiền ban đầu không được vượt quá số tiền mục tiêu';
    } else if (numDeposit > 0) {
      if (!selectedWalletId) {
        errs.wallet = 'Vui lòng chọn nguồn tiền để trích nạp ban đầu';
      } else {
        const wallet = wallets.find((w) => w.id === selectedWalletId);
        if (wallet && numDeposit > wallet.balance) {
          errs.initialDeposit = `Số dư nguồn tiền không đủ (${new Intl.NumberFormat('vi-VN').format(wallet.balance)} ₫)`;
        }
      }
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

    const success = addFamilySavingGoal(
      {
        goalName: goalName.trim(),
        targetAmount: numTarget,
        currentAmount: numDeposit,
        deadline: deadline || undefined,
        status: numDeposit >= numTarget ? 'COMPLETED' : 'IN_PROGRESS',
        color: 'emerald',
      },
      selectedWalletId ? Number(selectedWalletId) : undefined,
      numDeposit
    );

    if (success) {
      setGoalName('');
      setTargetAmount('');
      setInitialDeposit('');
      setDeadline('');
      setErrors({});
      setFamilyGoalModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Tạo Mục tiêu Chung Gia đình</h3>
              <p className="text-xs text-slate-400 mt-0.5">Chỉ Chủ hộ (Admin) có quyền thiết lập</p>
            </div>
          </div>
          <button
            onClick={() => {
              setErrors({});
              setFamilyGoalModalOpen(false);
            }}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.permission && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.permission}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tên mục tiêu tích lũy chung *
            </label>
            <input
              type="text"
              placeholder="VD: Đổi xe ô tô VinFast VF7, Quỹ học Đại học cho Con..."
              value={goalName}
              onChange={(e) => {
                setGoalName(e.target.value);
                if (errors.goalName) setErrors((prev) => ({ ...prev, goalName: '' }));
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                errors.goalName
                  ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/30'
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
              }`}
            />
            {errors.goalName && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.goalName}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Số tiền mục tiêu chung (VNĐ) *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="VD: 500.000.000"
                value={targetAmount}
                onChange={handleTargetAmountChange}
                className={`w-full pl-3.5 pr-8 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-all ${
                  errors.targetAmount
                    ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/30'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ₫
              </span>
            </div>
            {errors.targetAmount && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.targetAmount}</span>
              </p>
            )}
          </div>

          {/* Initial Deposit (Optional) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chủ hộ nạp tích lũy ban đầu (Tùy chọn)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0"
                  value={initialDeposit}
                  onChange={handleInitialDepositChange}
                  className="w-full pl-3.5 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-emerald-500 bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ₫
                </span>
              </div>
              {errors.initialDeposit && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.initialDeposit}</span>
                </p>
              )}
            </div>

            {initialDeposit && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nguồn tiền trích nạp ban đầu *
                </label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.walletName} ({new Intl.NumberFormat('vi-VN').format(w.balance)} ₫)
                    </option>
                  ))}
                </select>
                {errors.wallet && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.wallet}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Hạn chót hoàn thành (Tùy chọn)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                if (errors.deadline) setErrors((prev) => ({ ...prev, deadline: '' }));
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500"
            />
            {errors.deadline && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.deadline}</span>
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setFamilyGoalModalOpen(false);
              }}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              + Tạo Mục tiêu Chung
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
