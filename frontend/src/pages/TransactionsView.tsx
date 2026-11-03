import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  Plus,
  Calendar,
  Wallet as WalletIcon,
  Tag,
  ArrowLeftRight,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { TransactionType } from '../types';

export const TransactionsView: React.FC = () => {
  const { recentTransactions, wallets, setTransactionModalOpen } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');
  const [filterWalletId, setFilterWalletId] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Filter transactions
  const filtered = recentTransactions.filter((tx) => {
    const matchesSearch =
      tx.actionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.categoryName && tx.categoryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.amount.toString().includes(searchQuery);

    const matchesType = filterType === 'ALL' || tx.transactionType === filterType;
    const matchesWallet = filterWalletId === 'ALL' || tx.walletId === Number(filterWalletId);
    const matchesCategory = filterCategory === 'ALL' || tx.categoryName === filterCategory;

    return matchesSearch && matchesType && matchesWallet && matchesCategory;
  });

  // Calculate filtered totals
  const totalFilteredIncome = filtered
    .filter((t) => t.transactionType === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFilteredExpense = filtered
    .filter((t) => t.transactionType === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalFilteredIncome - totalFilteredExpense;

  const handleExportCSV = () => {
    const headers = ['Mã GD,Tiêu đề,Loại,Danh mục,Ví,Số tiền,Thời gian,Ghi chú\n'];
    const rows = filtered.map(
      (t) =>
        `"${t.id}","${t.actionTitle}","${t.transactionType}","${t.categoryName || ''}","${
          t.walletName || ''
        }","${t.amount}","${t.transactionDate}","${t.note || ''}"\n`
    );
    const blob = new Blob([headers.concat(rows).join('')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `budglee_giao_dich_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Lịch sử & Hoạt động Giao dịch
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tra cứu, lọc đa tiêu chí và đối soát toàn bộ các khoản thu chi phát sinh
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Xuất CSV</span>
          </button>
          <button
            onClick={() => setTransactionModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm giao dịch</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards of Current Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tổng thu (Theo bộ lọc)
          </p>
          <h4 className="text-2xl font-black text-emerald-600">
            +{new Intl.NumberFormat('vi-VN').format(totalFilteredIncome)} ₫
          </h4>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Tổng chi (Theo bộ lọc)
          </p>
          <h4 className="text-2xl font-black text-rose-600">
            -{new Intl.NumberFormat('vi-VN').format(totalFilteredExpense)} ₫
          </h4>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Thặng dư ròng (Net Savings)
          </p>
          <h4
            className={`text-2xl font-black ${
              netBalance >= 0 ? 'text-slate-800' : 'text-rose-600'
            }`}
          >
            {netBalance >= 0 ? '+' : ''}
            {new Intl.NumberFormat('vi-VN').format(netBalance)} ₫
          </h4>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Keyword Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên giao dịch, số tiền, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Wallet Filter */}
          <div>
            <select
              value={filterWalletId}
              onChange={(e) => setFilterWalletId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium text-slate-700"
            >
              <option value="ALL">Tất cả các Ví / Thẻ</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.walletName}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium text-slate-700"
            >
              <option value="ALL">Tất cả Danh mục</option>
              <option value="Ăn uống & Cà phê">Ăn uống & Cà phê</option>
              <option value="Mua sắm & Gia đình">Mua sắm & Gia đình</option>
              <option value="Di chuyển & Xăng xe">Di chuyển & Xăng xe</option>
              <option value="Hóa đơn & Tiện ích">Hóa đơn & Tiện ích</option>
              <option value="Lương & Thưởng">Lương & Thưởng</option>
            </select>
          </div>
        </div>

        {/* Transaction Type Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Phân loại:</span>
          </span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'ALL' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'hover:text-slate-900'
              }`}
            >
              Tất cả ({filtered.length})
            </button>
            <button
              onClick={() => setFilterType('INCOME')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Khoản Thu (+)
            </button>
            <button
              onClick={() => setFilterType('EXPENSE')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Khoản Chi (-)
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Giao dịch / Tiêu đề</th>
                <th className="py-4 px-6">Hạng mục</th>
                <th className="py-4 px-6">Nguồn tiền (Ví)</th>
                <th className="py-4 px-6">Thời gian</th>
                <th className="py-4 px-6 text-right">Số tiền</th>
                <th className="py-4 px-6 text-right">Số dư sau GD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy bản ghi giao dịch nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isIncome = t.transactionType === 'INCOME';
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isIncome
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-rose-100 text-rose-600'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDownRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">
                              {t.actionTitle}
                            </p>
                            {t.note && (
                              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                                {t.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          <Tag className="w-3 h-3 text-emerald-600" />
                          <span>{t.categoryName || 'Chung'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {t.walletName || 'Techcombank'}
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs font-mono">
                        {t.transactionDate}
                      </td>
                      <td className="py-4 px-6 text-right font-black">
                        <span className={isIncome ? 'text-emerald-600' : 'text-slate-800'}>
                          {isIncome ? '+' : '-'} {new Intl.NumberFormat('vi-VN').format(t.amount)} ₫
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-xs text-slate-500">
                        {new Intl.NumberFormat('vi-VN').format(t.balanceAfter)} ₫
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
