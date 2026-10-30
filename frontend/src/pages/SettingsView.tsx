import React, { useState } from 'react';
import {
  User,
  Users,
  Shield,
  KeyRound,
  Bell,
  Mail,
  Check,
  Copy,
  UserPlus,
  Trash2,
  Crown,
  Sparkles,
  LogOut,
  Save,
  AlertCircle,
  Building2,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Role } from '../types';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    familyMembers,
    updateProfile,
    addFamilyMember,
    removeFamilyMember,
    updateMemberRole,
    upgradeToFamilyAdmin,
    logout,
    setFamilyModalOpen,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'family' | 'security' | 'preferences'>('profile');

  // Profile Form state
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Upgrade to family form state (for INDIVIDUAL_USER)
  const [upgradeFamilyName, setUpgradeFamilyName] = useState('');
  const [inviteMemberName, setInviteMemberName] = useState('');
  const [inviteMemberEmail, setInviteMemberEmail] = useState('');
  const [inviteMemberRole, setInviteMemberRole] = useState<Role>('FAMILY_MEMBER');
  const [familySuccessMsg, setFamilySuccessMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const inviteCode = currentUser?.familyGroupId || 'BUDGLEE-FAM-2026';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      return;
    }
    updateProfile({ fullName: fullName.trim() });
    setProfileSuccessMsg('Hồ sơ cá nhân đã được lưu thành công!');
    setTimeout(() => setProfileSuccessMsg(''), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 6 ký tự' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Mật khẩu xác nhận không trùng khớp' });
      return;
    }

    setPasswordMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg({ type: '', text: '' }), 3000);
  };

  const handleUpgradeToFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeFamilyName.trim()) return;

    upgradeToFamilyAdmin(upgradeFamilyName.trim());
    setFamilySuccessMsg('Đã kích hoạt Sổ quỹ Gia đình thành công! Bạn hiện là Chủ hộ.');
    setUpgradeFamilyName('');
    setTimeout(() => setFamilySuccessMsg(''), 4000);
  };

  const handleAddDirectMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteMemberName.trim() || !inviteMemberEmail.trim()) return;

    addFamilyMember({
      fullName: inviteMemberName.trim(),
      email: inviteMemberEmail.trim(),
      role: inviteMemberRole,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    });

    setInviteMemberName('');
    setInviteMemberEmail('');
    setFamilySuccessMsg('Đã gửi lời mời và thêm thành viên vào sổ quỹ gia đình!');
    setTimeout(() => setFamilySuccessMsg(''), 3000);
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-emerald-600" />
            <span>Cài đặt & Quản lý Tài khoản (Settings)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý hồ sơ cá nhân, phân quyền sổ quỹ gia đình, thành viên và bảo mật hệ thống
          </p>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-semibold text-sm transition-colors shadow-sm self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất tài khoản</span>
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3.5 flex items-center gap-2 transition-colors relative ${
            activeTab === 'profile'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Hồ sơ cá nhân</span>
        </button>

        <button
          onClick={() => setActiveTab('family')}
          className={`pb-3.5 flex items-center gap-2 transition-colors relative ${
            activeTab === 'family'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Sổ quỹ & Thành viên</span>
          {currentUser?.role === 'FAMILY_ADMIN' && (
            <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-full font-bold">
              Chủ hộ
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3.5 flex items-center gap-2 transition-colors relative ${
            activeTab === 'security'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Đổi mật khẩu & Bảo mật</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`pb-3.5 flex items-center gap-2 transition-colors relative ${
            activeTab === 'preferences'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Tùy chọn & Cảnh báo</span>
        </button>
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
            <div className="relative mb-4">
              <img
                src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500/30 shadow-md"
              />
              <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-600 text-white shadow">
                <Crown className="w-4 h-4" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800">{currentUser?.fullName}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser?.email}</p>

            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Shield className="w-3.5 h-3.5" />
              <span>
                {currentUser?.role === 'FAMILY_ADMIN'
                  ? 'Chủ hộ (Quản trị Sổ quỹ Gia đình)'
                  : currentUser?.role === 'FAMILY_MEMBER'
                  ? 'Thành viên Sổ quỹ Gia đình'
                  : 'Người dùng Quản lý Cá nhân'}
              </span>
            </div>

            {currentUser?.familyGroupName && (
              <p className="text-xs text-slate-500 mt-3 font-medium">
                Sổ quỹ: <span className="font-bold text-slate-700">{currentUser.familyGroupName}</span>
              </p>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Cập nhật thông tin tài khoản</h3>
              <p className="text-xs text-slate-400 mt-1">
                Thay đổi tên hiển thị và các cài đặt định danh trên nền tảng Budglee
              </p>
            </div>

            {profileSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Họ và tên hiển thị <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Địa chỉ Email (Đăng nhập)
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-medium cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">Email được dùng làm tên đăng nhập cố định của bạn.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Vai trò hệ thống
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.role || ''}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: FAMILY & MEMBERS */}
      {activeTab === 'family' && (
        <div className="space-y-8">
          {familySuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold flex items-center gap-2">
              <Check className="w-5 h-5 shrink-0" />
              <span>{familySuccessMsg}</span>
            </div>
          )}

          {currentUser?.role === 'INDIVIDUAL_USER' ? (
            /* Individual user: Show upgrade to family banner */
            <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white border border-slate-700/60 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Kích hoạt Sổ quỹ Gia đình (Family Workspace)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bạn hiện đang sử dụng tài khoản Cá nhân. Hãy nâng cấp miễn phí để quản lý chi tiêu chung cùng các thành viên trong gia đình!
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpgradeToFamily} className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Đặt tên Sổ quỹ Gia đình của bạn <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Gia đình Nguyễn, Sổ quỹ An Gia, Tổ ấm nhỏ..."
                    value={upgradeFamilyName}
                    onChange={(e) => setUpgradeFamilyName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
                >
                  Tạo Sổ quỹ Gia đình & Trở thành Chủ hộ
                </button>
              </form>
            </div>
          ) : (
            /* Family user / admin */
            <div className="space-y-6">
              {/* Family Header Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-2">
                    <Crown className="w-3.5 h-3.5 text-yellow-500" />
                    <span>{currentUser?.role === 'FAMILY_ADMIN' ? 'Bạn là Chủ hộ (Admin)' : 'Thành viên sổ quỹ'}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {currentUser?.familyGroupName || 'Sổ quỹ Gia đình'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Mã sổ quỹ: <span className="font-mono font-bold text-slate-700">{inviteCode}</span> • {familyMembers.length} thành viên tham gia
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyInviteCode}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Đã sao chép mã' : 'Sao chép mã mời'}</span>
                  </button>

                  <button
                    onClick={() => setFamilyModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Mời thành viên</span>
                  </button>
                </div>
              </div>

              {/* Members List Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-800">Danh sách thành viên sổ quỹ</h4>
                  <span className="text-xs font-semibold text-slate-400">{familyMembers.length} người</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="p-4 sm:p-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={member.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'}
                          alt={member.fullName}
                          className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">{member.fullName}</span>
                            {member.isOwner && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                                Chủ hộ
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{member.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          disabled={member.isOwner}
                          value={member.role}
                          onChange={(e) => updateMemberRole(member.id, e.target.value as Role)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="FAMILY_MEMBER">Thành viên</option>
                          <option value="FAMILY_ADMIN">Đồng quản trị</option>
                        </select>

                        {!member.isOwner && (
                          <button
                            onClick={() => removeFamilyMember(member.id)}
                            title="Xóa thành viên khỏi sổ quỹ"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Add Member Section */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <h4 className="text-base font-bold text-slate-800">Thêm nhanh thành viên mới</h4>
                <form onSubmit={handleAddDirectMember} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Họ và tên thành viên"
                    value={inviteMemberName}
                    onChange={(e) => setInviteMemberName(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Địa chỉ Email"
                    value={inviteMemberEmail}
                    onChange={(e) => setInviteMemberEmail(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={inviteMemberRole}
                    onChange={(e) => setInviteMemberRole(e.target.value as Role)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="FAMILY_MEMBER">Thành viên (Thu chi)</option>
                    <option value="FAMILY_ADMIN">Đồng quản trị (Chủ hộ)</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                  >
                    + Thêm vào sổ quỹ
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === 'security' && (
        <div className="max-w-xl bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Đổi mật khẩu tài khoản</h3>
            <p className="text-xs text-slate-400 mt-1">
              Đảm bảo tài khoản sử dụng mật khẩu mạnh tối thiểu 6 ký tự
            </p>
          </div>

          {passwordMsg.text && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                passwordMsg.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}
            >
              {passwordMsg.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <Check className="w-4 h-4 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Mật khẩu mới (tối thiểu 6 ký tự)
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Xác nhận lại mật khẩu mới
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all"
              >
                Cập nhật mật khẩu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="max-w-2xl bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Tùy chọn hiển thị & Cảnh báo</h3>
            <p className="text-xs text-slate-400 mt-1">Cấu hình cách hệ thống Budglee hoạt động với bạn</p>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Cảnh báo hạn mức ngân sách tự động</p>
                <p className="text-xs text-slate-400">Gửi thông báo khi chi tiêu chạm ngưỡng 80% hoặc vượt 100%</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-emerald-600 rounded" />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Trợ lý tài chính AI thông minh</p>
                <p className="text-xs text-slate-400">Phân tích hành vi chi tiêu và đưa ra khuyến nghị cải thiện</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-emerald-600 rounded" />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Đơn vị tiền tệ chính</p>
                <p className="text-xs text-slate-400">Định dạng hiển thị số dư và các khoản thu chi</p>
              </div>
              <select className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                <option value="VND">VND (Việt Nam Đồng - ₫)</option>
                <option value="USD">USD (Đô la Mỹ - $)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

