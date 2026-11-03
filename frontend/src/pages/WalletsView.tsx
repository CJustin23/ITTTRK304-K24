import React, { useState } from 'react';
import { CreditCard, Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownRight, ShieldCheck, Sparkles, Building2, Banknote } from 'lucide-react';
import { useStore } from '../store/useStore';
import { WalletType } from '../types';

export const WalletsView: React.FC = () => {
  const { wallets, setWalletModalOpen } = useStore();
  const [selectedType, setSelectedType] = useState<'ALL' | WalletType>('ALL');

  const filteredWallets = wallets.filter(
    (w) => selectedType === 'ALL' || w.type === selectedType
  );

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const getTypeIcon = (type: WalletType) => {
    switch (type) {
      case 'BANK':
        return Building2;
      case 'CREDIT_CARD':
        return CreditCard;
      default:
        return Banknote;
    }
  };

  const getTypeName = (type: WalletType) => {
    switch (type) {
      case 'BANK':
        return 'Tài khoản Ngân hàng';
      case 'CREDIT_CARD':
        return 'Thẻ Tín dụng';
      default:
        return 'Ví tiền mặt (Cash)';
    }
  };

  const cardGradients = [
    'from-slate-900 via-indigo-950 to-slate-900',
    'from-emerald-950 via-teal-900 to-slate-900',
    'from-amber-950 via-stone-900 to-slate-950',
    'from-purple-950 via-indigo-900 to-slate-900',
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Quản lý Ví & Tài khoản Thẻ
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi dòng tiền trên nhiều nguồn tài khoản và thẻ tín dụng liên kết
          </p>
        </div>
        <button
          onClick={() => setWalletModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm nguồn tiền mới</span>
        </button>
      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-600/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100 mb-1">
            Tổng số dư khả dụng (Total Balance)
          </p>
          <h3 className="text-3xl font-black tracking-tight">
            {new Intl.NumberFormat('vi-VN').format(totalBalance)} ₫
          </h3>
          <p className="text-xs text-emerald-100 mt-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Đồng bộ từ {wallets.length} tài khoản liên kết</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Tài khoản Ngân hàng & Thẻ
            </p>
            <h4 className="text-2xl font-bold text-slate-800">
              {wallets.filter((w) => w.type !== 'CASH').length} thẻ
            </h4>
            <p className="text-xs text-emerald-600 font-medium mt-1">Hỗ trợ thanh toán trực tuyến</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Ví tiền mặt dự phòng
            </p>
            <h4 className="text-2xl font-bold text-slate-800">
              {new Intl.NumberFormat('vi-VN').format(
                wallets.filter((w) => w.type === 'CASH').reduce((sum, w) => sum + w.balance, 0)
              )}{' '}
              ₫
            </h4>
            <p className="text-xs text-slate-400 mt-1">Dành cho chi tiêu sinh hoạt nhanh</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <Banknote className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit text-xs font-semibold text-slate-600">
        <button
          onClick={() => setSelectedType('ALL')}
          className={`px-4 py-2 rounded-xl transition-all ${
            selectedType === 'ALL' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'hover:text-slate-900'
          }`}
        >
          Tất cả ({wallets.length})
        </button>
        <button
          onClick={() => setSelectedType('BANK')}
          className={`px-4 py-2 rounded-xl transition-all ${
            selectedType === 'BANK' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'hover:text-slate-900'
          }`}
        >
          Ngân hàng (Bank)
        </button>
        <button
          onClick={() => setSelectedType('CREDIT_CARD')}
          className={`px-4 py-2 rounded-xl transition-all ${
            selectedType === 'CREDIT_CARD' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'hover:text-slate-900'
          }`}
        >
          Thẻ Tín dụng (Credit)
        </button>
        <button
          onClick={() => setSelectedType('CASH')}
          className={`px-4 py-2 rounded-xl transition-all ${
            selectedType === 'CASH' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'hover:text-slate-900'
          }`}
        >
          Tiền mặt (Cash)
        </button>
      </div>

      {/* Visual Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWallets.map((wallet, index) => {
          const Icon = getTypeIcon(wallet.type);
          const gradient = cardGradients[index % cardGradients.length];

          return (
            <div
              key={wallet.id}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-tr ${gradient} p-7 text-white shadow-xl shadow-slate-900/10 border border-slate-700/50 hover:scale-[1.02] transition-transform duration-300 group`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    {getTypeName(wallet.type)}
                  </span>
                  <h4 className="text-xl font-bold tracking-tight mt-2.5 text-white">
                    {wallet.walletName}
                  </h4>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              {/* Balance */}
              <div className="space-y-1 mb-8">
                <p className="text-xs text-slate-400">Số dư khả dụng</p>
                <p className="text-3xl font-black tracking-tight text-white">
                  {new Intl.NumberFormat('vi-VN').format(wallet.balance)} ₫
                </p>
              </div>

              {/* Card Footer */}
              <div className="flex justify-between items-center text-xs text-slate-300 font-mono pt-4 border-t border-white/10">
                <span className="tracking-widest">{wallet.cardNumberMasked || 'TIỀN MẶT'}</span>
                <span>HSD: 12/28</span>
              </div>

              {/* Ambient Orb */}
              <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/30 transition-colors"></div>
            </div>
          );
        })}

        {/* Add Wallet Placehoder Card */}
        <button
          onClick={() => setWalletModalOpen(true)}
          className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all group min-h-[220px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-emerald-500 group-hover:text-white text-slate-500 flex items-center justify-center transition-colors mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-700 group-hover:text-emerald-700">
            Thêm tài khoản hoặc thẻ mới
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
            Liên kết thêm thẻ Visa, ví điện tử hoặc tài khoản ngân hàng phụ
          </p>
        </button>
      </div>
    </div>
  );
};
