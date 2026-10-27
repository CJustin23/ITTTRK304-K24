import React from 'react';
import { Sparkles, X, CheckCircle, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import { HabitRecommendation } from '../types';

interface BotInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: HabitRecommendation | null;
}

export const BotInsightModal: React.FC<BotInsightModalProps> = ({
  isOpen,
  onClose,
  recommendation,
}) => {
  if (!isOpen) return null;

  const defaultAdvice = {
    status: 'WARNING',
    primaryAdvice:
      'Tháng này chi tiêu cho Ăn uống và Cà phê đã tăng 22% so với tháng trước. Tỷ lệ tiết kiệm hiện tại chỉ đạt 18% (mục tiêu: 25%).',
    actionItems: [
      'Cắt giảm số lần ăn ngoài cuối tuần, ưu tiên tự nấu tại gia đình.',
      'Tạm dừng các đăng ký dịch vụ streaming chưa sử dụng thường xuyên.',
      'Trích lập ngay 3.000.000 ₫ sang Mục tiêu Tiết kiệm (Saving Goal).',
    ],
    categoryWarnings: [
      {
        categoryName: 'Ăn uống ngoài & Nhà hàng',
        increasePercentage: 24.8,
        recommendation: 'Giới hạn mức tiêu tối đa 200.000 ₫/ngày trong 7 ngày tới.',
      },
      {
        categoryName: 'Mua sắm & Quần áo',
        increasePercentage: 15.2,
        recommendation: 'Trì hoãn việc mua sắm không khẩn cấp sang kỳ sau.',
      },
    ],
  };

  const data = recommendation || defaultAdvice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header with AI Gradient */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Budglee AI Financial Advisor</h3>
              <p className="text-xs text-emerald-100 mt-0.5">Phân tích thói quen chi tiêu thông minh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Primary Assessment */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold mb-1">Đánh giá chung:</p>
              <p className="leading-relaxed text-amber-800">{data.primaryAdvice}</p>
            </div>
          </div>

          {/* Category Warnings */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span>Hạng mục tăng đột biến</span>
            </h4>
            <div className="space-y-2.5">
              {data.categoryWarnings.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.categoryName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.recommendation}</p>
                  </div>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
                    +{item.increasePercentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-600" />
              <span>Khuyến nghị tối ưu tuần này</span>
            </h4>
            <ul className="space-y-2">
              {data.actionItems.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20"
          >
            Đã hiểu & Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};
