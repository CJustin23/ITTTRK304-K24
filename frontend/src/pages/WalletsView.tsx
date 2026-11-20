import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CreditCard,
  Wallet as WalletIcon,
  Plus,
  ShieldCheck,
  Building2,
  Banknote,
  Edit2,
  Trash2,
  AlertCircle,
  Check,
  X,
  Loader2,
  Search,
  ChevronDown,
} from 'lucide-react';
import { useStore, consolidateWallets } from '../store/useStore';
import { Wallet, WalletType } from '../types';
import {
  POPULAR_BANKS,
  POPULAR_CREDIT_CARDS,
} from '../constants/banksAndCards';

export const WalletsView: React.FC = () => {
  const {
    wallets: rawWallets,
    recentTransactions,
    setWalletModalOpen,
    updateWallet,
    deleteWallet,
  } = useStore();

  const [selectedType, setSelectedType] = useState<'ALL' | WalletType>('ALL');

  // Edit Wallet State
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editWalletName, setEditWalletName] = useState('');
  const [editType, setEditType] = useState<WalletType>('BANK');
  const [editCardNumberMasked, setEditCardNumberMasked] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editApiError, setEditApiError] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);
  const [editSearchTerm, setEditSearchTerm] = useState('');
  const [isEditCustomName, setIsEditCustomName] = useState(false);
  const editDropdownRef = useRef<HTMLDivElement>(null);

  // Delete Wallet State
  const [deletingWallet, setDeletingWallet] = useState<Wallet | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const wallets = useMemo(() => consolidateWallets(rawWallets), [rawWallets]);

  const filteredWallets = wallets.filter(
    (w) => selectedType === 'ALL' || w.type === selectedType
  );

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  // Click outside to close edit dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editDropdownRef.current && !editDropdownRef.current.contains(e.target as Node)) {
        setIsEditDropdownOpen(false);
      }
    };
    if (isEditDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditDropdownOpen]);

  const getTypeIcon = (type: WalletType) => {
    switch (type) {
      case 'BANK':
        return Building2;
      case 'CREDIT_CARD':
        return CreditCard;
      default:
        return Banknote;
    }
  };

  const getTypeName = (type: WalletType) => {
    switch (type) {
      case 'BANK':
        return 'Tài khoản Ngân hàng';
      case 'CREDIT_CARD':
        return 'Thẻ Tín dụng';
      default:
        return 'Ví tiền mặt (Cash)';
    }
  };

  const cardGradients = [
    'from-slate-900 via-indigo-950 to-slate-900',
    'from-emerald-950 via-teal-900 to-slate-900',
    'from-amber-950 via-stone-900 to-slate-950',
    'from-purple-950 via-indigo-900 to-slate-900',
  ];

  // Open Edit Modal
  const handleOpenEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setEditType(wallet.type || 'BANK');
    setEditWalletName(wallet.walletName || '');
    const digits = (wallet.cardNumberMasked || '').replace(/\D/g, '').slice(-4);
    setEditCardNumberMasked(digits);
    setEditErrors({});
    setEditApiError('');
    setIsEditDropdownOpen(false);
    setEditSearchTerm('');
    setIsEditCustomName(false);
  };

  // Open Delete Modal
  const handleOpenDelete = (wallet: Wallet) => {
    setDeletingWallet(wallet);
    setDeleteError('');
  };

  // Handle Edit Type Change
  const handleEditTypeChange = (newType: WalletType) => {
    setEditType(newType);
    setEditErrors({});
    setIsEditDropdownOpen(false);
    setEditSearchTerm('');
    setIsEditCustomName(false);

    if (newType === 'CASH') {
      setEditWalletName('Tiền mặt');
      setEditCardNumberMasked('');
    } else if (newType === 'BANK') {
      if (editWalletName === 'Tiền mặt' || !editWalletName) {
        setEditWalletName('Techcombank');
      }
    } else if (newType === 'CREDIT_CARD') {
      if (editWalletName === 'Tiền mặt' || !editWalletName) {
        setEditWalletName('Visa Platinum Credit');
      }
    }
  };

  // Filtered banks for edit dropdown
  const filteredEditBanks = useMemo(() => {
    if (!editSearchTerm.trim()) return POPULAR_BANKS;
    const q = editSearchTerm.trim().toLowerCase();
    return POPULAR_BANKS.filter(
      (b) =>
        b.shortName.toLowerCase().includes(q) ||
        b.fullName.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q)
    );
  }, [editSearchTerm]);

  // Filtered credit cards for edit dropdown
  const filteredEditCards = useMemo(() => {
    if (!editSearchTerm.trim()) return POPULAR_CREDIT_CARDS;
    const q = editSearchTerm.trim().toLowerCase();
    return POPULAR_CREDIT_CARDS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.issuer && c.issuer.toLowerCase().includes(q)) ||
        c.brand.toLowerCase().includes(q)
    );
  }, [editSearchTerm]);

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet || isSubmittingEdit) return;
    const errs: Record<string, string> = {};

    const finalName = editType === 'CASH' ? 'Tiền mặt' : editWalletName.trim();
    if (editType !== 'CASH') {
      if (!finalName) {
        errs.walletName = 'Vui lòng chọn ngân hàng hoặc thẻ từ danh sách';
      } else if (finalName.length < 2) {
        errs.walletName = 'Tên tài khoản phải có ít nhất 2 ký tự';
      }

      const trimmedCard = editCardNumberMasked.trim();
      if (!trimmedCard) {
        errs.cardNumberMasked = 'Vui lòng nhập 4 chữ số cuối của thẻ hoặc tài khoản';
      } else if (!/^\d{4}$/.test(trimmedCard)) {
        errs.cardNumberMasked = 'Vui lòng nhập đúng 4 chữ số cuối (VD: 6789)';
      }
    }

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    setIsSubmittingEdit(true);
    setEditApiError('');

    try {
      const cardDigits = editCardNumberMasked.trim().replace(/\D/g, '').slice(-4);
      await updateWallet(editingWallet.id, {
        walletName: finalName,
        type: editType,
        cardNumberMasked: editType !== 'CASH' && cardDigits ? `**** ${cardDigits}` : '',
      });
      setEditingWallet(null);
      setToastMessage({ type: 'success', text: 'Cập nhật nguồn tiền thành công!' });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setEditApiError(err?.message || 'Có lỗi xảy ra khi cập nhật ví');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingWallet || isSubmittingDelete) return;

    setIsSubmittingDelete(true);
    setDeleteError('');

    try {
      await deleteWallet(deletingWallet.id);
      setDeletingWallet(null);
      setToastMessage({ type: 'success', text: 'Đã xóa nguồn tiền thành công!' });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setDeleteError(err?.message || 'Không thể xóa nguồn tiền này');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Check if deleting wallet has transactions
  const deletingWalletHasTransactions = useMemo(() => {
    if (!deletingWallet) return false;
    return recentTransactions.some((t) => String(t.walletId) === String(deletingWallet.id));
  }, [deletingWallet, recentTransactions]);

  const bankQuickPills = ['Techcombank', 'Vietcombank', 'MB Bank', 'BIDV', 'VietinBank', 'ACB', 'VPBank', 'Ví MoMo'];
  const cardQuickPills = [
    'Visa Platinum Credit',
    'Mastercard World',
    'Visa Signature',
    'JCB Ultimate',
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold text-white animate-in slide-in-from-top-3 duration-200 ${
            toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Quản lý Ví & Tài khoản Thẻ
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi dòng tiền trên nhiều nguồn tài khoản và thẻ tín dụng liên kết
          </p>
        </div>
        <button
          onClick={() => setWalletModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm nguồn tiền mới</span>
        </button>
      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-600/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100 mb-1">
            Tổng số dư khả dụng (Total Balance)
          </p>
          <h3 className="text-3xl font-black tracking-tight">
            {new Intl.NumberFormat('vi-VN').format(totalBalance)} ₫
          </h3>
          <p className="text-xs text-emerald-100 mt-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Đồng bộ từ {wallets.length} tài khoản liên kết</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Tài khoản Ngân hàng & Thẻ
            </p>
            <h4 className="text-2xl font-bold text-slate-800">
              {wallets.filter((w) => w.type !== 'CASH').length} thẻ
            </h4>
            <p className="text-xs text-emerald-600 font-medium mt-1">Hỗ trợ thanh toán trực tuyến</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Ví tiền mặt dự phòng
            </p>
            <h4 className="text-2xl font-bold text-slate-800">
              {new Intl.NumberFormat('vi-VN').format(
                wallets.filter((w) => w.type === 'CASH').reduce((sum, w) => sum + w.balance, 0)
              )}{' '}
              ₫
            </h4>
            <p className="text-xs text-slate-400 mt-1">Dành cho chi tiêu sinh hoạt nhanh</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <Banknote className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit text-xs font-semibold text-slate-600">
        <button
          onClick={() => setSelectedType('ALL')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            selectedType === 'ALL' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'hover:text-slate-900'
          }`}
        >
          Tất cả ({wallets.length})
        </button>
        <button
          onClick={() => setSelectedType('BANK')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            selectedType === 'BANK' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'hover:text-slate-900'
          }`}
        >
          Ngân hàng (Bank)
        </button>
        <button
          onClick={() => setSelectedType('CREDIT_CARD')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            selectedType === 'CREDIT_CARD' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'hover:text-slate-900'
          }`}
        >
          Thẻ Tín dụng (Credit)
        </button>
        <button
          onClick={() => setSelectedType('CASH')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            selectedType === 'CASH' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'hover:text-slate-900'
          }`}
        >
          Tiền mặt (Cash)
        </button>
      </div>

      {/* Visual Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWallets.map((wallet, index) => {
          const Icon = getTypeIcon(wallet.type);
          const gradient = cardGradients[index % cardGradients.length];

          return (
            <div
              key={wallet.id}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-tr ${gradient} p-7 text-white shadow-xl shadow-slate-900/10 border border-slate-700/50 hover:scale-[1.02] transition-transform duration-300 group`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    {getTypeName(wallet.type)}
                  </span>
                  <h4 className="text-xl font-bold tracking-tight mt-2.5 text-white">
                    {wallet.walletName}
                  </h4>
                </div>

                {/* Top Actions: Edit / Delete & Type Icon */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1 shadow-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(wallet);
                      }}
                      title="Chỉnh sửa ví / thẻ này"
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDelete(wallet);
                      }}
                      title="Xóa ví / thẻ này"
                      className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="space-y-1 mb-8">
                <p className="text-xs text-slate-400">Số dư khả dụng</p>
                <p className="text-3xl font-black tracking-tight text-white">
                  {new Intl.NumberFormat('vi-VN').format(wallet.balance)} ₫
                </p>
              </div>

              {/* Card Footer */}
              <div className="flex justify-between items-center text-xs text-slate-300 font-mono pt-4 border-t border-white/10">
                <span className="tracking-widest">
                  {wallet.cardNumberMasked ||
                    (wallet.type === 'CASH'
                      ? 'TIỀN MẶT'
                      : wallet.type === 'BANK'
                      ? 'TÀI KHOẢN NGÂN HÀNG'
                      : 'THẺ TÍN DỤNG')}
                </span>
                <span>HSD: 12/28</span>
              </div>

              {/* Ambient Orb */}
              <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/30 transition-colors"></div>
            </div>
          );
        })}

        {/* Add Wallet Placeholder Card */}
        <button
          onClick={() => setWalletModalOpen(true)}
          className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all group min-h-[220px] cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-emerald-500 group-hover:text-white text-slate-500 flex items-center justify-center transition-colors mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-700 group-hover:text-emerald-700">
            Thêm tài khoản hoặc thẻ mới
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
            Liên kết thêm thẻ Visa, ví điện tử hoặc tài khoản ngân hàng phụ
          </p>
        </button>
      </div>

      {/* ===================== MODAL CHỈNH SỬA VÍ / THẺ ===================== */}
      {editingWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Chỉnh sửa Nguồn tiền</h3>
                  <p className="text-xs text-slate-400">
                    Cập nhật thông tin thẻ hoặc tài khoản ngân hàng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingWallet(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* API Error Alert */}
            {editApiError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editApiError}</span>
              </div>
            )}

            {/* Read-only balance info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Số dư hiện tại
                </p>
                <p className="text-lg font-black text-slate-800 mt-0.5">
                  {new Intl.NumberFormat('vi-VN').format(editingWallet.balance)} ₫
                </p>
              </div>
              <p className="text-[11px] text-slate-400 max-w-[200px] text-right italic">
                Số dư thay đổi tự động qua các giao dịch thu chi.
              </p>
            </div>

            <form onSubmit={handleSaveEdit} noValidate className="space-y-4">
              {/* Wallet Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Loại nguồn tiền <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditTypeChange('BANK')}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      editType === 'BANK'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Ngân hàng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditTypeChange('CREDIT_CARD')}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      editType === 'CREDIT_CARD'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Thẻ tín dụng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditTypeChange('CASH')}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      editType === 'CASH'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Tiền mặt</span>
                  </button>
                </div>
              </div>

              {/* Wallet Name Selection */}
              {editType !== 'CASH' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-600">
                      Tên ngân hàng hoặc thẻ <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditCustomName(!isEditCustomName);
                        setIsEditDropdownOpen(false);
                      }}
                      className="text-[11px] font-semibold text-emerald-600 hover:underline cursor-pointer"
                    >
                      {isEditCustomName ? '← Chọn từ danh sách có sẵn' : '+ Nhập tên khác'}
                    </button>
                  </div>

                  {isEditCustomName ? (
                    <input
                      type="text"
                      placeholder="Nhập tên ví hoặc ngân hàng..."
                      value={editWalletName}
                      onChange={(e) => {
                        setEditWalletName(e.target.value);
                        if (editErrors.walletName) setEditErrors((prev) => ({ ...prev, walletName: '' }));
                      }}
                      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all ${
                        editErrors.walletName
                          ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                      }`}
                    />
                  ) : (
                    <div className="relative" ref={editDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsEditDropdownOpen(!isEditDropdownOpen)}
                        className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm flex items-center justify-between text-left transition-all cursor-pointer ${
                          editErrors.walletName
                            ? 'border-rose-500 ring-2 ring-rose-500/20'
                            : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                        }`}
                      >
                        <span className="font-semibold text-slate-800 truncate">
                          {editWalletName || 'Chọn ngân hàng / thẻ...'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      </button>

                      {isEditDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-2 max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Tìm kiếm ngân hàng / thẻ..."
                              value={editSearchTerm}
                              onChange={(e) => setEditSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="overflow-y-auto space-y-1 flex-1 pr-1">
                            {editType === 'BANK' ? (
                              filteredEditBanks.length > 0 ? (
                                filteredEditBanks.map((b) => (
                                  <button
                                    key={b.code}
                                    type="button"
                                    onClick={() => {
                                      setEditWalletName(b.shortName);
                                      setIsEditDropdownOpen(false);
                                      setEditSearchTerm('');
                                      if (editErrors.walletName) setEditErrors((prev) => ({ ...prev, walletName: '' }));
                                    }}
                                    className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors cursor-pointer ${
                                      editWalletName === b.shortName ? 'bg-emerald-50/80 font-bold text-emerald-800' : 'text-slate-700'
                                    }`}
                                  >
                                    <span className="font-semibold">{b.shortName}</span>
                                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                      {b.fullName}
                                    </span>
                                  </button>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400 text-center py-3">Không tìm thấy ngân hàng</p>
                              )
                            ) : (
                              filteredEditCards.length > 0 ? (
                                filteredEditCards.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setEditWalletName(c.name);
                                      setIsEditDropdownOpen(false);
                                      setEditSearchTerm('');
                                      if (editErrors.walletName) setEditErrors((prev) => ({ ...prev, walletName: '' }));
                                    }}
                                    className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors cursor-pointer ${
                                      editWalletName === c.name ? 'bg-emerald-50/80 font-bold text-emerald-800' : 'text-slate-700'
                                    }`}
                                  >
                                    <span className="font-semibold">{c.name}</span>
                                    <span className="text-[10px] text-slate-400">{c.issuer}</span>
                                  </button>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400 text-center py-3">Không tìm thấy thẻ</p>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick pills */}
                  {!isEditCustomName && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(editType === 'BANK' ? bankQuickPills : cardQuickPills).slice(0, 5).map((pill) => (
                        <button
                          key={pill}
                          type="button"
                          onClick={() => {
                            setEditWalletName(pill);
                            if (editErrors.walletName) setEditErrors((prev) => ({ ...prev, walletName: '' }));
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                            editWalletName === pill
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {pill}
                        </button>
                      ))}
                    </div>
                  )}

                  {editErrors.walletName && (
                    <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{editErrors.walletName}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-2xl text-xs text-amber-800">
                  Nguồn tiền mặt sẽ được lưu với tên <strong>"Tiền mặt"</strong>.
                </div>
              )}

              {/* 4 Card Digits (Required for BANK & CREDIT_CARD) */}
              {editType !== 'CASH' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    4 số cuối của thẻ hoặc tài khoản <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="VD: 6789"
                    value={editCardNumberMasked}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setEditCardNumberMasked(val);
                      if (editErrors.cardNumberMasked) setEditErrors((prev) => ({ ...prev, cardNumberMasked: '' }));
                    }}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-mono ${
                      editErrors.cardNumberMasked
                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                        : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {editErrors.cardNumberMasked && (
                    <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{editErrors.cardNumberMasked}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingWallet(null)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu thay đổi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL XÁC NHẬN XÓA VÍ / THẺ ===================== */}
      {deletingWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-800">Xóa nguồn tiền này?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Bạn có chắc chắn muốn xóa <strong>"{deletingWallet.walletName}"</strong>
                {deletingWallet.cardNumberMasked ? ` (${deletingWallet.cardNumberMasked})` : ''} không?
              </p>
              <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
                <span className="text-slate-400">Số dư hiện tại: </span>
                <span className="font-bold text-slate-800">
                  {new Intl.NumberFormat('vi-VN').format(deletingWallet.balance)} ₫
                </span>
              </div>
            </div>

            {/* If transactions exist, show alert */}
            {deletingWalletHasTransactions ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 text-left space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Không thể xóa nguồn tiền
                </p>
                <p className="text-[11px] leading-relaxed">
                  Ví/thẻ này đã có lịch sử giao dịch phát sinh trong hệ thống. Để bảo toàn lịch sử thu chi tài chính, bạn không thể xóa nguồn tiền này.
                </p>
              </div>
            ) : deleteError ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 text-left">
                {deleteError}
              </div>
            ) : null}

            <div className="flex items-center gap-3 pt-2">
              {deletingWalletHasTransactions ? (
                <button
                  type="button"
                  onClick={() => setDeletingWallet(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Đã hiểu & Đóng
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setDeletingWallet(null)}
                    className="flex-1 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingDelete}
                    onClick={handleConfirmDelete}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    {isSubmittingDelete ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang xóa...</span>
                      </>
                    ) : (
                      <span>Xóa ngay</span>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
