import React, { useState } from 'react';
import { X, Building2, CreditCard, Banknote } from 'lucide-react';
import { useStore } from '../store/useStore';
import { WalletType } from '../types';

export const NewWalletModal: React.FC = () => {
  const { isWalletModalOpen, setWalletModalOpen, addWallet } = useStore();

  const [walletName, setWalletName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<WalletType>('BANK');
  const [cardNumberMasked, setCardNumberMasked] = useState('');

  if (!isWalletModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName || !balance) return;

    addWallet({
      walletName,
      balance: parseFloat(balance),
      type,
      currency: 'VND',
      cardNumberMasked: cardNumberMasked ? `**** ${cardNumberMasked.slice(-4)}` : undefined,
    });

    // Reset & close
    setWalletName('');
    setBalance('');
    setCardNumberMasked('');
    setWalletModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Thêm nguồn tiền (Ví / Thẻ) mới</h3>
          <button
            onClick={() => setWalletModalOpen(false)}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Wallet Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Loại tài khoản</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('BANK')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  type === 'BANK'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Ngân hàng</span>
              </button>
              <button
                type="button"
                onClick={() => setType('CREDIT_CARD')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  type === 'CREDIT_CARD'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Thẻ tín dụng</span>
              </button>
              <button
                type="button"
                onClick={() => setType('CASH')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  type === 'CASH'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Tiền mặt</span>
              </button>
            </div>
          </div>

          {/* Wallet Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tên Ví / Thẻ</label>
            <input
              type="text"
              required
              placeholder="VD: MB Bank, MoMo, Thẻ Visa..."
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
            />
          </div>

          {/* Initial Balance */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Số dư ban đầu (VND)</label>
            <input
              type="number"
              required
              min="0"
              step="1000"
              placeholder="VD: 5000000"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold"
            />
          </div>

          {/* Card Number Masked (If card or bank) */}
          {type !== 'CASH' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                4 số cuối của thẻ (Tùy chọn)
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="VD: 6789"
                value={cardNumberMasked}
                onChange={(e) => setCardNumberMasked(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
              />
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setWalletModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20"
            >
              Lưu tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
