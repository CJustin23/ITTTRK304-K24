import React, { useState } from 'react';
import { X, DollarSign, AlertCircle } from 'lucide-react';
import { TransactionType, Wallet } from '../types';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onSubmit: (data: {
    walletId: number;
    actionTitle: string;
    amount: number;
    transactionType: TransactionType;
    categoryName: string;
    note?: string;
  }) => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  wallets,
  onSubmit,
}) => {
  const [transactionType, setTransactionType] = useState<TransactionType>('EXPENSE');
  const [walletId, setWalletId] = useState<number>(wallets[0]?.id || 1);
  const [actionTitle, setActionTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryName, setCategoryName] = useState('Ăn uống & Cà phê');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const numAmount = parseFloat(amount);

    if (!amount.trim()) {
      errs.amount = 'Vui lòng nhập số tiền giao dịch';
    } else if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Số tiền giao dịch phải lớn hơn 0 ₫';
    } else if (transactionType === 'EXPENSE') {
      const selectedWallet = wallets.find((w) => w.id === walletId);
      if (selectedWallet && numAmount > selectedWallet.balance) {
        errs.amount = `Số tiền chi tiêu vượt quá số dư ví (${new Intl.NumberFormat('vi-VN').format(selectedWallet.balance)} ₫)`;
      }
    }

    if (!actionTitle.trim()) {
      errs.actionTitle = 'Vui lòng nhập mô tả giao dịch';
    } else if (actionTitle.trim().length < 2) {
      errs.actionTitle = 'Mô tả giao dịch phải có ít nhất 2 ký tự';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSubmit({
      walletId,
      actionTitle: actionTitle.trim(),
      amount: numAmount,
      transactionType,
      categoryName,
      note: note.trim(),
    });

    // Reset & Close
    setActionTitle('');
    setAmount('');
    setNote('');
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Thêm giao dịch mới</h3>
          <button
            onClick={() => {
              setErrors({});
              onClose();
            }}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {/* Transaction Type Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTransactionType('EXPENSE');
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                transactionType === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khoản Chi (-)
            </button>
            <button
              type="button"
              onClick={() => {
                setTransactionType('INCOME');
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                transactionType === 'INCOME'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khoản Thu (+)
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Số tiền (VND)</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                placeholder="VD: 150000"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-semibold ${
                  errors.amount
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
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

          {/* Action Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả giao dịch</label>
            <input
              type="text"
              placeholder="VD: Cà phê sáng với bạn bè"
              value={actionTitle}
              onChange={(e) => {
                setActionTitle(e.target.value);
                if (errors.actionTitle) setErrors((prev) => ({ ...prev, actionTitle: '' }));
              }}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all ${
                errors.actionTitle
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
              }`}
            />
            {errors.actionTitle && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.actionTitle}</span>
              </p>
            )}
          </div>

          {/* Wallet Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nguồn tiền (Ví / Thẻ)</label>
            <select
              value={walletId}
              onChange={(e) => {
                setWalletId(Number(e.target.value));
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
              }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.walletName} ({new Intl.NumberFormat('vi-VN').format(w.balance)} ₫)
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Hạng mục</label>
            <select
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="Ăn uống & Cà phê">Ăn uống & Cà phê</option>
              <option value="Mua sắm & Gia đình">Mua sắm & Gia đình</option>
              <option value="Di chuyển & Xăng xe">Di chuyển & Xăng xe</option>
              <option value="Hóa đơn & Tiện ích">Hóa đơn & Tiện ích</option>
              <option value="Sức khỏe & Y tế">Sức khỏe & Y tế</option>
              <option value="Lương & Thưởng">Lương & Thưởng</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú (Tùy chọn)</label>
            <input
              type="text"
              placeholder="Ghi chú thêm..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20"
            >
              Lưu giao dịch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
