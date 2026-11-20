import React, { useState, useEffect, useMemo } from 'react';
import { X, PiggyBank, DollarSign, Wallet as WalletIcon, AlertCircle } from 'lucide-react';
import { useStore, consolidateWallets } from '../store/useStore';
import { SavingGoal } from '../types';

export const DepositGoalModal: React.FC = () => {
  const { wallets: rawWallets, depositToGoal, setWalletModalOpen } = useStore();
  const wallets = useMemo(() => consolidateWallets(rawWallets), [rawWallets]);
  const [goal, setGoal] = useState<SavingGoal | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<number | ''>(wallets[0]?.id || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (window as any).openDepositModal = (targetGoal: SavingGoal) => {
      setGoal(targetGoal);
      setAmount('');
      setErrors({});
      if (wallets.length > 0) {
        setSelectedWalletId(wallets[0].id);
      } else {
        setSelectedWalletId('');
      }
    };
  }, [wallets]);

  useEffect(() => {
    if (wallets.length > 0) {
      if (selectedWalletId === '' || !wallets.some((w) => w.id === selectedWalletId)) {
        setSelectedWalletId(wallets[0].id);
      }
    } else {
      setSelectedWalletId('');
    }
  }, [wallets, selectedWalletId]);

  if (!goal) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      setAmount('');
      return;
    }
    const formatted = new Intl.NumberFormat('vi-VN').format(Number(digits));
    setAmount(formatted);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const rawDigits = amount.replace(/\./g, '');
    const numAmount = parseFloat(rawDigits);
    const remainingNeeded = Math.max(goal.targetAmount - goal.currentAmount, 0);

    if (!wallets || wallets.length === 0 || selectedWalletId === '' || !wallets.some((w) => w.id === selectedWalletId)) {
      errs.wallet = 'Bạn cần có ít nhất 1 nguồn tiền (Ví / Thẻ) trong tài khoản trước khi nạp tiền!';
    }

    if (!rawDigits.trim()) {
      errs.amount = 'Vui lòng nhập số tiền nạp tích lũy';
    } else if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Số tiền nạp phải lớn hơn 0 ₫';
    } else if (numAmount > remainingNeeded) {
      errs.amount = `Số tiền nạp vượt quá số tiền còn thiếu (${new Intl.NumberFormat('vi-VN').format(remainingNeeded)} ₫)`;
    } else {
      const chosenWallet = wallets.find((w) => w.id === selectedWalletId);
      if (chosenWallet && numAmount > chosenWallet.balance) {
        errs.amount = `Số dư nguồn tiền không đủ (Số dư hiện tại: ${new Intl.NumberFormat('vi-VN').format(chosenWallet.balance)} ₫)`;
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    depositToGoal(goal.id, Number(selectedWalletId), numAmount);
    setGoal(null);
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Nạp tiền vào Mục tiêu</h3>
              <p className="text-xs text-slate-400 mt-0.5">{goal.goalName}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setErrors({});
              setGoal(null);
            }}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {wallets.length === 0 ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Chưa có Ví hoặc Thẻ ngân hàng</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Tài khoản của bạn chưa có nguồn tiền (Ví / Thẻ) nào. Bạn cần thêm ít nhất 1 ví hoặc thẻ trước khi có thể nạp tiền vào mục tiêu tiết kiệm.
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setGoal(null);
                }}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setGoal(null);
                  setWalletModalOpen(true);
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                + Thêm ví ngay
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
            {/* Target Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500">Mục tiêu còn thiếu:</span>
              <span className="font-bold text-emerald-600 text-sm">
                {new Intl.NumberFormat('vi-VN').format(
                  Math.max(goal.targetAmount - goal.currentAmount, 0)
                )}{' '}
                ₫
              </span>
            </div>

            {/* Amount to deposit */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Số tiền nạp tích lũy (VND)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="VD: 2.000.000"
                  value={amount}
                  onChange={handleAmountChange}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-bold ${
                    errors.amount
                      ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.amount}</span>
                </p>
              )}
            </div>

            {/* Wallet selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Trích xuất từ Nguồn tiền (Ví / Tài khoản)
              </label>
              <select
                value={selectedWalletId}
                onChange={(e) => {
                  setSelectedWalletId(Number(e.target.value));
                  if (errors.wallet) setErrors((prev) => ({ ...prev, wallet: '' }));
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium ${
                  errors.wallet ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-slate-200'
                }`}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.walletName}{w.cardNumberMasked ? ` (${w.cardNumberMasked})` : ''} ({new Intl.NumberFormat('vi-VN').format(w.balance)} ₫)
                  </option>
                ))}
              </select>
              {errors.wallet && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.wallet}</span>
                </p>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setGoal(null);
                }}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95"
              >
                Xác nhận nạp
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
