import React from 'react';
import { Users, UserPlus, Shield, Crown, Sparkles, ArrowRight, Clock, Target, PiggyBank, Plus, CheckCircle, Calendar } from 'lucide-react';
import { useStore, isDemoGoal } from '../store/useStore';

export const FamilyWorkspaceView: React.FC = () => {
  const {
    currentUser,
    familyMembers,
    setFamilyModalOpen,
    wallets,
    familySavingGoals,
    setFamilyGoalModalOpen,
    receivedInvitations,
    sentInvitations,
    setConfirmInviteModalOpen,
    setSelectedInvitationForConfirm,
    cancelSentInvitation,
  } = useStore();

  const pendingReceived = (receivedInvitations || []).filter((i) => i.status === 'PENDING');
  const pendingSent = (sentInvitations || []).filter((i) => i.status === 'PENDING');

  const ownerMember =
    familyMembers.find((m) => m.isOwner) ||
    familyMembers.find((m) => m.role === 'FAMILY_ADMIN') ||
    (currentUser?.role === 'FAMILY_ADMIN' ? currentUser : null);

  const ownerName = ownerMember?.fullName || 'Nguyễn Trường An';

  const familyTitle =
    currentUser?.familyGroupName ||
    (currentUser?.role === 'FAMILY_ADMIN'
      ? `Sổ quỹ Gia đình của ${currentUser.fullName}`
      : 'Sổ quỹ Gia đình Nhóm 03 (HN-KS24-CNTT3)');

  const isIndividual = currentUser?.role === 'INDIVIDUAL_USER';
  const isOwnerOrAdmin =
    currentUser?.role === 'FAMILY_ADMIN' ||
    (currentUser as any)?.isOwner ||
    currentUser?.email === 'thanhba@gmail.com';

  const isDemoFam =
    currentUser?.familyGroupId === 'FAM-HANHPHUC' ||
    ['thanhba@gmail.com', 'thanhme@gmail.com', 'thanhcon@gmail.com'].includes((currentUser?.email || '').toLowerCase());

  const displayedGoals = isDemoFam
    ? familySavingGoals
    : familySavingGoals.filter((g) => !isDemoGoal(g));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Không gian Tài chính Gia đình (Family Workspace)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Minh bạch hóa thu chi chung, phân quyền thành viên và quản lý hạn mức hộ gia đình
          </p>
        </div>
        {!isIndividual && (
          <button
            onClick={() => setFamilyModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Mời thành viên tham gia</span>
          </button>
        )}
      </div>

      {/* Banner lời mời đang chờ xác nhận (nếu có) */}
      {pendingReceived.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                  Lời mời mới
                </span>
                <span className="text-xs text-emerald-100">Cần bạn xác nhận</span>
              </div>
              <h4 className="text-base font-bold text-white mt-0.5">
                Bạn nhận được lời mời tham gia nhóm "{pendingReceived[0].familyGroupName}"
              </h4>
              <p className="text-xs text-emerald-100">
                Người mời: {pendingReceived[0].invitedByName} ({pendingReceived[0].invitedByEmail || 'Chủ hộ'})
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedInvitationForConfirm(pendingReceived[0]);
              setConfirmInviteModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Xem & Xác nhận tham gia</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {isIndividual ? (
        /* Banner for Individual users to upgrade */
        <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl border border-slate-700/60 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Dành cho Hộ Gia đình & Nhóm chi tiêu</span>
            </div>
            <h3 className="text-2xl font-black text-white">Bạn đang sử dụng tài khoản Cá nhân</h3>
            <p className="text-sm text-slate-400">
              Hãy kích hoạt Sổ quỹ Gia đình trong mục <strong>Cài đặt</strong> để trở thành Chủ hộ, mời các thành viên tham gia qua email và cùng quản lý chi tiêu chung minh bạch.
            </p>
          </div>
          <button
            onClick={() => {
              const settingsTab = document.querySelector('button[title*="Cài đặt"]') as HTMLElement;
              if (settingsTab) settingsTab.click();
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg transition-all flex items-center gap-2 shrink-0"
          >
            <span>Đến Cài đặt & Tạo Sổ quỹ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Family Info Banner Card */
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-700/60">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
                <Crown className="w-3.5 h-3.5 text-yellow-400" />
                <span>Chủ hộ: {ownerName}</span>
              </div>
              <h3 className="text-3xl font-black tracking-tight text-white">
                {familyTitle}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Quy mô: {familyMembers.length} thành viên • Quản lý minh bạch thu chi và mục tiêu chung
              </p>
            </div>

            {/* Quick Invite Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFamilyModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Mời thành viên qua Email</span>
              </button>
            </div>
          </div>

          {/* Ambient Glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        </div>
      )}

      {/* Members Grid */}
      {!isIndividual && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">
              Danh sách thành viên sổ quỹ ({familyMembers.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Chủ hộ có toàn quyền quản lý thành viên và phê duyệt ngân sách
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {familyMembers.map((member) => {
              const isOwner = member.role === 'FAMILY_ADMIN';
              return (
                <div
                  key={member.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center justify-between"
                >
                  <div>
                    <div className="relative mb-4">
                      <img
                        src={member.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'}
                        alt={member.fullName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 mx-auto shadow-md"
                      />
                      {isOwner && (
                        <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-slate-900 shadow">
                          <Crown className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-800">{member.fullName}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">
                      {member.email}
                    </p>

                    <div className="mt-3">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                          isOwner
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>{isOwner ? 'Chủ hộ (Admin)' : 'Thành viên (Member)'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 w-full text-xs text-slate-400">
                    <span>Tham gia: {member.joinedDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shared Family Saving Goals (Mục tiêu tích lũy chung của gia đình) */}
      {!isIndividual && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  <span>Mục tiêu tích lũy chung của gia đình ({displayedGoals.length})</span>
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  Chung
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Các mục tiêu chung để các thành viên cùng đóng góp. Tiền nạp và người đóng góp được minh bạch tự động.
              </p>
            </div>

            {isOwnerOrAdmin ? (
              <button
                onClick={() => setFamilyGoalModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all self-start sm:self-auto cursor-pointer hover:shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo mục tiêu chung</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium self-start sm:self-auto">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Chỉ Chủ hộ mới có quyền tạo mục tiêu chung</span>
              </div>
            )}
          </div>

          {displayedGoals.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <PiggyBank className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Chưa có mục tiêu tích lũy chung nào</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                {isOwnerOrAdmin
                  ? 'Hãy tạo mục tiêu chung như đổi xe, học phí cho con, hoặc du lịch để cả nhà cùng tích lũy!'
                  : 'Chưa có mục tiêu chung nào được tạo bởi Chủ hộ.'}
              </p>
              {isOwnerOrAdmin && (
                <button
                  onClick={() => setFamilyGoalModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  + Tạo mục tiêu chung đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedGoals.map((goal) => {
                const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                const isCompleted = goal.status === 'COMPLETED' || percentage >= 100;
                const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

                return (
                  <div
                    key={goal.id}
                    className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                      isCompleted
                        ? 'border-emerald-300 shadow-md ring-1 ring-emerald-200'
                        : 'border-slate-200/80 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                          <Target className="w-5 h-5" />
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

                      {/* Goal Name & Deadline */}
                      <h4 className="text-base font-bold text-slate-800 tracking-tight mb-1">
                        {goal.goalName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Hạn chót: {goal.deadline || 'Không giới hạn'}</span>
                      </div>

                      {/* Progress Visual */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-600">Tiến độ chung</span>
                          <span className="font-bold text-emerald-600">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Amounts Detail */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 mb-4 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>Đã tích lũy:</span>
                          <span className="font-bold text-emerald-700">
                            {new Intl.NumberFormat('vi-VN').format(goal.currentAmount)} ₫
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Mục tiêu chung:</span>
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

                      {/* Contributors Section (Danh sách thành viên gia đình đã nạp tiền) */}
                      <div className="mb-5 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <Users className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Thành viên đã nạp ({goal.contributors?.length || 0})</span>
                          </div>
                          {goal.contributors && goal.contributors.length > 0 && (
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {goal.contributors.slice(0, 3).map((c, idx) => (
                                <img
                                  key={idx}
                                  src={c.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop'}
                                  alt={c.userName}
                                  title={`${c.userName}: ${new Intl.NumberFormat('vi-VN').format(c.totalAmount)} ₫`}
                                  className="inline-block w-5 h-5 rounded-full ring-2 ring-white object-cover"
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {goal.contributors && goal.contributors.length > 0 ? (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {goal.contributors.map((c, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 transition-colors text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img
                                      src={c.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop'}
                                      alt={c.userName}
                                      className="w-6 h-6 rounded-full object-cover border border-emerald-400 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-800 truncate leading-tight">
                                        {c.userName}
                                      </p>
                                      {c.depositCount && (
                                        <p className="text-[10px] text-slate-400 leading-tight">
                                          {c.depositCount} lần đóng góp
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-bold text-emerald-700">
                                      {new Intl.NumberFormat('vi-VN').format(c.totalAmount)} ₫
                                    </span>
                                    {c.percentage !== undefined && (
                                      <span className="block text-[10px] font-semibold text-slate-500">
                                        {c.percentage}% quỹ
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {c.percentage !== undefined && c.percentage > 0 && (
                                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 rounded-full"
                                      style={{ width: `${Math.min(100, c.percentage)}%` }}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-2.5 px-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                            <p className="text-[11px] text-slate-400">
                              Chưa có thành viên nào nạp tiền vào mục tiêu này
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {!isCompleted ? (
                        <button
                          onClick={() => {
                            (window as any).openDepositModal && (window as any).openDepositModal(goal);
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Nạp tiền vào mục tiêu chung</span>
                        </button>
                      ) : (
                        <div className="w-full py-2 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200 text-center flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mục tiêu chung đã hoàn thành</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Danh sách lời mời đã gửi (Đang chờ phản hồi) */}
      {!isIndividual && pendingSent.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Lời mời đã gửi ({pendingSent.length})</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Thành viên cần mở biểu tượng chuông thông báo và ấn "Xác nhận tham gia" để vào sổ quỹ
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingSent.map((inv) => (
              <div key={inv.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center shrink-0">
                    {(inv.inviteeName || inv.inviteeEmail || 'M')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {inv.inviteeName || inv.inviteeEmail}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{inv.inviteeEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Đang chờ xác nhận</span>
                  </span>
                  <button
                    onClick={() => cancelSentInvitation(inv.id)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    Hủy lời mời
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
