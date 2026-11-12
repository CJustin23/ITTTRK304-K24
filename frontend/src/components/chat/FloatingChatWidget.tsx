import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Minimize2,
  ExternalLink,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Tag,
  ArrowRight,
  Loader2,
  Check,
} from 'lucide-react';
import { AiChatService, ChatMessage, ToolConfirmation, AiKeyStatus } from '../../services/aiChatService';
import { useStore } from '../../store/useStore';

export const FloatingChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  
  // BYOK Settings State
  const [keyStatus, setKeyStatus] = useState<AiKeyStatus>({ hasKey: false });
  const [inputKey, setInputKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'GEMINI' | 'OPENAI'>('GEMINI');
  const [keySaveMessage, setKeySaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingKey, setIsSavingKey] = useState(false);

  // Tool Confirmation Loading state
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmedSuccessIds, setConfirmedSuccessIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchCoreData = useStore((state) => state.fetchCoreData);
  const currentUser = useStore((state) => state.currentUser);

  // Khởi tạo phiên trò chuyện và tải lịch sử
  useEffect(() => {
    const cid = AiChatService.getConversationId();
    setConversationId(cid);

    AiChatService.fetchHistory(cid).then((history) => {
      if (history.length > 0) {
        setMessages(history);
      } else {
        // Tin nhắn chào mừng ban đầu
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `Xin chào ${currentUser?.fullName ? currentUser.fullName : 'bạn'}! 👋 Tôi là **Budglee AI Financial Advisor**.\nTôi có thể giúp bạn kiểm tra số dư các ví, xem lịch sử giao dịch, ghi nhanh các khoản thu chi, đánh giá hạn mức ngân sách tháng hoặc giải đáp quy tắc tài chính thông minh (như quy tắc 50/30/20). Bạn cần hỗ trợ gì hôm nay?`,
            timestamp: Date.now(),
          },
        ]);
      }
    });

    AiChatService.getKeyStatus().then(setKeyStatus);
  }, [currentUser]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, statusText, isOpen]);

  // Focus ô nhập khi mở khung chat
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, activeTab]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isStreaming) return;

    setInputText('');
    const userMsgId = 'user_' + Date.now();
    const assistantMsgId = 'assistant_' + (Date.now() + 1);

    // Thêm tin nhắn của người dùng và tin nhắn tạm của trợ lý vào giao diện
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: text, timestamp: Date.now() },
      { id: assistantMsgId, role: 'assistant', content: '', timestamp: Date.now() + 1, isStreaming: true },
    ]);

    setIsStreaming(true);
    setStatusText('Đang xử lý...');

    await AiChatService.streamChat(text, conversationId, {
      onToken: (token) => {
        setStatusText('');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: msg.content + token, isStreaming: true }
              : msg
          )
        );
      },
      onStatus: (status) => {
        setStatusText(status);
      },
      onToolConfirm: (confirmation: ToolConfirmation) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, confirmation, isStreaming: false }
              : msg
          )
        );
      },
      onDone: (cid) => {
        setIsStreaming(false);
        setStatusText('');
        setConversationId(cid);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
          )
        );
      },
      onError: (errMsg) => {
        setIsStreaming(false);
        setStatusText('');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: msg.content || errMsg, isStreaming: false }
              : msg
          )
        );
      },
    });
  };

  const handleResetConversation = () => {
    const newCid = AiChatService.resetConversation();
    setConversationId(newCid);
    setConfirmedSuccessIds(new Set());
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        role: 'assistant',
        content: `Đã làm mới phiên trò chuyện! Bạn có thể đặt câu hỏi mới hoặc chọn các gợi ý bên dưới để bắt đầu:`,
        timestamp: Date.now(),
      },
    ]);
  };

  // Xác nhận thực thi Tool (Human-in-the-loop)
  const handleConfirmTool = async (confirmation: ToolConfirmation) => {
    setConfirmingId(confirmation.confirmationId);
    try {
      const res = await AiChatService.confirmToolAction(confirmation.confirmationId);
      setConfirmedSuccessIds((prev) => new Set([...prev, confirmation.confirmationId]));

      // Tự động làm mới dữ liệu ví và giao dịch trên giao diện chính của Budglee
      if (fetchCoreData) {
        fetchCoreData();
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'confirm_res_' + Date.now(),
          role: 'assistant',
          content: `✅ **Thực thi thành công!** ${res?.message || 'Giao dịch đã được ghi nhận và cập nhật trực tiếp vào số dư ví của bạn.'}`,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'confirm_err_' + Date.now(),
          role: 'assistant',
          content: `❌ **Không thể thực thi:** ${err?.response?.data?.message || err?.message || 'Yêu cầu đã hết hạn hoặc có lỗi xảy ra.'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setConfirmingId(null);
    }
  };

  // Lưu API Key cá nhân
  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setIsSavingKey(true);
    setKeySaveMessage(null);
    try {
      const updated = await AiChatService.saveApiKey(selectedProvider, inputKey.trim());
      setKeyStatus(updated);
      setInputKey('');
      setKeySaveMessage({ type: 'success', text: `Đã lưu và mã hóa an toàn khóa ${selectedProvider} thành công!` });
    } catch (err: any) {
      setKeySaveMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Khóa API không hợp lệ. Vui lòng kiểm tra lại!',
      });
    } finally {
      setIsSavingKey(false);
    }
  };

  // Xóa API Key cá nhân
  const handleDeleteKey = async () => {
    try {
      await AiChatService.deleteApiKey();
      setKeyStatus({ hasKey: false });
      setKeySaveMessage({ type: 'success', text: 'Đã xóa khóa cá nhân. Hệ thống quay về chế độ RAG mặc định.' });
    } catch (err) {}
  };

  // Các câu hỏi gợi ý nhanh chuẩn theo nghiệp vụ Quản lý Tài chính Budglee
  const quickPrompts = [
    { label: '💰 Số dư các ví', text: 'Số dư các ví hiện tại của tôi là bao nhiêu?' },
    { label: '📋 Giao dịch gần đây', text: 'Cho tôi xem lịch sử giao dịch thu chi gần đây' },
    { label: '🎯 Kiểm tra ngân sách', text: 'Kiểm tra ngân sách tháng này xem có khoản nào vượt hạn mức không' },
    { label: '🍔 Ghi chi tiêu ăn trưa 45k', text: 'Tôi vừa chi 45.000đ ăn trưa từ Ví Tiền mặt, hãy ghi chép lại giúp tôi' },
    { label: '🏆 Sức khỏe tài chính', text: 'Đánh giá điểm sức khỏe tài chính của tôi' },
    { label: '💡 Quy tắc 50/30/20', text: 'Quy tắc quản lý tài chính 50/30/20 là gì và áp dụng thế nào?' },
    { label: '👨‍👩‍👧 Sổ quỹ gia đình', text: 'Sổ quỹ gia đình hoạt động như thế nào?' },
    { label: '🔒 Bảo mật dữ liệu', text: 'Dữ liệu tài chính của tôi được bảo mật như thế nào?' },
  ];

  return (
    <>
      {/* 1. Nút tròn Floating Chat Launcher cố định góc dưới bên phải */}
      <div
        style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}
        className="flex items-center gap-3"
      >
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-2xl shadow-xl backdrop-blur-md cursor-pointer border border-slate-700/60 transition-all transform hover:-translate-x-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Hỏi Trợ lý AI</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Mở Trợ lý AI"
          className="relative group p-4 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white transition-transform group-hover:rotate-90" />
          ) : (
            <div className="relative">
              <Sparkles className="w-6 h-6 text-white animate-spin-slow" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border border-white"></span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* 2. Cửa sổ Chat Popover (khoảng 360x520px, responsive trên mobile) */}
      {isOpen && (
        <div
          style={{ position: 'fixed', bottom: '85px', right: '20px', zIndex: 9999 }}
          className="w-[calc(100vw-2.5rem)] sm:w-[360px] h-[520px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          
          {/* Header Cửa sổ Chat */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative p-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-emerald-800"></span>
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight flex items-center gap-1.5">
                  Budglee AI Advisor
                  <span className="text-[10px] bg-white/20 font-semibold px-1.5 py-0.5 rounded-full">Pro</span>
                </h3>
                <p className="text-[11px] text-emerald-100/90">Trợ lý Cố vấn & Hỗ trợ Tài chính</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Tab chuyển đổi Chat và Settings */}
              <button
                onClick={() => setActiveTab(activeTab === 'chat' ? 'settings' : 'chat')}
                className={`p-1.5 rounded-xl transition-colors ${
                  activeTab === 'settings' ? 'bg-white text-emerald-700 shadow-sm' : 'hover:bg-white/15 text-white'
                }`}
                title="Cài đặt khóa API cá nhân (BYOK)"
              >
                <Key className="w-4 h-4" />
              </button>

              <button
                onClick={handleResetConversation}
                className="p-1.5 rounded-xl hover:bg-white/15 text-white transition-colors"
                title="Làm mới cuộc trò chuyện"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/15 text-white transition-colors"
                title="Thu nhỏ cửa sổ"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nội dung Tab Cài đặt (BYOK Settings) */}
          {activeTab === 'settings' ? (
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-4 text-slate-700 text-xs">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <Key className="w-4 h-4" />
                  <span>Cài đặt Khóa API Cá nhân (BYOK)</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Nhập API Key của riêng bạn để sử dụng mô hình AI tốc độ cao và không giới hạn lượt hỏi. Khóa được mã hóa đối xứng an toàn bằng chuẩn **AES-256-GCM**.
                </p>

                {keyStatus.hasKey ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Đang kích hoạt: {keyStatus.provider}
                      </span>
                      <button
                        onClick={handleDeleteKey}
                        className="text-[11px] text-red-600 hover:underline"
                      >
                        Xóa khóa
                      </button>
                    </div>
                    <div className="font-mono text-[11px] text-slate-600">{keyStatus.maskedKey}</div>
                    <div className="text-[10px] text-emerald-700">Mô hình: {keyStatus.modelName || 'gemini-1.5-flash'}</div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Hiện bạn đang dùng bộ dữ liệu RAG tích hợp sẵn. Thêm API Key bên dưới nếu muốn mở rộng trí tuệ nhân tạo nâng cao.</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveKey} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">1. Chọn nhà cung cấp AI</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProvider('GEMINI')}
                      className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                        selectedProvider === 'GEMINI'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Google Gemini
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProvider('OPENAI')}
                      className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                        selectedProvider === 'OPENAI'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      OpenAI (ChatGPT)
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">2. Nhập API Key</label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline flex items-center gap-1 text-[10px]"
                    >
                      Lấy khóa Gemini miễn phí <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder={selectedProvider === 'GEMINI' ? 'AIzaSy...' : 'sk-...'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  />
                </div>

                {keySaveMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-[11px] font-medium flex items-center gap-2 ${
                      keySaveMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {keySaveMessage.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{keySaveMessage.text}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSavingKey || !inputKey.trim()}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSavingKey && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Lưu & Kích hoạt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 font-semibold transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bảo mật AES-256-GCM • Không lưu trữ nhật ký nhạy cảm</span>
              </div>
            </div>
          ) : (
            // Nội dung Tab Chat chính
            <>
              {/* Danh sách tin nhắn */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 text-xs">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200/70 rounded-bl-none'
                        }`}
                      >
                        {/* Hiển thị nội dung văn bản (hỗ trợ xuống dòng và định dạng cơ bản) */}
                        <div className="whitespace-pre-wrap break-words space-y-1">
                          {msg.content}
                          {msg.isStreaming && (
                            <span className="inline-block w-1.5 h-3 bg-emerald-600 animate-pulse ml-1"></span>
                          )}
                        </div>

                        {/* Thẻ xác nhận Giao dịch Thu Chi (Human-in-the-loop) */}
                        {msg.confirmation && (
                          <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/90 to-teal-50/80 border border-emerald-200/90 text-slate-800 space-y-2.5 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                                {msg.confirmation.actionType === 'INCOME' ? (
                                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                                    <ArrowDownRight className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <span>{msg.confirmation.title || 'Xác nhận ghi chép Giao dịch'}</span>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  msg.confirmation.actionType === 'INCOME'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {msg.confirmation.actionType === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-700 bg-white p-3 rounded-xl border border-emerald-100/80 space-y-2 shadow-xs">
                              <div className="flex justify-between items-baseline">
                                <span className="text-slate-400 font-medium">Số tiền:</span>
                                <span
                                  className={`text-sm font-extrabold ${
                                    msg.confirmation.actionType === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                                  }`}
                                >
                                  {msg.confirmation.actionType === 'INCOME' ? '+' : '-'}
                                  {new Intl.NumberFormat('vi-VN').format(msg.confirmation.amount || 0)} ₫
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 flex items-center gap-1">
                                  <Wallet className="w-3 h-3 text-slate-400" /> Ví nguồn:
                                </span>
                                <span className="font-semibold text-slate-800">{msg.confirmation.walletName}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 flex items-center gap-1">
                                  <Tag className="w-3 h-3 text-slate-400" /> Danh mục:
                                </span>
                                <span className="font-medium text-slate-700">{msg.confirmation.categoryName}</span>
                              </div>
                              {msg.confirmation.note && (
                                <div className="pt-1.5 border-t border-slate-100 flex justify-between items-start text-[11px]">
                                  <span className="text-slate-400">Ghi chú:</span>
                                  <span className="italic text-slate-600 text-right max-w-[65%]">{msg.confirmation.note}</span>
                                </div>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 italic px-0.5">{msg.confirmation.description}</p>

                            {confirmedSuccessIds.has(msg.confirmation.confirmationId) ? (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-2 rounded-xl justify-center shadow-xs">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Đã ghi chép thành công vào ví</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => handleConfirmTool(msg.confirmation!)}
                                  disabled={confirmingId === msg.confirmation.confirmationId}
                                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                                >
                                  {confirmingId === msg.confirmation.confirmationId ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                  <span>Xác nhận ghi chép</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setMessages((prev) => [
                                      ...prev,
                                      {
                                        id: 'cancel_' + Date.now(),
                                        role: 'assistant',
                                        content: 'Đã hủy thao tác ghi chép theo yêu cầu của bạn.',
                                        timestamp: Date.now(),
                                      },
                                    ]);
                                  }}
                                  className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-xs transition-colors"
                                >
                                  Hủy bỏ
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}

                {/* Trạng thái AI đang suy nghĩ / RAG search */}
                {statusText && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50/70 border border-emerald-100 px-3 py-1.5 rounded-xl w-fit animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                    <span>{statusText}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Gợi ý câu hỏi nhanh (Quick Prompts) */}
              <div className="px-3 pt-2 pb-1 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.text)}
                    disabled={isStreaming}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200/60 text-[11px] font-medium transition-all shrink-0 active:scale-95 disabled:opacity-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Khung nhập tin nhắn */}
              <div className="p-3 bg-white border-t border-slate-100">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Hỏi về ví, thu chi, chính sách..."
                    disabled={isStreaming}
                    className="flex-1 bg-slate-100/80 hover:bg-slate-100 focus:bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs text-slate-800 placeholder-slate-400 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isStreaming || !inputText.trim()}
                    className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white disabled:opacity-40 transition-all shadow-md shrink-0"
                  >
                    {isStreaming ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

