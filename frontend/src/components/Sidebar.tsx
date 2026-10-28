import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PieChart,
  Target,
  Sparkles,
  Settings,
  Users,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBot: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenBot }) => {
  const menuItems = [
    { id: 'overview', label: 'Tổng quan (Overview)', icon: LayoutDashboard },
    { id: 'wallets', label: 'Ví & Thẻ (Wallets)', icon: Wallet },
    { id: 'transactions', label: 'Giao dịch (Activities)', icon: ArrowLeftRight },
    { id: 'budgets', label: 'Ngân sách (Budgets)', icon: PieChart },
    { id: 'goals', label: 'Mục tiêu (Goals)', icon: Target },
    { id: 'insights', label: 'Phân tích AI (Insights)', icon: Sparkles },
    { id: 'family', label: 'Quỹ gia đình (Family)', icon: Users },
  ];

  return (
    <aside className="w-64 bg-[#1E293B] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-700">
      {/* Brand Logo */}
      <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-700/60">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
          B
        </div>
        <div>
          <h1 className="text-white font-bold text-lg tracking-tight">Budglee</h1>
          <p className="text-xs text-emerald-400 font-medium">Finance Platform</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
          Menu chính
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* AI Bot Recommendation Highlight */}
        <div className="pt-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
            Trợ lý AI
          </div>
          <button
            onClick={onOpenBot}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 transition-all shadow-sm group"
          >
            <Sparkles className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Kích hoạt AI Bot</span>
          </button>
        </div>
      </nav>

      {/* Footer / User Mini Profile */}
      <div className="p-4 border-t border-slate-700/60 bg-slate-800/40">
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
            alt="User avatar"
            className="w-10 h-10 rounded-full border-2 border-emerald-500/50 object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Nguyễn Tiến Thành</p>
            <p className="text-xs text-slate-400 truncate">Family Admin</p>
          </div>
          <button
            onClick={() => setActiveTab('auth')}
            title="Đăng xuất / Màn hình Đăng nhập & Đăng ký"
            className="text-slate-400 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-700/50 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
