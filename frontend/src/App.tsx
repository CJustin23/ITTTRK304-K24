import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { ChartSection } from './components/ChartSection';
import { CardsSection } from './components/CardsSection';
import { CategoryList } from './components/CategoryList';
import { ActivityList } from './components/ActivityList';

import { WalletsView } from './pages/WalletsView';
import { TransactionsView } from './pages/TransactionsView';
import { BudgetsView } from './pages/BudgetsView';
import { SavingGoalsView } from './pages/SavingGoalsView';
import { FamilyWorkspaceView } from './pages/FamilyWorkspaceView';
import { InsightsView } from './pages/InsightsView';
import { SettingsView } from './pages/SettingsView';
import { AuthPage } from './pages/AuthPage';

import { BotInsightModal } from './components/BotInsightModal';
import { NewTransactionModal } from './components/NewTransactionModal';
import { NewWalletModal } from './components/NewWalletModal';
import { NewBudgetModal } from './components/NewBudgetModal';
import { NewGoalModal } from './components/NewGoalModal';
import { DepositGoalModal } from './components/DepositGoalModal';
import { InviteFamilyModal } from './components/InviteFamilyModal';

import { useStore } from './store/useStore';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowLeft } from 'lucide-react';

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
    setWalletModalOpen,
    addTransaction,
    logout,
  } = useStore();

  useEffect(() => {
    (window as any).toggleAuthPage = () => {
      setActiveTab((prev) => (prev === 'auth' ? 'overview' : 'auth'));
    };
    (window as any).handleLogout = () => {
      logout();
      setActiveTab('overview');
    };
  }, [logout]);

  const handleCreateTransaction = (data: {
    walletId: number;
    actionTitle: string;
    amount: number;
    transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    categoryName: string;
    note?: string;
  }) => {
    const selectedWallet = wallets.find((w) => w.id === data.walletId);
    const currentBalance = selectedWallet ? selectedWallet.balance : 0;
    const newBalance =
      data.transactionType === 'INCOME'
        ? currentBalance + data.amount
        : currentBalance - data.amount;

    addTransaction({
      walletId: data.walletId,
      walletName: selectedWallet?.walletName || 'Techcombank Primary',
      categoryName: data.categoryName,
      actionTitle: data.actionTitle,
      amount: data.amount,
      transactionType: data.transactionType,
      balanceAfter: newBalance,
      transactionDate: 'Hôm nay ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      note: data.note,
    });
  };

  // If user is not logged in or active tab is 'auth', show Auth Page
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

  // Render content according to active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'wallets':
        return <WalletsView />;
      case 'transactions':
        return <TransactionsView />;
      case 'budgets':
        return <BudgetsView />;
      case 'goals':
        return <SavingGoalsView />;
      case 'insights':
        return <InsightsView />;
      case 'family':
        return <FamilyWorkspaceView />;
      case 'settings':
        return <SettingsView />;
      case 'overview':
      default:
        return (
          <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  Xin chào, {currentUser?.fullName || 'Người dùng'} 👋
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
                amount={dashboardSummary?.totalBalance ?? 0}
                icon={Wallet}
                variant="emerald"
                trend="+4.2% so với tháng trước"
              />
              <StatCard
                title="Tổng thu tháng (Monthly income)"
                amount={dashboardSummary?.monthlyIncome ?? 0}
                icon={TrendingUp}
                variant="blue"
                subtext="Nguồn: Lương & Thu nhập"
              />
              <StatCard
                title="Tổng chi tháng (Monthly spending)"
                amount={dashboardSummary?.monthlySpending ?? 0}
                icon={TrendingDown}
                variant="rose"
                subtext={`Đạt ${(dashboardSummary?.spendingPercentageOfBudget ?? 0).toFixed(1)}% hạn mức`}
              />
              <StatCard
                title="Còn được phép tiêu (Left to spend)"
                amount={dashboardSummary?.leftToSpend ?? 0}
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
                  leftToSpend={dashboardSummary?.leftToSpend ?? 0}
                  spendingPercentage={dashboardSummary?.spendingPercentageOfBudget ?? 0}
                  onNewBudget={() => setActiveTab('budgets')}
                  onNewWallet={() => setWalletModalOpen(true)}
                />
                <CategoryList
                  categories={dashboardSummary?.categoryExpenses || {}}
                  onEdit={() => setActiveTab('budgets')}
                />
              </div>
            </div>
          </div>
        );
    }
  };

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

        <main className="p-8 space-y-8 flex-1">{renderContent()}</main>
      </div>

      {/* All Application Modals */}
      <BotInsightModal
        isOpen={isBotModalOpen}
        onClose={() => setBotModalOpen(false)}
        recommendation={botRecommendation}
      />

      <NewTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        wallets={wallets}
        onSubmit={handleCreateTransaction}
      />

      <NewWalletModal />
      <NewBudgetModal />
      <NewGoalModal />
      <DepositGoalModal />
      <InviteFamilyModal />
    </div>
  );
};
