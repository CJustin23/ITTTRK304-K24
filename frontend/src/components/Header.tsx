import React from 'react';
import { Search, Bell, Plus, Calendar } from 'lucide-react';

interface HeaderProps {
  onNewTransaction: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewTransaction,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      {/* Search Bar */}
      <div className="relative w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm giao dịch, số tiền, danh mục..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 font-medium px-3 py-1.5 bg-slate-100 rounded-lg">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Tháng 10, 2026</span>
        </div>

        {/* Notification Bell */}
        <button
          title="Thông báo ngân sách"
          className="relative p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* New Transaction Button */}
        <button
          onClick={onNewTransaction}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm giao dịch</span>
        </button>
      </div>
    </header>
  );
};
