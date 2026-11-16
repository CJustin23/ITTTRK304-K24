import React, { useState } from 'react';
import {
  Check,
  X,
  Pencil,
  Loader2,
  CheckCircle2,
  XCircle,
  Wallet,
  Tag,
  FileText,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { ToolConfirmation } from '../../services/aiChatService';
import { useStore } from '../../store/useStore';

export interface TransactionConfirmationCardProps {
  confirmation: ToolConfirmation;
  isConfirmed: boolean;
  isCancelled: boolean;
  isConfirming: boolean;
  onConfirm: (
    confirmation: ToolConfirmation,
    overrides?: {
      amount?: number;
      walletId?: number;
      walletName?: string;
      categoryName?: string;
      note?: string;
      type?: string;
    }
  ) => Promise<void>;
  onCancel: (confirmation: ToolConfirmation) => void;
}

const COMMON_CATEGORIES = [
  'Ăn uống',
  'Mua sắm',
  'Di chuyển',
  'Hóa đơn & Tiện ích',
  'Sức khỏe',
  'Giáo dục',
  'Lương & Thưởng',
  'Đầu tư',
  'Khác',
];

export const TransactionConfirmationCard: React.FC<TransactionConfirmationCardProps> = ({
  confirmation,
  isConfirmed,
  isCancelled,
  isConfirming,
  onConfirm,
  onCancel,
}) => {
  const wallets = useStore((state) => state.wallets) || [];

  // Local state for editing fields
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState<number>(confirmation.amount || 0);
  const [actionType, setActionType] = useState<string>(
    confirmation.actionType === 'INCOME' ? 'INCOME' : 'EXPENSE'
  );

  // Match wallet ID if available or find from wallets list by name
  const initialWallet = wallets.find(
    (w) =>
      (confirmation.parameters?.walletId && w.id === confirmation.parameters.walletId) ||
      (confirmation.walletName &&
        w.walletName.toLowerCase().includes(confirmation.walletName.toLowerCase()))
  ) || wallets[0];

  const [selectedWalletId, setSelectedWalletId] = useState<number | undefined>(
    initialWallet?.id || confirmation.parameters?.walletId
  );
  const [walletName, setWalletName] = useState<string>(
    initialWallet?.walletName || confirmation.walletName || 'Ví mặc định'
  );

  const [categoryName, setCategoryName] = useState<string>(
    confirmation.categoryName || 'Ăn uống'
  );
  const [note, setNote] = useState<string>(confirmation.note || '');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val || 0) + ' đ';
  };

  const handleWalletSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedWalletId(id);
    const found = wallets.find((w) => w.id === id);
    if (found) {
      setWalletName(found.walletName);
    }
  };

  const handleConfirm = () => {
    onConfirm(confirmation, {
      amount,
      walletId: selectedWalletId,
      walletName,
      categoryName,
      note,
      type: actionType,
    });
  };

  return (
    <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-400/90 dark:border-emerald-600/70 shadow-sm text-slate-800 dark:text-slate-100 transition-all">
      {/* Header: Title + Robot Icon + Edit Toggle */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-100/70 dark:border-slate-800">
        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
          <span>Xác nhận Giao dịch (Human-in-the-Loop)</span>
          <span className="text-base leading-none">🤖</span>
        </div>

        {!isConfirmed && !isCancelled && (
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`p-1 sm:px-2 sm:py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
              isEditing
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800'
            }`}
            title="Chỉnh sửa thông tin giao dịch"
          >
            <Pencil className="w-3 h-3" />
            <span className="hidden sm:inline">{isEditing ? 'Đóng sửa' : 'Sửa'}</span>
          </button>
        )}
      </div>

      {/* Content Area: View Mode vs Edit Mode */}
      {isEditing ? (
        /* Edit Form Mode */
        <div className="space-y-2.5 py-1 text-xs">
          {/* Loại giao dịch */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Loại giao dịch:
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActionType('EXPENSE')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors ${
                  actionType === 'EXPENSE'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                Chi tiêu
              </button>
              <button
                type="button"
                onClick={() => setActionType('INCOME')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors ${
                  actionType === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Thu nhập
              </button>
            </div>
          </div>

          {/* Số tiền */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              Số tiền (VNĐ):
            </label>
            <input
              type="number"
              min="1000"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              placeholder="Nhập số tiền..."
            />
          </div>

          {/* Ví nguồn */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
              <Wallet className="w-3 h-3 text-emerald-600" />
              Ví nguồn / Tài khoản:
            </label>
            {wallets.length > 0 ? (
              <select
                value={selectedWalletId || ''}
                onChange={handleWalletSelect}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.walletName} ({new Intl.NumberFormat('vi-VN').format(w.balance || 0)} ₫)
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            )}
          </div>

          {/* Danh mục */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-emerald-600" />
              Danh mục:
            </label>
            <div className="flex gap-1.5">
              <select
                value={COMMON_CATEGORIES.includes(categoryName) ? categoryName : 'Khác'}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Tên danh mục..."
                className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-emerald-600" />
              Ghi chú:
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú giao dịch..."
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
            />
          </div>
        </div>
      ) : (
        /* View Display Mode - Khớp với hình ảnh yêu cầu */
        <div className="space-y-1.5 py-1 text-xs text-slate-700 dark:text-slate-200">
          {/* Row 1: Loại & Số tiền */}
          <div className="flex items-center gap-2">
            <span>
              Loại:{' '}
              <strong className={actionType === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}>
                {actionType === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}
              </strong>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>
              Số tiền: <strong className="underline decoration-emerald-500/40 text-slate-900 dark:text-white">{formatCurrency(amount)}</strong>
            </span>
          </div>

          {/* Row 2: Ví & Danh mục */}
          <div className="flex items-center gap-2">
            <span>
              Ví: <strong className="text-slate-900 dark:text-white">{walletName}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>
              Danh mục: <strong className="text-slate-900 dark:text-white">{categoryName}</strong>
            </span>
          </div>

          {/* Row 3 (Tùy chọn): Ghi chú */}
          {note && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              Ghi chú: <span className="italic">{note}</span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="pt-2.5">
        {isConfirmed ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 px-3 py-2 rounded-xl justify-center shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã ghi chép thành công vào Sổ</span>
          </div>
        ) : isCancelled ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl justify-center">
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>Đã hủy bỏ giao dịch</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Nút Hủy */}
            <button
              type="button"
              onClick={() => onCancel(confirmation)}
              disabled={isConfirming}
              className="py-2.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hủy</span>
            </button>

            {/* Nút Sửa (nếu đang ở View mode) */}
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isConfirming}
                className="py-2.5 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Sửa</span>
              </button>
            )}

            {/* Nút Xác nhận & Ghi vào Sổ */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirming || amount <= 0}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              {isConfirming ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Xác nhận & Ghi vào Sổ</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
