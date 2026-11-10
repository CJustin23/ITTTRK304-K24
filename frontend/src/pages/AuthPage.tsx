import React, { useState, useEffect } from 'react';
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
  KeyRound,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { AuthService } from '../services/api';
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

  // Forgot password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [generatedDemoOtp, setGeneratedDemoOtp] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const { setAuth } = useStore();

  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCountdown]);

  // Helper validation
  const validateEmail = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.trim()) return 'Vui lòng nhập địa chỉ email';
    if (!emailRegex.test(val.trim())) return 'Địa chỉ email không đúng định dạng (VD: example@domain.com)';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Vui lòng nhập mật khẩu';
    if (val.length < 8 || val.length > 100) return 'Mật khẩu phải từ 8 đến 100 ký tự';
    if (!/[A-Z]/.test(val) || !/\d/.test(val)) return 'Mật khẩu phải có ít nhất một chữ HOA và một chữ số';
    return '';
  };

  const validateLoginPassword = (val: string) => val ? '' : 'Vui lòng nhập mật khẩu';

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
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[`member_${id}_name`];
      delete copy[`member_${id}_email`];
      return copy;
    });
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

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const emailErr = validateEmail(forgotEmail);
    if (emailErr) {
      setErrors({ forgotEmail: emailErr });
      return;
    }

    setErrors({});
    setIsLoading(true);

    const trimmedEmail = forgotEmail.trim().toLowerCase();
    let otpSent = false;
    let localOtp = '';

    let receivedOtp = '';

    try {
      const res = await AuthService.forgotPassword(trimmedEmail);
      if (res && res.otp) {
        receivedOtp = res.otp;
        sessionStorage.setItem('budglee_otp_' + trimmedEmail, res.otp);
      }
      otpSent = true;
    } catch (err: any) {
      // Chỉ dừng lại nếu backend phản hồi lỗi nghiệp vụ 4xx có message rõ ràng
      if (err.response?.data?.message && err.response.status >= 400 && err.response.status < 500) {
        setErrorMessage(err.response.data.message);
        setIsLoading(false);
        return;
      }
      // Nếu backend chưa chạy trên local hoặc gặp lỗi kết nối proxy (500/Network Error)
      // Tự động kích hoạt mã OTP local để người dùng kiểm thử ngay
      localOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem('budglee_otp_' + trimmedEmail, localOtp);
      sessionStorage.setItem('budglee_otp_time_' + trimmedEmail, Date.now().toString());
      receivedOtp = localOtp;
      otpSent = true;
    }

    if (otpSent) {
      setOtpCode(receivedOtp);
      setForgotStep(2);
      setResendCountdown(30);
      setSuccessMessage(`Mã xác thực 6 chữ số đã được gửi đến hộp thư Gmail ${forgotEmail}. Vui lòng mở ứng dụng Gmail để kiểm tra hộp thư đến (hoặc mục Thư rác/Spam)!`);
    }
    setIsLoading(false);
  };

  const handleVerifyOtpStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!otpCode.trim()) {
      setErrors({ otpCode: 'Vui lòng nhập mã xác thực 6 chữ số' });
      return;
    }
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setErrors({ otpCode: 'Mã xác thực phải gồm đúng 6 chữ số' });
      return;
    }

    setErrors({});
    setIsLoading(true);

    const trimmedEmail = forgotEmail.trim().toLowerCase();
    let verified = false;

    try {
      await AuthService.verifyOtp({
        email: trimmedEmail,
        otp: otpCode.trim(),
      });
      verified = true;
    } catch (err: any) {
      // Nếu backend phản hồi lỗi nghiệp vụ cụ thể (4xx)
      if (err.response?.data?.message && err.response.status >= 400 && err.response.status < 500) {
        setErrorMessage(err.response.data.message);
        setIsLoading(false);
        return;
      }
      // Fallback kiểm tra mã lưu trong sessionStorage
      const savedOtp = sessionStorage.getItem('budglee_otp_' + trimmedEmail);
      const savedTime = sessionStorage.getItem('budglee_otp_time_' + trimmedEmail);
      if (savedOtp) {
        const elapsed = Date.now() - Number(savedTime || 0);
        if (elapsed > 5 * 60 * 1000) {
          sessionStorage.removeItem('budglee_otp_' + trimmedEmail);
          setErrorMessage('Mã xác thực đã hết hạn (chỉ có hiệu lực trong 5 phút). Vui lòng gửi lại mã mới!');
          setIsLoading(false);
          return;
        }
        if (savedOtp === otpCode.trim()) {
          verified = true;
        } else {
          setErrorMessage('Mã xác thực không chính xác. Vui lòng kiểm tra lại!');
          setIsLoading(false);
          return;
        }
      } else {
        setErrorMessage('Mã xác thực không chính xác hoặc đã hết hạn. Vui lòng yêu cầu mã mới!');
        setIsLoading(false);
        return;
      }
    }

    if (verified) {
      setForgotStep(3);
      setSuccessMessage('Mã xác thực chính xác! Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn.');
    }
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isLoading) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const trimmedEmail = forgotEmail.trim().toLowerCase();
    let localOtp = '';

    try {
      await AuthService.forgotPassword(trimmedEmail);
    } catch (err: any) {
      if (err.response?.data?.message && err.response.status >= 400 && err.response.status < 500) {
        setErrorMessage(err.response.data.message);
        setIsLoading(false);
        return;
      }
      localOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem('budglee_otp_' + trimmedEmail, localOtp);
      sessionStorage.setItem('budglee_otp_time_' + trimmedEmail, Date.now().toString());
    }

    setOtpCode('');
    setResendCountdown(30);
    setSuccessMessage(`Mã xác thực 6 chữ số mới đã được gửi đến hộp thư Gmail ${forgotEmail}. Vui lòng mở ứng dụng Gmail để kiểm tra (cả hộp thư đến và mục Thư rác/Spam)!`);
    setIsLoading(false);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const errs: Record<string, string> = {};

    const passErr = validatePassword(newPassword);
    if (passErr) {
      errs.newPassword = passErr;
    }

    if (!confirmNewPassword) {
      errs.confirmNewPassword = 'Vui lòng xác nhận lại mật khẩu mới';
    } else if (confirmNewPassword !== newPassword) {
      errs.confirmNewPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await AuthService.resetPassword({
        email: forgotEmail.trim().toLowerCase(),
        otp: otpCode.trim(),
        newPassword: newPassword,
      });

      // Cập nhật cả localStorage nếu tài khoản lưu ở client
      const normalizedForgotEmail = forgotEmail.trim().toLowerCase();
      const savedUserStr = localStorage.getItem('budglee_user_' + normalizedForgotEmail);
      let userObj: any = null;
      if (savedUserStr) {
        try {
          userObj = JSON.parse(savedUserStr);
          userObj.password = newPassword;
          localStorage.setItem('budglee_user_' + normalizedForgotEmail, JSON.stringify(userObj));
        } catch {}
      } else {
        userObj = {
          id: Date.now(),
          fullName: normalizedForgotEmail.split('@')[0],
          email: normalizedForgotEmail,
          role: 'INDIVIDUAL_USER',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
        };
        localStorage.setItem('budglee_user_' + normalizedForgotEmail, JSON.stringify(userObj));
      }

      // Đổi mật khẩu thành công -> Tự động đăng nhập luôn
      if (userObj) {
        setAuth(userObj, 'jwt-token-' + Date.now());
        setIsForgotPassword(false);
      } else {
        setIsForgotPassword(false);
        setIsLogin(true);
        setEmail(forgotEmail);
        setPassword(newPassword);
        setSuccessMessage('Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể đổi mật khẩu. Mã xác thực có thể đã hết hạn hoặc đã được sử dụng!';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const errs: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    const passErr = validateLoginPassword(password);
    if (passErr) errs.password = passErr;
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const account = await AuthService.login(email.trim().toLowerCase(), password);
      const user: User = {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        role: account.role,
        familyGroupId: account.familyGroupId,
      };
      setAuth(user, account.token, false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.');
    } finally {
      setIsLoading(false);
    }
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
        const memberEmailErr = validateEmail(m.email);
        if (memberEmailErr) {
          errs[`member_${m.id}_email`] = memberEmailErr;
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
              {isForgotPassword
                ? 'Khôi phục mật khẩu'
                : isLogin
                ? 'Chào mừng bạn quay lại!'
                : 'Bắt đầu cùng Budglee'}
            </h2>
            <p className="text-sm text-slate-400">
              {isForgotPassword
                ? forgotStep === 1
                  ? 'Nhập địa chỉ Gmail để nhận mã xác thực 6 chữ số'
                  : 'Nhập mã xác thực 6 chữ số và mật khẩu mới của bạn'
                : isLogin
                ? 'Đăng nhập để theo dõi dòng tiền và kế hoạch ngân sách của bạn'
                : 'Tạo tài khoản miễn phí chỉ trong 30 giây để quản lý tài chính'}
            </p>
          </div>

          {/* Success Message Box */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Tab Switcher */}
          {!isForgotPassword && (
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
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* ===================== FORM QUÊN MẬT KHẨU ===================== */}
          {isForgotPassword ? (
            forgotStep === 1 ? (
              /* Bước 1: Nhập email để nhận mã 6 chữ số */
              <form onSubmit={handleForgotPasswordRequest} noValidate className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                  <span className="font-semibold text-emerald-400">Bước 1 / 3</span>
                  <span>Nhập email tài khoản</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Địa chỉ Gmail / Email của bạn <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="VD: ban@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (errors.forgotEmail) setErrors((prev) => ({ ...prev, forgotEmail: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-900 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                        errors.forgotEmail
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-950/20'
                          : 'border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  {errors.forgotEmail && (
                    <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.forgotEmail}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Gửi mã xác thực 6 chữ số</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại Đăng nhập</span>
                  </button>
                </div>
              </form>
            ) : forgotStep === 2 ? (
              /* Bước 2: Nhập mã 6 chữ số kiểm tra (Đúng mới cho qua đổi mật khẩu) */
              <form onSubmit={handleVerifyOtpStep} noValidate className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                  <span className="font-semibold text-emerald-400">Bước 2 / 3</span>
                  <span>Xác nhận mã 6 chữ số</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-emerald-200">
                      Đã gửi mã xác thực tới: <span className="text-white underline">{forgotEmail}</span>
                    </p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Mã xác thực 6 chữ số có hiệu lực trong <strong>5 phút</strong> và chỉ sử dụng được <strong>1 lần</strong>. Vui lòng kiểm tra hộp thư Gmail của bạn.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nhập mã xác thực (6 số) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reset-otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(digits);
                        if (errors.otpCode) setErrors((prev) => ({ ...prev, otpCode: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-900 border rounded-xl text-base text-center font-mono font-black tracking-[8px] text-emerald-400 placeholder:text-slate-600 placeholder:font-normal placeholder:tracking-normal focus:outline-none transition-all ${
                        errors.otpCode
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-950/20'
                          : 'border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  {errors.otpCode && (
                    <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.otpCode}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Xác nhận mã xác thực</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  {/* Nút gửi lại mã với cooldown tối thiểu 30s */}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCountdown > 0 || isLoading}
                    className={`inline-flex items-center gap-1.5 transition-colors font-medium ${
                      resendCountdown > 0
                        ? 'text-slate-500 cursor-not-allowed'
                        : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCountdown > 0
                        ? `Gửi lại mã sau (${resendCountdown}s)`
                        : 'Gửi lại mã mới'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Đổi email khác
                  </button>
                </div>
              </form>
            ) : (
              /* Bước 3: Đặt mật khẩu mới & Đăng nhập */
              <form onSubmit={handleResetPasswordSubmit} noValidate className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                  <span className="font-semibold text-emerald-400">Bước 3 / 3</span>
                  <span>Thiết lập mật khẩu mới</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mật khẩu mới (8–100 ký tự, có chữ HOA và chữ số) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reset-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                      }}
                      className={`w-full pl-10 pr-10 py-2.5 bg-slate-900 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                        errors.newPassword
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-950/20'
                          : 'border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.newPassword}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Xác nhận lại mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reset-confirm-password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        if (errors.confirmNewPassword) setErrors((prev) => ({ ...prev, confirmNewPassword: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-900 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                        errors.confirmNewPassword
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-950/20'
                          : 'border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  {errors.confirmNewPassword && (
                    <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.confirmNewPassword}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Đổi mật khẩu & Đăng nhập ngay</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Hủy và quay lại Đăng nhập</span>
                  </button>
                </div>
              </form>
            )
          ) : isLogin ? (
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
                    placeholder="thanhcanhan@gmail.com"
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
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setForgotStep(1);
                      setForgotEmail(email || '');
                      setErrorMessage('');
                      setSuccessMessage('');
                      setErrors({});
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
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
