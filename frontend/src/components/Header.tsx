import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Plus, Calendar, AlertTriangle, AlertCircle, CheckCircle, Info, Check } from 'lucide-react';
import { useStore } from '../store/useStore';

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
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'ALERT':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
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

        {/* Logout Button */}
        <button
          onClick={() => {
            if ((window as any).handleLogout) {
              (window as any).handleLogout();
            }
          }}
          title="Đăng xuất khỏi hệ thống"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors"
        >
          <span>Đăng xuất</span>
        </button>

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="Thông báo ngân sách & Hệ thống"
            className={`relative p-2.5 rounded-xl border transition-colors ${
              showNotifications
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-800">Thông báo & Cảnh báo</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsAsRead()}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Đọc tất cả</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Không có thông báo mới
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-4 transition-colors cursor-pointer flex gap-3 ${
                        n.read ? 'bg-white hover:bg-slate-50' : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">{getNotifIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold truncate ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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

