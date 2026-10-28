import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  PieChart as PieIcon,
  DollarSign,
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const InsightsView: React.FC = () => {
  const { botRecommendation, setBotModalOpen } = useStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setBotModalOpen(true);
    }, 800);
  };

  const categoryComparisons = [
    {
      name: 'Ăn uống & Cà phê',
      current: 5600000,
      previous: 4480000,
      changePercent: 24.8,
      status: 'INCREASE',
      alert: 'Tăng cao hơn 20% so với định mức trung bình',
    },
    {
      name: 'Mua sắm & Quần áo',
      current: 3450000,
      previous: 2990000,
      changePercent: 15.2,
      status: 'INCREASE',
      alert: 'Có dấu hiệu vượt hạn mức đề xuất',
    },
    {
      name: 'Di chuyển & Xăng xe',
      current: 1800000,
      previous: 1960000,
      changePercent: -8.2,
      status: 'DECREASE',
      alert: 'Đã tối ưu tốt hơn tháng trước',
    },
    {
      name: 'Hóa đơn & Tiện ích',
      current: 2400000,
      previous: 2350000,
      changePercent: 2.1,
      status: 'STABLE',
      alert: 'Duy trì ổn định',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Phân tích Chuyên sâu & Trợ lý AI (Insights)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              AI Engine v1.0
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Phân tích tỷ trọng chi tiêu so với tháng trước và đề xuất thói quen tài chính tối ưu
          </p>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Đang phân tích...' : 'Chạy chẩn đoán AI'}</span>
        </button>
      </div>

      {/* Primary AI Health Score & Verdict Card */}
      <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Health Score */}
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-white/10"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-emerald-400"
                  strokeDasharray="289"
                  strokeDashoffset="52"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black">82</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">/ 100</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Điểm sức khỏe tài chính
              </span>
              <h3 className="text-xl font-bold mt-1">Khá tốt (On Track)</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Tỷ lệ tiết kiệm đạt 18%. Cần điều chỉnh giảm 7% chi tiêu linh hoạt để cán mốc mục tiêu 25%.
              </p>
            </div>
          </div>

          {/* AI Observation */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Khuyến nghị từ Budglee AI Bot</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {botRecommendation?.primaryAdvice ||
                'Tháng này chi tiêu cho Ăn uống và Mua sắm đã tăng 22% so với tháng trước. Tỷ lệ tiết kiệm hiện tại đạt 18% (mục tiêu đề xuất: 25%).'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                Ăn uống ngoài: Cần giới hạn
              </span>
              <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                Mục tiêu tiết kiệm: Đúng tiến độ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Grid: This Month vs Last Month */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              So sánh biến động chi tiêu theo danh mục
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tỷ trọng chi tiêu tháng 10/2026 so với tháng 09/2026
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
            So sánh cùng kỳ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryComparisons.map((cat) => {
            const isIncrease = cat.status === 'INCREASE';
            return (
              <div
                key={cat.name}
                className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                  <span
                    className={`flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-md ${
                      isIncrease
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isIncrease ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    <span>{cat.changePercent > 0 ? `+${cat.changePercent}%` : `${cat.changePercent}%`}</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Tháng này:</span>
                    <span className="font-bold text-slate-800">
                      {new Intl.NumberFormat('vi-VN').format(cat.current)} ₫
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Tháng trước:</span>
                    <span>{new Intl.NumberFormat('vi-VN').format(cat.previous)} ₫</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 leading-snug">
                  {cat.alert}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Kế hoạch hành động cụ thể</h3>
              <p className="text-xs text-slate-500">3 giải pháp giúp tiết kiệm thêm 2.500.000 ₫ trong tuần này</p>
            </div>
          </div>

          <div className="space-y-3">
            {botRecommendation?.actionItems.map((action, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 hover:border-emerald-200 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">{action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 50/30/20 Rule Benchmark */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Quy tắc phân bổ 50/30/20</h3>
              <p className="text-xs text-slate-500">Đối chiếu cấu trúc dòng tiền thực tế với chuẩn tài chính</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Nhu cầu thiết yếu (Needs - Mục tiêu 50%)</span>
                <span className="text-slate-900 font-bold">52.4%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '52.4%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Mong muốn cá nhân (Wants - Mục tiêu 30%)</span>
                <span className="text-rose-600 font-bold">29.6%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '29.6%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Tích lũy & Đầu tư (Savings - Mục tiêu 20%)</span>
                <span className="text-emerald-600 font-bold">18.0%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '18.0%' }}></div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-800 leading-relaxed font-medium">
            💡 Bạn đang làm rất tốt trong việc kiểm soát các mong muốn cá nhân (dưới 30%). Hãy duy trì và tăng thêm 2% vào quỹ tiết kiệm khẩn cấp!
          </div>
        </div>
      </div>
    </div>
  );
};
