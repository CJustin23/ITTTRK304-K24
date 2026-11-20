import React, { useState } from 'react';
import { Target, Plus, CheckCircle, TrendingUp, PiggyBank, Calendar, Users, User, Shield, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

export const SavingGoalsView: React.FC = () => {
  const {
    savingGoals,
    familySavingGoals,
    setGoalModalOpen,
    setFamilyGoalModalOpen,
    currentUser,
  } = useStore();

  const isInFamily = Boolean(
    currentUser?.familyGroupId ||
      currentUser?.role === 'FAMILY_ADMIN' ||
      currentUser?.role === 'FAMILY_MEMBER'
  );
  const isOwnerOrAdmin =
    currentUser?.role === 'FAMILY_ADMIN' ||
    (currentUser as any)?.isOwner ||
    currentUser?.email === 'thanhba@gmail.com';

  const [activeGoalScope, setActiveGoalScope] = useState<'PERSONAL' | 'FAMILY'>('PERSONAL');

  const activeList = activeGoalScope === 'PERSONAL' ? savingGoals : familySavingGoals;
  const totalTarget = activeList.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrent = activeList.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalCompletedGoals = activeList.filter((g) => g.status === 'COMPLETED' || g.currentAmount >= g.targetAmount).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header & Scope Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {activeGoalScope === 'PERSONAL'
                ? 'Mục tiêu Tiết kiệm Cá nhân (Personal Goals)'
                : 'Mục tiêu Tích lũy Chung Gia đình (Family Goals)'}
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                activeGoalScope === 'PERSONAL'
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {activeGoalScope === 'PERSONAL' ? 'Cá nhân' : 'Gia đình'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {activeGoalScope === 'PERSONAL'
              ? `Kế hoạch tích lũy riêng của tài khoản ${currentUser?.fullName || currentUser?.email || 'bạn'} (Chỉ cá nhân bạn xem và tự nạp tiền)`
              : 'Mục tiêu chung của riêng hộ gia đình bạn — toàn bộ thành viên trong gia đình đều có thể cùng đóng góp'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Phân bên Cá nhân & Gia đình riêng biệt */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveGoalScope('PERSONAL')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeGoalScope === 'PERSONAL'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Mục tiêu Cá nhân ({savingGoals.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGoalScope('FAMILY')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeGoalScope === 'FAMILY'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Mục tiêu Gia đình ({isInFamily ? familySavingGoals.length : 0})</span>
            </button>
          </div>

          {activeGoalScope === 'PERSONAL' ? (
            <button
              onClick={() => setGoalModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo mục tiêu cá nhân</span>
            </button>
          ) : (
            isInFamily &&
            (isOwnerOrAdmin ? (
              <button
                onClick={() => setFamilyGoalModalOpen(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo mục tiêu gia đình</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Thành viên cùng đóng góp vào mục tiêu chung</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Aggregate Overview Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {activeGoalScope === 'PERSONAL' ? 'Tổng tích lũy cá nhân' : 'Tổng tích lũy gia đình'}
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
              Tiến độ tích lũy
            </p>
            <h4 className="text-3xl font-black text-emerald-600">
              {totalTarget > 0 ? ((totalCurrent / totalTarget) * 100).toFixed(1) : 0}%
            </h4>
            <p className="text-xs text-slate-400 mt-1">{activeList.length} mục tiêu đang theo dõi</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Mục tiêu đã hoàn thành
            </p>
            <h4 className="text-3xl font-black text-slate-800">
              {totalCompletedGoals} / {activeList.length}
            </h4>
            <p className="text-xs text-slate-400 mt-1">Đạt 100% kế hoạch tài chính</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content by Scope */}
      {activeGoalScope === 'FAMILY' && !isInFamily ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Bạn chưa tham gia Sổ quỹ Gia đình</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Hãy kích hoạt Sổ quỹ Gia đình trong mục Cài đặt hoặc xác nhận lời mời từ Chủ hộ để cùng các thành viên đóng góp vào Mục tiêu Gia đình.
          </p>
          <button
            onClick={() => {
              (window as any).setActiveTab && (window as any).setActiveTab('settings');
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <span>Đến Cài đặt Gia đình</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : activeList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {activeGoalScope === 'PERSONAL'
              ? 'Chưa có mục tiêu tiết kiệm cá nhân nào'
              : 'Gia đình bạn chưa có mục tiêu tích lũy chung nào'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            {activeGoalScope === 'PERSONAL'
              ? 'Lập kế hoạch mua sắm, quỹ dự phòng hoặc du lịch riêng của bạn để theo dõi tiến độ tiết kiệm.'
              : isOwnerOrAdmin
              ? 'Hãy tạo mục tiêu chung cho gia đình để tất cả thành viên đã tham gia trong gia đình cùng đóng góp!'
              : 'Chưa có mục tiêu chung nào được Chủ hộ thiết lập cho gia đình của bạn.'}
          </p>
          {activeGoalScope === 'PERSONAL' ? (
            <button
              onClick={() => setGoalModalOpen(true)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              + Tạo mục tiêu cá nhân đầu tiên
            </button>
          ) : (
            isOwnerOrAdmin && (
              <button
                onClick={() => setFamilyGoalModalOpen(true)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                + Tạo mục tiêu gia đình đầu tiên
              </button>
            )
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeList.map((goal) => {
            const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const isCompleted = goal.status === 'COMPLETED' || percentage >= 100;
            const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

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
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          activeGoalScope === 'PERSONAL'
                            ? 'bg-slate-50 text-slate-600 border-slate-200'
                            : 'bg-teal-50 text-teal-700 border-teal-200'
                        }`}
                      >
                        {activeGoalScope === 'PERSONAL' ? 'Cá nhân' : 'Gia đình'}
                      </span>
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
                  </div>

                  {/* Title & Target */}
                  <h4 className="text-lg font-bold text-slate-800 tracking-tight mb-1">
                    {goal.goalName}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Hạn chót: {goal.deadline || 'Không giới hạn'}</span>
                  </div>

                  {/* Progress Visual */}
                  <div className="space-y-2 mb-5">
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
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 mb-5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Đã tích lũy:</span>
                      <span className="font-bold text-emerald-700">
                        {new Intl.NumberFormat('vi-VN').format(goal.currentAmount)} ₫
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Mục tiêu:</span>
                      <span className="font-bold text-slate-800">
                        {new Intl.NumberFormat('vi-VN').format(goal.targetAmount)} ₫
                      </span>
                    </div>
                    {!isCompleted && remaining > 0 && (
                      <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-200/60">
                        <span>Còn thiếu:</span>
                        <span className="font-semibold text-rose-600">
                          {new Intl.NumberFormat('vi-VN').format(remaining)} ₫
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Danh sách thành viên đóng góp (Chỉ hiển thị ở bên Mục tiêu Gia đình) */}
                  {activeGoalScope === 'FAMILY' && (
                    <div className="mb-5 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Thành viên gia đình đã đóng góp ({goal.contributors?.length || 0})</span>
                        </div>
                      </div>

                      {goal.contributors && goal.contributors.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {goal.contributors.map((c, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-xs flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={
                                    c.avatarUrl ||
                                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop'
                                  }
                                  alt={c.userName}
                                  className="w-6 h-6 rounded-full object-cover border border-emerald-400 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 truncate leading-tight">
                                    {c.userName}
                                  </p>
                                  {c.depositCount && (
                                    <p className="text-[10px] text-slate-400 leading-tight">
                                      {c.depositCount} lần nạp
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-bold text-emerald-700">
                                  +{new Intl.NumberFormat('vi-VN').format(c.totalAmount)} ₫
                                </span>
                                {c.percentage !== undefined && (
                                  <span className="block text-[10px] font-semibold text-slate-500">
                                    {c.percentage}% quỹ
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-2.5 px-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                          <p className="text-[11px] text-slate-400">
                            Chưa có thành viên nào nạp tiền vào mục tiêu chung này
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div>
                  {!isCompleted ? (
                    <button
                      onClick={() => {
                        (window as any).openDepositModal && (window as any).openDepositModal(goal);
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        {activeGoalScope === 'PERSONAL'
                          ? '+ Nạp tiền tiết kiệm cá nhân'
                          : '+ Đóng góp vào mục tiêu gia đình'}
                      </span>
                    </button>
                  ) : (
                    <div className="w-full py-2.5 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>Chúc mừng! Mục tiêu đã hoàn thành</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
