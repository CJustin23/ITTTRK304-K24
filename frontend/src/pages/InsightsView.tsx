import React from 'react';
import {
  Sparkles,
  Clock,
  Bot,
  Wrench,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  BrainCircuit,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const InsightsView: React.FC = () => {
  const { setBotModalOpen } = useStore();

  const roadmapItems = [
    {
      icon: MessageSquare,
      title: 'Chatbot Cố vấn Tài chính 2 chiều',
      desc: 'Tương tác hỏi - đáp bằng ngôn ngữ tự nhiên: "Tháng này tôi tiêu nhiều vào cái gì?", "Làm sao để tiết kiệm 3 triệu?"...',
      status: 'Đang huấn luyện mô hình LLM',
    },
    {
      icon: AlertTriangle,
      title: 'Dự báo & Cảnh báo Bội chi sớm',
      desc: 'Thuật toán Machine Learning nhận diện xu hướng chi tiêu bất thường trước khi bạn chạm ngưỡng ngân sách.',
      status: 'Đang tích hợp thuật toán',
    },
    {
      icon: Lightbulb,
      title: 'Khuyến nghị Tối ưu Chi phí Hộ Gia đình',
      desc: 'Phân tích các khoản chi trùng lặp, dịch vụ định kỳ không sử dụng và gợi ý phân bổ dòng tiền thông minh.',
      status: 'Đang thử nghiệm nội bộ',
    },
    {
      icon: ShieldCheck,
      title: 'Bảo mật & Ẩn danh Dữ liệu Cá nhân',
      desc: 'Toàn bộ dữ liệu tài chính được mã hóa đầu cuối (E2EE), đảm bảo sự riêng tư tuyệt đối cho gia đình bạn.',
      status: 'Đã hoàn tất kiến trúc',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Phân tích Chuyên sâu & Trợ lý AI (Insights)
            </h2>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Đang phát triển (Beta)</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Hệ thống trí tuệ nhân tạo hỗ trợ cố vấn tài chính cá nhân và tối ưu hóa ngân sách gia đình
          </p>
        </div>

        <button
          onClick={() => setBotModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>Xem thông tin AI Bot</span>
        </button>
      </div>

      {/* Main Under Development Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 text-white shadow-xl border border-slate-700/60 text-center">
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="relative mx-auto w-24 h-24">
            <div className="w-24 h-24 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <BrainCircuit className="w-12 h-12" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-2 rounded-2xl bg-amber-500 text-white shadow-md">
              <Wrench className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Clock className="w-4 h-4" />
              <span>Tính năng đang được phát triển</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Trợ lý Cố vấn Tài chính AI sắp ra mắt
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Phân hệ Phân tích Chuyên sâu và Chatbot AI đang trong giai đoạn huấn luyện mô hình và tích hợp thuật toán xử lý dữ liệu dòng tiền. Chúng tôi sẽ mang đến trải nghiệm cố vấn tài chính thông minh nhất trong bản cập nhật kế tiếp!
            </p>
          </div>
        </div>

        {/* Ambient glow backgrounds */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Roadmap & Feature Preview Grid */}
      <div className="space-y-4">
        <h4 className="text-base font-bold text-slate-800">
          Lộ trình phát triển tính năng AI (Development Roadmap)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roadmapItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-start gap-4"
              >
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h5 className="text-base font-bold text-slate-800">{item.title}</h5>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
