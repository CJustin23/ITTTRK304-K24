import React, { useState } from 'react';
import { Users, UserPlus, Shield, Copy, Check, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

export const FamilyWorkspaceView: React.FC = () => {
  const { currentUser, familyMembers, setFamilyModalOpen, wallets } = useStore();
  const [copied, setCopied] = useState(false);

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
    </div>
  );
};
