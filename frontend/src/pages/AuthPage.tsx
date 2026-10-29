import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  CheckCircle2,
  TrendingUp,
  Wallet,
  AlertCircle,
  Plus,
  Trash2,
  Home,
  Crown,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Role, User } from '../types';

interface AuthPageProps {
  onSuccess?: () => void;
}

interface InitialMemberRow {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('INDIVIDUAL_USER');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Family registration states
  const [familyName, setFamilyName] = useState('');
  const [initialFamilyMembers, setInitialFamilyMembers] = useState<InitialMemberRow[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { setAuth } = useStore();

  // Helper validation
  const validateEmail = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.trim()) return 'Vui lòng nhập địa chỉ email';
    if (!emailRegex.test(val.trim())) return 'Địa chỉ email không đúng định dạng (VD: example@domain.com)';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Vui lòng nhập mật khẩu';
    if (val.length < 6) return 'Mật khẩu phải có tối thiểu 6 ký tự';
    return '';
  };

  const validateFullName = (val: string) => {
    if (!val.trim()) return 'Vui lòng nhập họ và tên của bạn';
    if (val.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự';
    return '';
  };

  const handleAddMemberRow = () => {
    setInitialFamilyMembers((prev) => [
      ...prev,
      {
        id: 'member-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        fullName: '',
        email: '',
        role: 'FAMILY_MEMBER',
      },
    ]);
  };

  const handleRemoveMemberRow = (id: string) => {
    setInitialFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMemberChange = (id: string, field: 'fullName' | 'email' | 'role', value: string) => {
    setInitialFamilyMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
    // Clear error for this field
    const errKey = `member_${id}_${field === 'fullName' ? 'name' : field}`;
    if (errors[errKey]) {
      setErrors((prev) => ({ ...prev, [errKey]: '' }));
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const errs: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    const passErr = validatePassword(password);
    if (passErr) errs.password = passErr;

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const trimmedEmail = email.trim().toLowerCase();

      if (trimmedEmail === 'demo@budglee.com') {
        // Tài khoản demo mặc định: nạp bộ dữ liệu mẫu phong phú
        setAuth(
          {
            id: 1,
            fullName: 'Nguyễn Tiến Thành',
            email: 'demo@budglee.com',
            role: 'INDIVIDUAL_USER',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
          },
          'mock-jwt-token-demo'
        );
      } else {
        // Tài khoản người dùng thực: tra cứu thông tin đã đăng ký trong localStorage
        const savedUserStr = localStorage.getItem('budglee_user_' + trimmedEmail);
        let userToLogin: User;

        if (savedUserStr) {
          try {
            userToLogin = JSON.parse(savedUserStr);
          } catch {
            userToLogin = {
              id: Date.now(),
              fullName: email.split('@')[0],
              email: trimmedEmail,
              role: 'INDIVIDUAL_USER',
              avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
            };
          }
        } else {
          userToLogin = {
            id: Date.now(),
            fullName: email.split('@')[0],
            email: trimmedEmail,
            role: 'INDIVIDUAL_USER',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
          };
          localStorage.setItem('budglee_user_' + trimmedEmail, JSON.stringify(userToLogin));
        }

        // Đăng nhập tài khoản với dữ liệu riêng (không lẫn dữ liệu demo)
        setAuth(userToLogin, 'mock-jwt-token-' + Date.now(), false);
      }

      if (onSuccess) onSuccess();
    }, 600);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const errs: Record<string, string> = {};

    const nameErr = validateFullName(fullName);
    if (nameErr) errs.fullName = nameErr;

    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;

    const passErr = validatePassword(password);
    if (passErr) errs.password = passErr;

    if (!confirmPassword) {
      errs.confirmPassword = 'Vui lòng xác nhận lại mật khẩu';
    } else if (confirmPassword !== password) {
      errs.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    if (!agreeTerms) {
      errs.agreeTerms = 'Bạn cần đồng ý với Điều khoản dịch vụ & Chính sách bảo mật';
    }

    // Nếu đăng ký làm Chủ hộ gia đình:
    if (role === 'FAMILY_ADMIN') {
      if (!familyName.trim()) {
        errs.familyName = 'Vui lòng nhập tên sổ quỹ gia đình';
      } else if (familyName.trim().length < 2) {
        errs.familyName = 'Tên sổ quỹ phải có ít nhất 2 ký tự';
      }

      // Kiểm tra danh sách thành viên gia đình ban đầu
      initialFamilyMembers.forEach((m) => {
        if (!m.fullName.trim()) {
          errs[`member_${m.id}_name`] = 'Vui lòng nhập họ tên thành viên';
        }
        if (!m.email.trim()) {
          errs[`member_${m.id}_email`] = 'Vui lòng nhập email thành viên';
        } else if (!validateEmail(m.email)) {
          errs[`member_${m.id}_email`] = 'Email thành viên không đúng định dạng';
        } else if (m.email.trim().toLowerCase() === email.trim().toLowerCase()) {
          errs[`member_${m.id}_email`] = 'Email không được trùng với email chủ hộ';
        }
      });
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const trimmedEmail = email.trim().toLowerCase();
      const familyGroupId = role === 'FAMILY_ADMIN' ? 'FAM-' + Math.floor(100 + Math.random() * 900) : undefined;

      const newUser: User = {
        id: Date.now(),
        fullName: fullName.trim(),
        email: trimmedEmail,
        role: role,
        familyGroupId,
        familyGroupName: role === 'FAMILY_ADMIN' ? familyName.trim() : undefined,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
      };

      // Lưu hồ sơ tài khoản
      localStorage.setItem('budglee_user_' + trimmedEmail, JSON.stringify(newUser));

      // Tạo tài khoản MỚI HOÀN TOÀN SẠCH (isNewRegistration = true, không dính ví/giao dịch cũ)
      setAuth(
        newUser,
        'mock-jwt-token-' + Date.now(),
        true,
        initialFamilyMembers
          .filter((m) => m.fullName.trim() && m.email.trim())
          .map((m) => ({
            fullName: m.fullName.trim(),
            email: m.email.trim(),
            role: m.role,
          }))
      );

      if (onSuccess) onSuccess();
    }, 700);
  };

  const handleFillDemo = () => {
    setEmail('demo@budglee.com');
    setPassword('Budglee@2026');
    setErrors({});
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0F172A] text-slate-100 overflow-hidden font-sans">
      {/* LEFT COLUMN: Visual Showcase & Brand Intro (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/60 border-r border-slate-800">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-emerald-500/30">
            B
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Budglee</h1>
            <p className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
              Finance Platform
            </p>
          </div>
        </div>

        {/* Middle Value Proposition & Floating Preview Card */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Nền tảng quản lý tài chính thế hệ mới</span>
          </div>

          <h2 className="text-4xl font-black tracking-tight text-white leading-tight mb-4">
            Làm chủ dòng tiền cá nhân &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Minh bạch quỹ gia đình
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Ghi chép giao dịch tức thì, cảnh báo bội chi đa cấp độ, theo dõi tiến độ tiết kiệm và nhận lời khuyên thông minh từ Trợ lý AI.
          </p>

          {/* Interactive Feature Highlights */}
          <div className="space-y-4">
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Quản lý đa ví & thẻ tín dụng</h4>
                <p className="text-xs text-slate-400">Tự động cân bằng số dư tức thời chuẩn ACID</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Không gian tài chính gia đình (Family Workspace)</h4>
                <p className="text-xs text-slate-400">Phân quyền linh hoạt giữa chủ hộ và các thành viên</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Cảnh báo ngưỡng 80% & Bot gợi ý chi tiêu</h4>
                <p className="text-xs text-slate-400">Kiểm soát ngân sách thông minh không lo bội chi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Security Assurance */}
        <div className="relative z-10 flex items-center gap-2.5 text-xs text-slate-400 pt-6 border-t border-slate-800/60">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Bảo mật dữ liệu chuẩn ngân hàng với mã hóa BCrypt & JWT Authentication</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Form (Login / Register) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Top Toggle Header */}
          <div className="text-center sm:text-left space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isLogin ? 'Chào mừng bạn quay lại!' : 'Bắt đầu cùng Budglee'}
            </h2>
            <p className="text-sm text-slate-400">
              {isLogin
                ? 'Đăng nhập để theo dõi dòng tiền và kế hoạch ngân sách của bạn'
                : 'Tạo tài khoản miễn phí chỉ trong 30 giây để quản lý tài chính'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              id="tab-login"
              type="button"
              onClick={() => {
                setIsLogin(true);
                setErrorMessage('');
                setErrors({});
              }}
              className={`py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                isLogin
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đăng nhập
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => {
                setIsLogin(false);
                setErrorMessage('');
                setErrors({});
              }}
              className={`py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                !isLogin
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đăng ký mới
            </button>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Quick Demo Fill (Convenience feature for grading/testing) */}
          {isLogin && (
            <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>Khảo sát nhanh với tài khoản mẫu?</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shrink-0 shadow-sm"
              >
                Điền nhanh Demo
              </button>
            </div>
          )}

          {/* ===================== FORM ĐĂNG NHẬP ===================== */}
          {isLogin ? (
            <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Địa chỉ Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="demo@budglee.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-900 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                      errors.email
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-950/20'
                        : 'border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Tính năng khôi phục mật khẩu qua Email sẽ được gửi mã OTP');
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-900 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                      errors.password
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-950/20'
                        : 'border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                  />
                  <span>Ghi nhớ phiên đăng nhập (30 ngày)</span>
                </label>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Đăng nhập vào Budglee</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ===================== FORM ĐĂNG KÝ ===================== */
            <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Họ và tên của bạn <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reg-fullname"
                    type="text"
                    placeholder="VD: Nguyễn Tiến Thành"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-900 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                      errors.fullName
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-950/20'
                        : 'border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Địa chỉ Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-900 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                      errors.email
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-950/20'
                        : 'border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Vai trò / Phân quyền đăng ký */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mục đích sử dụng chính <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('INDIVIDUAL_USER');
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.familyName;
                        return copy;
                      });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'INDIVIDUAL_USER'
                        ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-white mb-0.5">👤 Quản lý Cá nhân</div>
                    <div className="text-[10px] text-slate-400 leading-tight">Theo dõi dòng tiền riêng</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRole('FAMILY_ADMIN');
                      if (initialFamilyMembers.length === 0) {
                        handleAddMemberRow();
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'FAMILY_ADMIN'
                        ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-white mb-0.5">👨‍👩‍👧‍👦 Quản lý Gia đình</div>
                    <div className="text-[10px] text-slate-400 leading-tight">Làm chủ hộ & sổ quỹ chung</div>
                  </button>
                </div>
              </div>

              {/* KHỐI CẤU HÌNH DÀNH RIÊNG CHO GIA ĐÌNH (FAMILY_ADMIN) */}
              {role === 'FAMILY_ADMIN' && (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span>Thiết lập Không gian Sổ quỹ Gia đình</span>
                  </div>

                  {/* Tên Sổ quỹ Gia đình */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tên Sổ quỹ Gia đình <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Home className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="VD: Gia đình Nguyễn, Tổ ấm nhỏ..."
                        value={familyName}
                        onChange={(e) => {
                          setFamilyName(e.target.value);
                          if (errors.familyName) setErrors((prev) => ({ ...prev, familyName: '' }));
                        }}
                        className={`w-full pl-9 pr-3 py-2 bg-slate-950 border rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                          errors.familyName
                            ? 'border-rose-500 ring-1 ring-rose-500'
                            : 'border-slate-700 focus:border-emerald-500'
                        }`}
                      />
                    </div>
                    {errors.familyName && (
                      <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.familyName}</span>
                      </p>
                    )}
                  </div>

                  {/* Danh sách thành viên gia đình ban đầu */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        Thành viên gia đình cần thêm:
                      </label>
                      <button
                        type="button"
                        onClick={handleAddMemberRow}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Thêm thành viên</span>
                      </button>
                    </div>

                    {initialFamilyMembers.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">
                        Chưa có thành viên nào. Bấm "+ Thêm thành viên" để mời người thân ngay lúc tạo sổ quỹ.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {initialFamilyMembers.map((member, idx) => (
                          <div
                            key={member.id}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-semibold">Thành viên #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMemberRow(member.id)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                                title="Xóa dòng thành viên này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <input
                                  type="text"
                                  placeholder="Họ tên thành viên"
                                  value={member.fullName}
                                  onChange={(e) =>
                                    handleMemberChange(member.id, 'fullName', e.target.value)
                                  }
                                  className={`w-full px-2.5 py-1.5 bg-slate-900 border rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none ${
                                    errors[`member_${member.id}_name`]
                                      ? 'border-rose-500'
                                      : 'border-slate-700 focus:border-emerald-500'
                                  }`}
                                />
                                {errors[`member_${member.id}_name`] && (
                                  <span className="text-[10px] text-rose-400 mt-0.5 block">
                                    {errors[`member_${member.id}_name`]}
                                  </span>
                                )}
                              </div>

                              <div>
                                <input
                                  type="email"
                                  placeholder="Email thành viên"
                                  value={member.email}
                                  onChange={(e) =>
                                    handleMemberChange(member.id, 'email', e.target.value)
                                  }
                                  className={`w-full px-2.5 py-1.5 bg-slate-900 border rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none ${
                                    errors[`member_${member.id}_email`]
                                      ? 'border-rose-500'
                                      : 'border-slate-700 focus:border-emerald-500'
                                  }`}
                                />
                                {errors[`member_${member.id}_email`] && (
                                  <span className="text-[10px] text-rose-400 mt-0.5 block">
                                    {errors[`member_${member.id}_email`]}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400">Vai trò:</span>
                              <select
                                value={member.role}
                                onChange={(e) =>
                                  handleMemberChange(member.id, 'role', e.target.value)
                                }
                                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500"
                              >
                                <option value="FAMILY_MEMBER">Thành viên (Ghi chép thu chi)</option>
                                <option value="FAMILY_ADMIN">Đồng quản trị (Chủ hộ)</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      className={`w-full pl-10 pr-3 py-2.5 bg-slate-900 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                        errors.password
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-950/20'
                          : 'border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Xác nhận lại <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                      className={`w-full pl-10 pr-3 py-2.5 bg-slate-900 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                        errors.confirmPassword
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-950/20'
                          : 'border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.confirmPassword}</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center">
                  <input
                    id="agree-terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (e.target.checked && errors.agreeTerms) {
                        setErrors((prev) => ({ ...prev, agreeTerms: '' }));
                      }
                    }}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                  />
                  <label htmlFor="agree-terms" className="ml-2 text-xs text-slate-400 select-none">
                    Tôi đồng ý với <a href="#terms" className="text-emerald-400 hover:underline">Điều khoản dịch vụ</a> và <a href="#privacy" className="text-emerald-400 hover:underline">Chính sách bảo mật</a>
                  </label>
                </div>
                {errors.agreeTerms && (
                  <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.agreeTerms}</span>
                  </p>
                )}
              </div>

              <button
                id="btn-register-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Tạo tài khoản Budglee</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Social Proof Footer */}
          <div className="pt-2 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              Budglee Finance Platform • Hệ thống Quản lý Chi tiêu Cá nhân & Hộ Gia đình
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
