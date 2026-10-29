import React from 'react';
import { Wallet as WalletIcon, CreditCard, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { Wallet } from '../types';

interface CardsSectionProps {
  wallets: Wallet[];
  leftToSpend: number;
  spendingPercentage: number;
  onNewBudget: () => void;
  onNewWallet?: () => void;
}

export const CardsSection: React.FC<CardsSectionProps> = ({
  wallets,
  leftToSpend,
  spendingPercentage,
  onNewBudget,
  onNewWallet,
}) => {
  const isWarning = spendingPercentage >= 80 && spendingPercentage < 100;
  const isOverspent = spendingPercentage >= 100;
  const hasWallets = wallets.length > 0;
  const primaryWallet = hasWallets ? wallets[0] : null;

  return (
    <div className="space-y-6">
      {/* Cards Slider / Overview */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Ví & Thẻ liên kết</h3>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            {wallets.length} tài khoản
          </span>
        </div>

        {hasWallets && primaryWallet ? (
          /* Primary Visual Card (Budglee style) */
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 p-6 text-white shadow-xl shadow-slate-900/10 mb-4">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Thẻ chính (Primary)</p>
                <h4 className="text-lg font-bold tracking-wide mt-1">{primaryWallet.walletName}</h4>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <p className="text-xs text-slate-400">Số dư khả dụng</p>
              <p className="text-2xl font-black tracking-tight text-white">
                {new Intl.NumberFormat('vi-VN').format(primaryWallet.balance)} ₫
              </p>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-300 font-mono">
              <span>{primaryWallet.cardNumberMasked || (primaryWallet.type === 'CASH' ? 'Tiền mặt' : 'Tài khoản chính')}</span>
              <span>{primaryWallet.type}</span>
            </div>

            {/* Decorative ambient orb */}
            <div className="absolute -right-12 -bottom-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
          </div>
        ) : (
          /* Empty Wallet State */
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center mb-4 bg-slate-50/50">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <WalletIcon className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">Chưa liên kết ví hoặc thẻ</h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Thêm tài khoản ngân hàng hoặc ví tiền mặt để bắt đầu ghi chép dòng tiền.
            </p>
            {onNewWallet && (
              <button
                onClick={onNewWallet}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm ví đầu tiên</span>
              </button>
            )}
          </div>
        )}

        {/* Other Mini Wallets */}
        {wallets.length > 1 && (
          <div className="space-y-2.5">
            {wallets.slice(1).map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    {w.type === 'CASH' ? <WalletIcon className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{w.walletName}</p>
                    <p className="text-xs text-slate-400">{w.cardNumberMasked || 'Tiền mặt'}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {new Intl.NumberFormat('vi-VN').format(w.balance)} ₫
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget Control Box (FR-04) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-slate-800">Hạn mức ngân sách tháng</h4>
            <p className="text-xs text-slate-500 mt-0.5">Left to spend: tiền còn được phép tiêu</p>
          </div>
          <button
            onClick={onNewBudget}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New budget</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600">Đã tiêu {spendingPercentage.toFixed(1)}%</span>
            <span className={isOverspent ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}>
              Còn {new Intl.NumberFormat('vi-VN').format(leftToSpend)} ₫
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isOverspent
                  ? 'bg-rose-500'
                  : isWarning
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(spendingPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium border ${
            isOverspent
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : isWarning
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {isOverspent ? (
            <>
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Cảnh báo: Bạn đã vượt quá hạn mức ngân sách tháng này!</span>
            </>
          ) : isWarning ? (
            <>
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Lưu ý: Bạn đã chạm 80% hạn mức chi tiêu. Hãy cân nhắc các khoản chi!</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>You are on track! Chi tiêu vẫn nằm trong tầm kiểm soát an toàn.</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
