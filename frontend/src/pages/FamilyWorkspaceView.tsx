import React, { useState } from 'react';
import { Users, UserPlus, Shield, Copy, Check, Crown, Sparkles, ArrowRight, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';

export const FamilyWorkspaceView: React.FC = () => {
  const {
    currentUser,
    familyMembers,
    setFamilyModalOpen,
    wallets,
    receivedInvitations,
    sentInvitations,
    setConfirmInviteModalOpen,
    setSelectedInvitationForConfirm,
    cancelSentInvitation,
  } = useStore();
  const [copied, setCopied] = useState(false);

  const pendingReceived = (receivedInvitations || []).filter((i) => i.status === 'PENDING');
  const pendingSent = (sentInvitations || []).filter((i) => i.status === 'PENDING');

  const inviteCode = currentUser?.familyGroupId || 'BUDGLEE-FAM-KS24';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              Hãy kích hoạt Sổ quỹ Gia đình trong mục <strong>Cài đặt</strong> để trở thành Chủ hộ, tạo mã mời và cùng các thành viên quản lý chi tiêu chung minh bạch.
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
                Quy mô: {familyMembers.length} thành viên • Mã không gian: <span className="font-mono text-emerald-400">{inviteCode}</span>
              </p>
            </div>

            {/* Quick Invite Box */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2">
              <p className="text-xs text-slate-300 font-medium">Mã mời thành viên gia đình:</p>
              <div className="flex items-center gap-2">
                <code className="px-3 py-1.5 rounded-xl bg-slate-950/80 text-emerald-400 font-mono text-sm font-bold border border-slate-700">
                  {inviteCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Đã sao chép' : 'Copy'}</span>
                </button>
              </div>
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
