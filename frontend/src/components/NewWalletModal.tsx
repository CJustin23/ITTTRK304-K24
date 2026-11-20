import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Building2, CreditCard, Banknote, AlertCircle, Search, ChevronDown, Check, Sparkles, Edit3 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { WalletType } from '../types';
import { POPULAR_BANKS, POPULAR_CREDIT_CARDS, BankItem, CreditCardItem } from '../constants/banksAndCards';

export const NewWalletModal: React.FC = () => {
  const { isWalletModalOpen, setWalletModalOpen, addWallet } = useStore();

  const [type, setType] = useState<WalletType>('BANK');
  const [walletName, setWalletName] = useState('Techcombank');
  const [balance, setBalance] = useState('');
  const [cardNumberMasked, setCardNumberMasked] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown & Search state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomNameMode, setIsCustomNameMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // When type changes, set sensible default selection
  const handleTypeChange = (newType: WalletType) => {
    setType(newType);
    setErrors({});
    setIsDropdownOpen(false);
    setSearchTerm('');
    setIsCustomNameMode(false);

    if (newType === 'BANK') {
      setWalletName('Techcombank');
    } else if (newType === 'CREDIT_CARD') {
      setWalletName('Visa Platinum Credit');
    } else {
      setWalletName('Tiền mặt');
    }
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      setBalance('');
      return;
    }
    const formatted = new Intl.NumberFormat('vi-VN').format(Number(digits));
    setBalance(formatted);
    if (errors.balance) setErrors((prev) => ({ ...prev, balance: '' }));
  };

  // Filtered banks based on search
  const filteredBanks = useMemo(() => {
    if (!searchTerm.trim()) return POPULAR_BANKS;
    const q = searchTerm.trim().toLowerCase();
    return POPULAR_BANKS.filter(
      (b) =>
        b.shortName.toLowerCase().includes(q) ||
        b.fullName.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  // Filtered credit cards based on search
  const filteredCards = useMemo(() => {
    if (!searchTerm.trim()) return POPULAR_CREDIT_CARDS;
    const q = searchTerm.trim().toLowerCase();
    return POPULAR_CREDIT_CARDS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.issuer && c.issuer.toLowerCase().includes(q)) ||
        c.brand.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  const selectBank = (bank: BankItem) => {
    setWalletName(bank.shortName);
    setIsDropdownOpen(false);
    setSearchTerm('');
    if (errors.walletName) setErrors((prev) => ({ ...prev, walletName: '' }));
  };

  const selectCard = (card: CreditCardItem) => {
    setWalletName(card.name);
    setIsDropdownOpen(false);
    setSearchTerm('');
    if (errors.walletName) setErrors((prev) => ({ ...prev, walletName: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const errs: Record<string, string> = {};

    const finalWalletName = type === 'CASH' ? 'Tiền mặt' : walletName.trim();

    if (type !== 'CASH') {
      if (!finalWalletName) {
        errs.walletName = 'Vui lòng chọn ngân hàng hoặc thẻ từ danh sách';
      } else if (finalWalletName.length < 2) {
        errs.walletName = 'Tên tài khoản phải có ít nhất 2 ký tự';
      }
    }

    const rawDigits = balance.replace(/\./g, '');
    const numBalance = parseFloat(rawDigits);
    if (!rawDigits.trim()) {
      errs.balance = 'Vui lòng nhập số tiền ban đầu';
    } else if (isNaN(numBalance) || numBalance < 0) {
      errs.balance = 'Số tiền không được là số âm';
    }

    if (type !== 'CASH') {
      const trimmedCard = cardNumberMasked.trim();
      if (!trimmedCard) {
        errs.cardNumberMasked = 'Vui lòng nhập 4 chữ số cuối của thẻ hoặc tài khoản';
      } else if (!/^\d{4}$/.test(trimmedCard)) {
        errs.cardNumberMasked = 'Vui lòng nhập đúng 4 chữ số cuối (VD: 6789)';
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    const cardDigits = cardNumberMasked.trim().replace(/\D/g, '').slice(-4);
    addWallet({
      walletName: finalWalletName,
      balance: numBalance,
      type,
      currency: 'VND',
      cardNumberMasked: type !== 'CASH' && cardDigits ? `**** ${cardDigits}` : '',
    });

    // Reset & close
    setWalletName('Techcombank');
    setBalance('');
    setCardNumberMasked('');
    setErrors({});
    setIsSubmitting(false);
    setIsDropdownOpen(false);
    setIsCustomNameMode(false);
    setWalletModalOpen(false);
  };

  if (!isWalletModalOpen) return null;

  // Quick-pick lists
  const bankQuickPills = ['Techcombank', 'Vietcombank', 'MB Bank', 'BIDV', 'VietinBank', 'ACB', 'VPBank', 'Ví MoMo'];
  const cardQuickPills = [
    'Visa Platinum Credit',
    'Visa Signature Credit',
    'Mastercard Titanium Credit',
    'JCB Platinum Credit',
    'Techcombank Visa Platinum',
    'VPBank StepUP Mastercard',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              {type === 'BANK' ? (
                <Building2 className="w-5 h-5" />
              ) : type === 'CREDIT_CARD' ? (
                <CreditCard className="w-5 h-5" />
              ) : (
                <Banknote className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Thêm nguồn tiền (Ví / Thẻ) mới</h3>
              <p className="text-xs text-slate-400 mt-0.5">Chọn ngân hàng hoặc thẻ có sẵn nhanh chóng</p>
            </div>
          </div>
          <button
            onClick={() => {
              setErrors({});
              setIsDropdownOpen(false);
              setWalletModalOpen(false);
            }}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Wallet Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Loại tài khoản</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="btn-wallet-type-bank"
                type="button"
                onClick={() => handleTypeChange('BANK')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  type === 'BANK'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Ngân hàng</span>
              </button>
              <button
                id="btn-wallet-type-credit"
                type="button"
                onClick={() => handleTypeChange('CREDIT_CARD')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  type === 'CREDIT_CARD'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Thẻ tín dụng</span>
              </button>
              <button
                id="btn-wallet-type-cash"
                type="button"
                onClick={() => handleTypeChange('CASH')}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  type === 'CASH'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Tiền mặt</span>
              </button>
            </div>
          </div>

          {/* BANK SELECTION LIST */}
          {type === 'BANK' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Chọn Ngân hàng / Ví điện tử có sẵn
                </label>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Chọn 1 chạm không cần gõ</span>
                </span>
              </div>

              {/* Quick Pick Chips */}
              <div className="flex flex-wrap gap-1.5">
                {bankQuickPills.map((name) => {
                  const isSelected = walletName === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setWalletName(name);
                        setIsCustomNameMode(false);
                        if (errors.walletName) setErrors((prev) => ({ ...prev, walletName: '' }));
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30 font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      <span>{name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dropdown Selector */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-left text-sm flex items-center justify-between transition-all cursor-pointer ${
                    isDropdownOpen
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">
                      {walletName || 'Chọn ngân hàng khác từ danh sách...'}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-150">
                    {/* Search inside Dropdown */}
                    <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Tìm ngân hàng theo tên hoặc mã (VCB, TCB, MB...)"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* Bank List */}
                    <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                      {filteredBanks.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          Không tìm thấy ngân hàng phù hợp
                        </div>
                      ) : (
                        filteredBanks.map((b) => {
                          const isSelected = walletName === b.shortName;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => selectBank(b)}
                              className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">{b.shortName}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                                    {b.code}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">{b.fullName}</p>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Bottom option for custom name */}
                    <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomNameMode(true);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full py-1.5 px-2 text-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Nhập tên ngân hàng tùy chỉnh khác...</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Custom Name Field */}
              {isCustomNameMode && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-slate-600">Tên tài khoản tùy chỉnh</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomNameMode(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                    >
                      Đóng tùy chỉnh
                    </button>
                  </div>
                  <input
                    id="input-wallet-name"
                    type="text"
                    placeholder="VD: Techcombank Lương, MB Bank Tiết kiệm..."
                    value={walletName}
                    onChange={(e) => {
                      setWalletName(e.target.value);
                      if (errors.walletName) setErrors((prev) => ({ ...prev, walletName: '' }));
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              )}

              {/* Hidden or read-only input to maintain compatibility with test selectors */}
              {!isCustomNameMode && (
                <input
                  id="input-wallet-name"
                  type="text"
                  readOnly
                  value={walletName}
                  className="sr-only"
                  tabIndex={-1}
                />
              )}

              {errors.walletName && (
                <p className="text-xs text-rose-500 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.walletName}</span>
                </p>
              )}
            </div>
          )}

          {/* CREDIT CARD SELECTION LIST */}
          {type === 'CREDIT_CARD' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Chọn Loại Thẻ Tín Dụng có sẵn
                </label>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Chọn 1 chạm có sẵn</span>
                </span>
              </div>

              {/* Quick Pick Chips */}
              <div className="flex flex-wrap gap-1.5">
                {cardQuickPills.map((name) => {
                  const isSelected = walletName === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setWalletName(name);
                        setIsCustomNameMode(false);
                        if (errors.walletName) setErrors((prev) => ({ ...prev, walletName: '' }));
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30 font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      <span>{name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dropdown Selector */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-left text-sm flex items-center justify-between transition-all cursor-pointer ${
                    isDropdownOpen
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">
                      {walletName || 'Chọn loại thẻ khác từ danh sách...'}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-150">
                    {/* Search inside Dropdown */}
                    <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Tìm thẻ (Visa, Platinum, Mastercard, VIB...)"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* Card List */}
                    <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                      {filteredCards.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          Không tìm thấy loại thẻ phù hợp
                        </div>
                      ) : (
                        filteredCards.map((c) => {
                          const isSelected = walletName === c.name;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectCard(c)}
                              className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">{c.name}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                                    {c.brand}
                                  </span>
                                </div>
                                {c.issuer && (
                                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                    Phát hành: {c.issuer}
                                  </p>
                                )}
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Bottom option for custom name */}
                    <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomNameMode(true);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full py-1.5 px-2 text-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Nhập tên thẻ tín dụng khác...</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Custom Name Field */}
              {isCustomNameMode && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-slate-600">Tên thẻ tùy chỉnh</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomNameMode(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                    >
                      Đóng tùy chỉnh
                    </button>
                  </div>
                  <input
                    id="input-wallet-name"
                    type="text"
                    placeholder="VD: Thẻ Visa phụ, Thẻ tín dụng mua sắm..."
                    value={walletName}
                    onChange={(e) => {
                      setWalletName(e.target.value);
                      if (errors.walletName) setErrors((prev) => ({ ...prev, walletName: '' }));
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              )}

              {/* Hidden or read-only input to maintain compatibility with test selectors */}
              {!isCustomNameMode && (
                <input
                  id="input-wallet-name"
                  type="text"
                  readOnly
                  value={walletName}
                  className="sr-only"
                  tabIndex={-1}
                />
              )}

              {errors.walletName && (
                <p className="text-xs text-rose-500 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.walletName}</span>
                </p>
              )}
            </div>
          )}

          {/* CASH INFO */}
          {type === 'CASH' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Banknote className="w-4 h-4 text-amber-600" />
                <span>Ví Tiền mặt (Cash)</span>
              </div>
              <p className="text-amber-700 leading-relaxed">
                Tài khoản tiền mặt sẽ được tự động lưu với tên <strong>"Tiền mặt"</strong> và cộng dồn vào quỹ tiền mặt khả dụng của bạn.
              </p>
            </div>
          )}

          {/* Initial Balance / Deposit */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {type === 'CASH' ? 'Số tiền nạp vào Tiền mặt (VND)' : 'Số dư ban đầu (VND)'}
            </label>
            <input
              id="input-wallet-balance"
              type="text"
              inputMode="numeric"
              placeholder="VD: 5.000.000"
              value={balance}
              onChange={handleBalanceChange}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-bold ${
                errors.balance
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
              }`}
            />
            {errors.balance && (
              <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.balance}</span>
              </p>
            )}
          </div>

          {/* Card Number Masked (If card or bank) */}
          {type !== 'CASH' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                4 số cuối của thẻ hoặc tài khoản <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-wallet-card-masked"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="VD: 6789"
                value={cardNumberMasked}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setCardNumberMasked(val);
                  if (errors.cardNumberMasked) setErrors((prev) => ({ ...prev, cardNumberMasked: '' }));
                }}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all font-mono ${
                  errors.cardNumberMasked
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {errors.cardNumberMasked && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.cardNumberMasked}</span>
                </p>
              )}
            </div>
          )}

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setIsDropdownOpen(false);
                setWalletModalOpen(false);
              }}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
