import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useStore } from '../store/useStore';
import { Timeframe, Transaction } from '../types';
import { DashboardService } from '../services/api';

interface ChartSectionProps {
  data?: { label: string; amount: number }[];
}

const parseTxDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
};

export const calculateTrendsFromTransactions = (
  timeframe: Timeframe,
  transactions: Transaction[]
): { label: string; amount: number }[] => {
  const expenseTxs = transactions.filter(
    (t) => t.transactionType === 'EXPENSE' && t.amount > 0
  );

  switch (timeframe) {
    case 'Daily': {
      // Nhóm theo các thứ trong tuần: Thứ 2 -> Chủ nhật
      const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
      const map: Record<string, number> = {
        'Thứ 2': 0,
        'Thứ 3': 0,
        'Thứ 4': 0,
        'Thứ 5': 0,
        'Thứ 6': 0,
        'Thứ 7': 0,
        'Chủ nhật': 0,
      };

      expenseTxs.forEach((t) => {
        const d = parseTxDate(t.transactionDate);
        if (d) {
          const jsDay = d.getDay(); // 0: Chủ nhật, 1: Thứ 2, ..., 6: Thứ 7
          const label = jsDay === 0 ? 'Chủ nhật' : `Thứ ${jsDay + 1}`;
          map[label] = (map[label] || 0) + t.amount;
        }
      });

      return dayLabels.map((label) => ({ label, amount: map[label] || 0 }));
    }

    case 'Weekly': {
      // Phân chia 4 tuần trong tháng: Tuần 1 (1-7), Tuần 2 (8-14), Tuần 3 (15-21), Tuần 4 (22-hết tháng)
      const weekLabels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
      const map: Record<string, number> = {
        'Tuần 1': 0,
        'Tuần 2': 0,
        'Tuần 3': 0,
        'Tuần 4': 0,
      };

      expenseTxs.forEach((t) => {
        const d = parseTxDate(t.transactionDate);
        if (d) {
          const day = d.getDate();
          if (day <= 7) map['Tuần 1'] = (map['Tuần 1'] || 0) + t.amount;
          else if (day <= 14) map['Tuần 2'] = (map['Tuần 2'] || 0) + t.amount;
          else if (day <= 21) map['Tuần 3'] = (map['Tuần 3'] || 0) + t.amount;
          else map['Tuần 4'] = (map['Tuần 4'] || 0) + t.amount;
        }
      });

      return weekLabels.map((label) => ({ label, amount: map[label] || 0 }));
    }

    case 'Monthly': {
      // 4 tháng gần nhất tính tới thời điểm hiện tại
      const now = new Date();
      const months: { label: string; year: number; month: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: `Tháng ${d.getMonth() + 1}`,
          year: d.getFullYear(),
          month: d.getMonth() + 1,
        });
      }

      return months.map((m) => {
        const total = expenseTxs
          .filter((t) => {
            const d = parseTxDate(t.transactionDate);
            return d && d.getFullYear() === m.year && d.getMonth() + 1 === m.month;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        return { label: m.label, amount: total };
      });
    }

    case 'Yearly': {
      // 4 năm gần nhất
      const curYear = new Date().getFullYear();
      const years = [curYear - 3, curYear - 2, curYear - 1, curYear];

      return years.map((y) => {
        const total = expenseTxs
          .filter((t) => {
            const d = parseTxDate(t.transactionDate);
            return d && d.getFullYear() === y;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        return { label: y.toString(), amount: total };
      });
    }

    case 'Custom': {
      // Nhóm theo các mốc ngày giao dịch thực tế
      const dateMap: Record<string, number> = {};
      expenseTxs.forEach((t) => {
        const d = parseTxDate(t.transactionDate);
        if (d) {
          const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
          dateMap[key] = (dateMap[key] || 0) + t.amount;
        }
      });

      const dates = Object.keys(dateMap);
      if (dates.length > 0) {
        return dates.slice(-7).map((d) => ({ label: d, amount: dateMap[d] }));
      }

      const now = new Date();
      return [4, 3, 2, 1, 0].map((daysAgo) => {
        const d = new Date(now);
        d.setDate(d.getDate() - daysAgo * 2);
        return {
          label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
          amount: 0,
        };
      });
    }

    default:
      return [];
  }
};

export const ChartSection: React.FC<ChartSectionProps> = ({ data }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('Monthly');
  const { recentTransactions, token } = useStore();
  const [apiTrends, setApiTrends] = useState<Record<string, { label: string; amount: number }[]>>({});

  const tabs: Timeframe[] = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'];

  // Gọi API /dashboard/trends từ backend khi chuyển tab nếu có token
  useEffect(() => {
    let isMounted = true;
    const fetchApiTrends = async () => {
      if (!token) return;
      try {
        const res = await DashboardService.getTrends(timeframe.toUpperCase());
        if (isMounted && Array.isArray(res) && res.length > 0 && res.some((p) => p.amount > 0)) {
          setApiTrends((prev) => ({ ...prev, [timeframe]: res }));
        }
      } catch (err) {
        // Fallback tự động sang tính toán từ recentTransactions
      }
    };
    fetchApiTrends();
    return () => {
      isMounted = false;
    };
  }, [timeframe, token, recentTransactions.length]);

  const hasExpenses = recentTransactions.some((t) => t.transactionType === 'EXPENSE');

  // Tính toán dữ liệu biểu đồ hoàn toàn động từ giao dịch thực tế
  const activeData = useMemo(() => {
    // 1. Ưu tiên dữ liệu từ API thật nếu có điểm dữ liệu > 0
    if (apiTrends[timeframe] && apiTrends[timeframe].length > 0 && apiTrends[timeframe].some((p) => p.amount > 0)) {
      return apiTrends[timeframe];
    }
    // 2. Dữ liệu ban đầu nếu là Weekly và được truyền từ dashboardSummary
    if (timeframe === 'Weekly' && data && data.length > 0 && data.some((p) => p.amount > 0)) {
      return data;
    }
    // 3. Tính toán trực tiếp theo các giao dịch thực tế
    return calculateTrendsFromTransactions(timeframe, recentTransactions);
  }, [timeframe, apiTrends, data, recentTransactions]);

  // Nhãn khoảng thời gian động cho tab Custom
  const customRangeLabel = useMemo(() => {
    const dates = recentTransactions
      .map((t) => parseTxDate(t.transactionDate))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length > 0) {
      const min = dates[0];
      const max = dates[dates.length - 1];
      const fmt = (d: Date) =>
        `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      return `${fmt(min)} – ${fmt(max)}`;
    }

    const now = new Date();
    const past14 = new Date(now);
    past14.setDate(now.getDate() - 14);
    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    return `${fmt(past14)} – ${fmt(now)}`;
  }, [recentTransactions]);

  const formatTooltipValue = (value: number) => {
    return [new Intl.NumberFormat('vi-VN').format(value) + ' ₫', 'Tổng chi tiêu'];
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Biến động chi tiêu (Total Spent)</h3>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center flex-wrap gap-1">
            <span>Dòng tiền chi tiêu theo mốc:</span>
            <span className="font-semibold text-emerald-600">{timeframe}</span>
            {timeframe === 'Custom' && (
              <span className="ml-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                {customRangeLabel}
              </span>
            )}
            {!hasExpenses && (
              <span className="text-slate-400 italic ml-2">• Chưa có giao dịch chi tiêu</span>
            )}
          </p>
        </div>

        {/* Timeframe Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setTimeframe(tab)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                timeframe === tab
                  ? 'bg-white text-emerald-600 shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              formatter={formatTooltipValue}
              contentStyle={{
                backgroundColor: '#1e293b',
                borderRadius: '0.75rem',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#spentGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
