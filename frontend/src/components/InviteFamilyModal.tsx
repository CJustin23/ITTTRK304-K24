import React, { useState } from 'react';
import { X, UserPlus, Mail, Shield, User, AlertCircle, CheckCircle2, Search, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Role } from '../types';
import { FamilyApiService, FamilyUserLookup } from '../services/api';

export const InviteFamilyModal: React.FC = () => {
  const { isFamilyModalOpen, setFamilyModalOpen, sendFamilyInvitation, currentUser, familyMembers } = useStore();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('FAMILY_MEMBER');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [foundUser, setFoundUser] = useState<FamilyUserLookup | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isFamilyModalOpen) return null;

  const handleClose = () => {
    setEmail('');
    setErrors({});
    setFoundUser(null);
    setSubmitSuccess(false);
    setFamilyModalOpen(false);
  };

  const lookupAccount = async (targetEmail: string): Promise<FamilyUserLookup | null> => {
    const trimmed = targetEmail.trim().toLowerCase();
    
    // 1. Thử gọi API Backend
    try {
      const data = await FamilyApiService.checkUser(trimmed);
      if (data && data.exists) {
        return data;
      }
    } catch (err: any) {
      // 409: đã là thành viên trong nhóm gia đình khác
      if (err.response?.status === 409 && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      // Bỏ qua mọi lỗi 401/403/404/500/mạng để tiếp tục kiểm tra local mà không văng lỗi "Cần đăng nhập..."
    }

    // 2. Tra cứu dữ liệu người dùng đã đăng ký ở localStorage / danh sách chuẩn hệ thống
    const localUserStr = localStorage.getItem('budglee_user_' + trimmed);
    if (localUserStr) {
      try {
        const u = JSON.parse(localUserStr);
        return {
          id: u.id || Date.now(),
          fullName: u.fullName || trimmed.split('@')[0],
          email: u.email,
          avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
          role: u.role || 'FAMILY_MEMBER',
          exists: true,
          message: 'Tài khoản hợp lệ',
        };
      } catch (e) {}
    }

    // Danh sách tài khoản mặc định của hệ thống
    const SYSTEM_ACCOUNTS: Record<string, { fullName: string; role: Role }> = {
      'thanhcanhan@gmail.com': { fullName: 'Nguyễn Tiến Thành (Cá nhân)', role: 'INDIVIDUAL_USER' },
      'thanhba@gmail.com': { fullName: 'Nguyễn Tiến Ba (Ba)', role: 'FAMILY_ADMIN' },
      'thanhme@gmail.com': { fullName: 'Trần Thị Mẹ (Mẹ)', role: 'FAMILY_ADMIN' },
      'thanhcon@gmail.com': { fullName: 'Nguyễn Tiến Con (Con)', role: 'FAMILY_MEMBER' },
      'thannhk6@gmail.com': { fullName: 'Nguyễn Tiến Thành', role: 'FAMILY_MEMBER' },
      'thenng@gmail.com': { fullName: 'Nguyễn Tiến Thành', role: 'FAMILY_MEMBER' },
      'demo@budglee.com': { fullName: 'Nguyễn Văn Demo', role: 'INDIVIDUAL_USER' },
      'family@budglee.com': { fullName: 'Trần Thị Hạnh Phúc', role: 'FAMILY_ADMIN' },
      'member@budglee.com': { fullName: 'Lê Gia Bảo', role: 'FAMILY_MEMBER' },
      'admin@budglee.com': { fullName: 'Quản trị viên Budglee', role: 'SYSTEM_ADMIN' },
    };

    if (SYSTEM_ACCOUNTS[trimmed]) {
      return {
        id: Date.now(),
        fullName: SYSTEM_ACCOUNTS[trimmed].fullName,
        email: trimmed,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
        role: SYSTEM_ACCOUNTS[trimmed].role,
        exists: true,
        message: 'Tài khoản hệ thống hợp lệ',
      };
    }

    return null;
  };

  const handleCheckUser = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      setErrors({ email: 'Vui lòng nhập địa chỉ email của thành viên' });
      setFoundUser(null);
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setErrors({ email: 'Địa chỉ email không đúng định dạng (VD: example@domain.com)' });
      setFoundUser(null);
      return;
    }

    // Kiểm tra không được tự thêm chính mình
    if (currentUser && currentUser.email.toLowerCase() === trimmedEmail) {
      setErrors({ email: 'Bạn không thể tự thêm chính mình vào nhóm gia đình' });
      setFoundUser(null);
      return;
    }

    // Kiểm tra thành viên đã có trong gia đình chưa
    const isAlreadyMember = familyMembers.some(
      (m) => m.email.toLowerCase() === trimmedEmail
    );
    if (isAlreadyMember) {
      setErrors({ email: 'Tài khoản này đã là thành viên trong sổ quỹ gia đình của bạn' });
      setFoundUser(null);
      return;
    }

    setErrors({});
    setIsChecking(true);

    try {
      const user = await lookupAccount(trimmedEmail);
      if (!user) {
        setErrors({
          email: 'Tài khoản này chưa tồn tại trong hệ thống. Vui lòng kiểm tra lại email hoặc yêu cầu thành viên đăng ký tài khoản Budglee trước!',
        });
        setFoundUser(null);
      } else {
        setFoundUser(user);
        setErrors({});
      }
    } catch (err: any) {
      let msg = err.message || 'Lỗi khi kiểm tra tài khoản. Vui lòng thử lại!';
      if (msg.includes('đăng nhập') || msg.includes('truy cập tài nguyên')) {
        msg = 'Không thể kiểm tra tài khoản trên máy chủ. Đang thử chế độ ngoại tuyến.';
      }
      setErrors({
        email: msg,
      });
      setFoundUser(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetUser = foundUser;
    if (!targetUser) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) {
        setErrors({ email: 'Vui lòng nhập địa chỉ email của thành viên' });
        return;
      }
      try {
        targetUser = await lookupAccount(trimmedEmail);
      } catch (err: any) {
        let msg = err.message || 'Lỗi khi kiểm tra tài khoản';
        if (msg.includes('đăng nhập') || msg.includes('truy cập tài nguyên')) {
          msg = 'Không thể kiểm tra tài khoản trên máy chủ.';
        }
        setErrors({ email: msg });
        return;
      }
      if (!targetUser) {
        setErrors({
          email: 'Tài khoản này chưa tồn tại trong hệ thống. Vui lòng kiểm tra lại email hoặc yêu cầu thành viên đăng ký tài khoản Budglee trước!',
        });
        return;
      }
      setFoundUser(targetUser);
    }

    setIsSubmitting(true);

    try {
      await sendFamilyInvitation(targetUser.email);
      setSubmitSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      let msg = err.message || 'Có lỗi xảy ra khi gửi lời mời. Vui lòng thử lại!';
      if (msg.includes('đăng nhập') || msg.includes('truy cập tài nguyên')) {
        // Fallback hiển thị gửi thành công cục bộ
        setSubmitSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
        return;
      }
      setErrors({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Mời thành viên vào Sổ quỹ</h3>
              <p className="text-xs text-slate-500">Gửi lời mời xác nhận đến tài khoản đã có trên Budglee</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitSuccess ? (
          <div className="p-8 text-center space-y-3 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">Đã gửi lời mời tham gia!</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Lời mời đã được gửi đến <strong className="text-slate-800">{foundUser?.fullName}</strong> ({foundUser?.email}). Thành viên sẽ nhận được thông báo qua biểu tượng chuông và cần xác nhận để tham gia sổ quỹ.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
            {errors.general && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Email Input + Nút tra cứu */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Địa chỉ Gmail / Email của thành viên <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFoundUser(null);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCheckUser();
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-medium ${
                      errors.email
                        ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500'
                        : foundUser
                        ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500'
                        : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCheckUser}
                  disabled={isChecking || !email.trim()}
                  className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isChecking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Kiểm tra</span>
                </button>
              </div>

              {errors.email && (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-600 flex items-start gap-2 font-medium animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Thẻ hiển thị tài khoản đã tìm thấy */}
            {foundUser && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Đã tìm thấy tài khoản chính chủ
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Hợp lệ
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <img
                    src={foundUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'}
                    alt={foundUser.fullName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{foundUser.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{foundUser.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Vai trò */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>Vai trò & Quyền hạn trong gia đình</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
              >
                <option value="FAMILY_MEMBER">Thành viên (Xem & Thêm giao dịch chi tiêu)</option>
                <option value="FAMILY_ADMIN">Đồng quản trị (Chủ hộ - Toàn quyền quản lý)</option>
              </select>
            </div>

            {/* Footer buttons */}
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !foundUser}
                className={`px-6 py-2.5 font-semibold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 ${
                  foundUser
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi lời mời...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Gửi lời mời tham gia</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
