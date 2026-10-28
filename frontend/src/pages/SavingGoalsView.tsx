import React, { useState } from 'react';
import { Target, Plus, CheckCircle, Clock, Sparkles, TrendingUp, PiggyBank, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SavingGoal } from '../types';

export const SavingGoalsView: React.FC = () => {
  const { savingGoals, setGoalModalOpen } = useStore();
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<SavingGoal | null>(null);

  const totalTarget = savingGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrent = savingGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalCompletedGoals = savingGoals.filter((g) => g.status === 'COMPLETED').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Mục tiêu Tiết kiệm & Tích lũy (Goals)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Lập kế hoạch tài chính dài hạn, theo dõi tiến độ tích lũy và hoàn thành ước mơ
          </p>
        </div>
        <button
          onClick={() => setGoalModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tạo mục tiêu tiết kiệm</span>
        </button>
      </div>

      {/* Aggregate Overview Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tổng tích lũy hiện tại
            </span>
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <PiggyBank className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <h3 className="text-3xl font-black tracking-tight text-white">
            {new Intl.NumberFormat('vi-VN').format(totalCurrent)} ₫
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            Mục tiêu tổng: {new Intl.NumberFormat('vi-VN').format(totalTarget)} ₫
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Tiến độ tích lũy chung
            </p>
            <h4 className="text-3xl font-black text-emerald-600">
              {totalTarget > 0 ? ((totalCurrent / totalTarget) * 100).toFixed(1) : 0}%
            </h4>
            <p className="text-xs text-slate-500 mt-1">Đang hoàn thành đúng lộ trình</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Mục tiêu đã cán đích
            </p>
            <h4 className="text-3xl font-black text-slate-800">
              {totalCompletedGoals} / {savingGoals.length}
            </h4>
            <p className="text-xs text-slate-500 mt-1">Kế hoạch đã đạt 100%</p>
          </div>
          <div className="p-4 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savingGoals.map((goal) => {
          const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const isCompleted = goal.status === 'COMPLETED' || percentage >= 100;

          return (
            <div
              key={goal.id}
              className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                isCompleted
                  ? 'border-emerald-300 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-200'
                  : 'border-slate-200/80 shadow-sm hover:shadow-md'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Target className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {isCompleted ? 'Đã hoàn thành' : 'Đang tích lũy'}
                  </span>
                </div>

                {/* Title & Target */}
                <h4 className="text-lg font-bold text-slate-800 tracking-tight mb-1">
                  {goal.goalName}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Hạn chót: {goal.deadline || 'Không giới hạn'}</span>
                </div>

                {/* Progress Visual */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">Tiến độ</span>
                    <span className="font-bold text-emerald-600">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Amounts Detail */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 mb-6 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Đã có:</span>
                    <span className="font-bold text-slate-800">
                      {new Intl.NumberFormat('vi-VN').format(goal.currentAmount)} ₫
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Mục tiêu:</span>
                    <span className="font-bold text-slate-800">
                      {new Intl.NumberFormat('vi-VN').format(goal.targetAmount)} ₫
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {!isCompleted ? (
                  <button
                    onClick={() => {
                      (window as any).openDepositModal && (window as any).openDepositModal(goal);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Nạp thêm tiền tiết kiệm</span>
                  </button>
                ) : (
                  <div className="w-full py-2.5 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>Chúc mừng! Bạn đã đạt mục tiêu</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
