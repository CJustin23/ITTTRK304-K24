import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { ChartSection } from './components/ChartSection';
import { CardsSection } from './components/CardsSection';
import { CategoryList } from './components/CategoryList';
import { ActivityList } from './components/ActivityList';
import { BotInsightModal } from './components/BotInsightModal';
import { NewTransactionModal } from './components/NewTransactionModal';
import { AuthPage } from './pages/AuthPage';
import { useStore } from './store/useStore';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowLeft } from 'lucide-react';
import { Transaction } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    currentUser,
    wallets,
    recentTransactions,
    dashboardSummary,
    botRecommendation,
    isBotModalOpen,
    isTransactionModalOpen,
    setBotModalOpen,
    setTransactionModalOpen,
    setTransactions,
    setWallets,
  } = useStore();

  useEffect(() => {
    (window as any).toggleAuthPage = () => {
      setActiveTab((prev) => (prev === 'auth' ? 'overview' : 'auth'));
    };
  }, []);

  const handleCreateTransaction = (data: {
    walletId: number;
    actionTitle: string;
    amount: number;
    transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    categoryName: string;
    note?: string;
  }) => {
    const wallet = wallets.find((w) => w.id === data.walletId);
    const currentBalance = wallet ? wallet.balance : 0;
    const newBalance =
      data.transactionType === 'INCOME'
        ? currentBalance + data.amount
        : currentBalance - data.amount;

    const newTx: Transaction = {
      id: Date.now(),
      walletId: data.walletId,
      walletName: wallet?.walletName || 'Techcombank Primary',
      categoryName: data.categoryName,
      actionTitle: data.actionTitle,
      amount: data.amount,
      transactionType: data.transactionType,
      balanceAfter: newBalance,
      transactionDate: 'Hôm nay ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      note: data.note,
    };

    setTransactions([newTx, ...recentTransactions]);

    const updatedWallets = wallets.map((w) =>
      w.id === data.walletId ? { ...w, balance: newBalance } : w
    );
    setWallets(updatedWallets);
  };

  // Nếu người dùng chọn tab auth hoặc chưa đăng nhập thì hiển thị AuthPage
  if (activeTab === 'auth' || !currentUser) {
    return (
      <div className="relative">
        {currentUser && (
          <button
            onClick={() => setActiveTab('overview')}
            className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 backdrop-blur-md shadow-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Dashboard</span>
          </button>
        )}
        <AuthPage onSuccess={() => setActiveTab('overview')} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* 1. Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBot={() => setBotModalOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          onNewTransaction={() => setTransactionModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="p-8 space-y-8 flex-1">
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Xin chào, {currentUser?.fullName || 'Nguyễn Tiến Thành'} 👋
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Đây là bức tranh tài chính tổng quan của cá nhân và quỹ gia đình tháng 10/2026.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Dữ liệu thời gian thực
              </span>
            </div>
          </div>

          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Tổng số dư (Total balance)"
              amount={dashboardSummary?.totalBalance || 67150000}
              icon={Wallet}
              variant="emerald"
              trend="+4.2% so với tháng trước"
            />
            <StatCard
              title="Tổng thu tháng (Monthly income)"
              amount={dashboardSummary?.monthlyIncome || 35000000}
              icon={TrendingUp}
              variant="blue"
              subtext="Nguồn: Lương & Đầu tư"
            />
            <StatCard
              title="Tổng chi tháng (Monthly spending)"
              amount={dashboardSummary?.monthlySpending || 14250000}
              icon={TrendingDown}
              variant="rose"
              subtext="Đạt 68.5% hạn mức"
            />
            <StatCard
              title="Còn được phép tiêu (Left to spend)"
              amount={dashboardSummary?.leftToSpend || 20750000}
              icon={PiggyBank}
              variant="amber"
              trend="An toàn"
            />
          </div>

          {/* Main Dashboard Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Chart & Activity Feed */}
            <div className="lg:col-span-2 space-y-8">
              <ChartSection data={dashboardSummary?.spentTrends || []} />
              <ActivityList transactions={recentTransactions} searchQuery={searchQuery} />
            </div>

            {/* Right 1 Column: Cards, Budget Warning & Categories */}
            <div className="space-y-8">
              <CardsSection
                wallets={wallets}
                leftToSpend={dashboardSummary?.leftToSpend || 20750000}
                spendingPercentage={dashboardSummary?.spendingPercentageOfBudget || 68.5}
                onNewBudget={() => setTransactionModalOpen(true)}
              />
              <CategoryList categories={dashboardSummary?.categoryExpenses || {}} />
            </div>
          </div>
        </main>
      </div>

      {/* AI Bot Recommendation Modal */}
      <BotInsightModal
        isOpen={isBotModalOpen}
        onClose={() => setBotModalOpen(false)}
        recommendation={botRecommendation}
      />

      {/* Quick Add Transaction Modal */}
      <NewTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        wallets={wallets}
        onSubmit={handleCreateTransaction}
      />
    </div>
  );
};
