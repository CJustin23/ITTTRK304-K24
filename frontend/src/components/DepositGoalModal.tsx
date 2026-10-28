import React, { useState, useEffect } from 'react';
import { X, PiggyBank, DollarSign, Wallet as WalletIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SavingGoal } from '../types';

export const DepositGoalModal: React.FC = () => {
  const { wallets, depositToGoal } = useStore();
  const [goal, setGoal] = useState<SavingGoal | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<number>(wallets[0]?.id || 1);

  useEffect(() => {
    (window as any).openDepositModal = (targetGoal: SavingGoal) => {
      setGoal(targetGoal);
      setAmount('');
    };
  }, []);

  if (!goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    depositToGoal(goal.id, selectedWalletId, parseFloat(amount));
    setGoal(null);
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
            onClick={() => setGoal(null)}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                type="number"
                required
                min="10000"
                step="10000"
                placeholder="VD: 2000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
          </div>

          {/* Wallet selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Trích xuất từ Nguồn tiền (Ví / Tài khoản)
            </label>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.walletName} ({new Intl.NumberFormat('vi-VN').format(w.balance)} ₫)
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setGoal(null)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20"
            >
              Xác nhận nạp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
