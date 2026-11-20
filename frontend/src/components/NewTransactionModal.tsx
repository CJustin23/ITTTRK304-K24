import React, { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle, Calendar } from 'lucide-react';
import { TransactionType, Wallet } from '../types';
import { useStore } from '../store/useStore';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onSubmit: (data: {
    walletId: number;
    actionTitle: string;
    amount: number;
    transactionType: TransactionType;
    categoryId: number;
    categoryName: string;
    transactionDate?: string;
    note?: string;
  }) => void;
}

const EXPENSE_CATEGORIES = [
  { id: 1, name: 'Ăn uống & Cà phê' },
  { id: 2, name: 'Mua sắm & Gia đình' },
  { id: 3, name: 'Di chuyển & Xăng xe' },
  { id: 4, name: 'Sức khỏe & Y tế' },
  { id: 5, name: 'Hóa đơn & Tiện ích' },
  { id: 6, name: 'Giáo dục & Học tập' },
  { id: 10, name: 'Khác' },
];

const INCOME_CATEGORIES = [
  { id: 7, name: 'Lương & Thưởng' },
  { id: 8, name: 'Đầu tư & Sinh lời' },
  { id: 9, name: 'Thu nhập khác' },
];

const getNowLocalDatetime = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

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
  const [categoryId, setCategoryId] = useState<number>(1);
  const [categoryName, setCategoryName] = useState('Ăn uống & Cà phê');
  const [transactionDate, setTransactionDate] = useState<string>(getNowLocalDatetime());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (wallets.length > 0 && !wallets.some((w) => w.id === walletId)) {
        setWalletId(wallets[0].id);
      }
      setTransactionDate(getNowLocalDatetime());
    }
  }, [isOpen, wallets, walletId]);

  if (!isOpen) return null;

  const currentCategories = transactionType === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (type: TransactionType) => {
    setTransactionType(type);
    if (type === 'EXPENSE') {
      setCategoryId(1);
      setCategoryName('Ăn uống & Cà phê');
    } else {
      setCategoryId(7);
      setCategoryName('Lương & Thưởng');
    }
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
  };

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

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = Number(e.target.value);
    const found = currentCategories.find((c) => c.id === selectedId);
    if (found) {
      setCategoryId(found.id);
      setCategoryName(found.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const rawDigits = amount.replace(/\./g, '');
    const numAmount = parseFloat(rawDigits);
    const activeWalletId = wallets.some((w) => w.id === walletId)
      ? walletId
      : (wallets[0]?.id || walletId);

    if (!wallets || wallets.length === 0) {
      errs.wallet = 'Bạn cần có ít nhất 1 nguồn tiền (Ví / Thẻ) trong tài khoản trước khi ghi lại chi tiêu!';
    }

    if (!rawDigits.trim()) {
      errs.amount = 'Vui lòng nhập số tiền giao dịch';
    } else if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Số tiền giao dịch phải lớn hơn 0 ₫';
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

    const isoDate = transactionDate ? `${transactionDate}:00` : undefined;

    onSubmit({
      walletId: activeWalletId,
      actionTitle: actionTitle.trim(),
      amount: numAmount,
      transactionType,
      categoryId,
      categoryName,
      transactionDate: isoDate,
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

        {wallets.length === 0 ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-800">Chưa có Ví hoặc Thẻ ngân hàng</h4>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Tài khoản của bạn chưa có nguồn tiền (Ví / Thẻ) nào. Bạn cần thêm ít nhất 1 ví trước khi có thể ghi lại giao dịch thu chi.
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  useStore.getState().setWalletModalOpen(true);
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                + Thêm ví ngay
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {/* Transaction Type Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('EXPENSE')}
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
              onClick={() => handleTypeChange('INCOME')}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                transactionType === 'INCOME'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khoản Thu (+)
            </button>
          </div>

          {/* Amount Input with dots thousand separator */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Số tiền (VND)</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="VD: 150.000"
                value={amount}
                onChange={handleAmountChange}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-bold ${
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
            {wallets.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
                <span className="flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  Bạn chưa có nguồn tiền (Ví / Thẻ) nào. Cần có ít nhất 1 ví để ghi lại chi tiêu!
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    useStore.getState().setWalletModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shrink-0 ml-2 shadow-sm"
                >
                  + Thêm ví ngay
                </button>
              </div>
            ) : (
              <select
                value={wallets.some((w) => w.id === walletId) ? walletId : (wallets[0]?.id || '')}
                onChange={(e) => {
                  setWalletId(Number(e.target.value));
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.walletName}{w.cardNumberMasked ? ` (${w.cardNumberMasked})` : ''} ({new Intl.NumberFormat('vi-VN').format(w.balance)} ₫)
                  </option>
                ))}
              </select>
            )}
            {errors.wallet && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.wallet}</span>
              </p>
            )}
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Hạng mục</label>
            <select
              value={categoryId}
              onChange={handleCategorySelect}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            >
              {currentCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Thời gian giao dịch</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="datetime-local"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
            </div>
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
              disabled={wallets.length === 0}
              className={`px-6 py-2 font-semibold text-sm rounded-xl transition-all shadow-md ${
                wallets.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
              }`}
            >
              Lưu giao dịch
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
