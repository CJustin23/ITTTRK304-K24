import React, { useState } from 'react';
import { X, Users, Check, Shield, Crown, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export const ConfirmFamilyInviteModal: React.FC = () => {
  const {
    isConfirmInviteModalOpen,
    setConfirmInviteModalOpen,
    selectedInvitationForConfirm,
    acceptFamilyInvitation,
    rejectFamilyInvitation,
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<'ACCEPTED' | 'REJECTED' | null>(null);

  if (!isConfirmInviteModalOpen || !selectedInvitationForConfirm) return null;

  const inv = selectedInvitationForConfirm;

  const handleClose = () => {
    if (isLoading) return;
    setConfirmInviteModalOpen(false);
    setActionSuccess(null);
  };

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await acceptFamilyInvitation(inv.id);
      setActionSuccess('ACCEPTED');
      setTimeout(() => {
        handleClose();
        if ((window as any).setActiveTab) {
          (window as any).setActiveTab('family');
        }
      }, 1500);
    } catch (err) {
      console.error('Accept invite error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectFamilyInvitation(inv.id);
      setActionSuccess('REJECTED');
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      console.error('Reject invite error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">Lời mời tham gia Quỹ Gia đình</h3>
              <p className="text-xs text-slate-300">Minh bạch dòng tiền & đồng hành tài chính cùng gia đình</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {actionSuccess === 'ACCEPTED' ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black text-slate-800">Gia nhập nhóm thành công!</h4>
              <p className="text-sm text-slate-600 max-w-xs mx-auto">
                Chào mừng bạn đã trở thành thành viên của <strong>{inv.familyGroupName}</strong>. Đang chuyển hướng vào Không gian Gia đình...
              </p>
            </div>
          ) : actionSuccess === 'REJECTED' ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-800">Đã từ chối lời mời</h4>
              <p className="text-sm text-slate-500">
                Bạn đã từ chối lời mời tham gia nhóm gia đình này.
              </p>
            </div>
          ) : (
            <>
              {/* Group Info Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-emerald-50/60 via-teal-50/40 to-slate-50 border border-emerald-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Lời mời đang chờ bạn phản hồi
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Sổ quỹ chung</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 font-medium">Nhóm gia đình:</p>
                  <h4 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">
                    {inv.familyGroupName || 'Sổ quỹ Gia đình'}
                  </h4>
                </div>

                <div className="pt-2 border-t border-emerald-100/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {(inv.invitedByName || 'A')[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {inv.invitedByName || 'Chủ hộ'}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {inv.invitedByEmail ? `Email: ${inv.invitedByEmail}` : 'Trưởng nhóm gia đình'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rights and Benefits */}
              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Quyền hạn khi trở thành thành viên:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Xem số dư ví và nhật ký giao dịch của toàn bộ nhóm gia đình</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Ghi chép thu chi cá nhân đóng góp vào ngân sách sinh hoạt chung</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                    <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Đảm bảo minh bạch tài chính, bảo mật thông tin chuẩn ngân hàng</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition-all text-center disabled:opacity-50"
                >
                  {isLoading ? 'Đang xử lý...' : 'Từ chối'}
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="flex-[2] py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tham gia...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Đồng ý tham gia gia đình</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

