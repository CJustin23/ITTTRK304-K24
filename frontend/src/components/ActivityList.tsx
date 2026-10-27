import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Filter } from 'lucide-react';
import { Transaction } from '../types';

interface ActivityListProps {
  transactions: Transaction[];
  searchQuery: string;
}

export const ActivityList: React.FC<ActivityListProps> = ({ transactions, searchQuery }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.actionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.categoryName && tx.categoryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.amount.toString().includes(searchQuery);

    const matchesType =
      filterType === 'ALL' ||
      (filterType === 'INCOME' && tx.transactionType === 'INCOME') ||
      (filterType === 'EXPENSE' && tx.transactionType === 'EXPENSE');

    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Hoạt động gần đây (Activities)</h3>
          <p className="text-xs text-slate-500 mt-0.5">Nhật ký các khoản giao dịch thu chi phát sinh</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'ALL' ? 'bg-white text-emerald-600 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('INCOME')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Thu nhập
            </button>
            <button
              onClick={() => setFilterType('EXPENSE')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'EXPENSE' ? 'bg-white text-emerald-600 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Chi tiêu
            </button>
          </div>
          <button className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            Không tìm thấy giao dịch nào phù hợp.
          </div>
        ) : (
          filtered.map((tx) => {
            const isIncome = tx.transactionType === 'INCOME';
            return (
              <div
                key={tx.id}
                className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {isIncome ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-800">{tx.actionTitle}</h5>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{tx.categoryName || 'Không phân loại'}</span>
                      <span>•</span>
                      <span>{tx.walletName || 'Techcombank'}</span>
                      <span>•</span>
                      <span>{tx.transactionDate}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      isIncome ? 'text-emerald-600' : 'text-slate-800'
                    }`}
                  >
                    {isIncome ? '+' : '-'} {new Intl.NumberFormat('vi-VN').format(tx.amount)} ₫
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dư: {new Intl.NumberFormat('vi-VN').format(tx.balanceAfter)} ₫
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
