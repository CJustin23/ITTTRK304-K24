import React from 'react';
import { Sparkles, X, Clock, Bot, Wrench, ArrowRight } from 'lucide-react';
import { HabitRecommendation } from '../types';

interface BotInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation?: HabitRecommendation | null;
}

export const BotInsightModal: React.FC<BotInsightModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header with AI Gradient */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Budglee AI Financial Advisor</h3>
              <p className="text-xs text-emerald-100 mt-0.5">Trợ lý Cố vấn Tài chính Thông minh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Đang phát triển */}
        <div className="p-8 text-center space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-100 via-teal-50 to-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
              <Bot className="w-10 h-10 animate-bounce" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-amber-500 text-white shadow-md">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Tính năng đang được phát triển</span>
            </div>
            <h4 className="text-xl font-black text-slate-800 tracking-tight">
              Sắp ra mắt phiên bản AI Chatbot!
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Phân hệ Trợ lý AI Cố vấn Tài chính đang được đội ngũ kỹ thuật hoàn thiện mô hình phân tích dữ liệu và tương tác 2 chiều. Tính năng sẽ sớm được cập nhật trong các phiên bản tiếp theo.
            </p>
          </div>

          {/* Planned capabilities */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2.5 text-xs text-slate-600">
            <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Dự kiến bao gồm:
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Chatbot hỏi đáp tình hình thu chi và số dư ví thời gian thực</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Tự động phát hiện bất thường và cảnh báo nguy cơ vượt hạn mức</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Đề xuất lộ trình tiết kiệm cá nhân hóa cho từng hộ gia đình</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
