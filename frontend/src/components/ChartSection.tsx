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

      const now = new Date();
      // Xác định khoảng thời gian tuần hiện tại (từ Thứ 2 đến Chủ nhật)
      const currentDay = now.getDay(); // 0: Chủ nhật, 1: Thứ 2...
      const diffToMonday = (currentDay + 6) % 7;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 86400000);

      // Lọc các giao dịch trong tuần hiện tại
      const thisWeekTxs = expenseTxs.filter((t) => {
        const d = parseTxDate(t.transactionDate);
        return d && d >= startOfWeek && d < endOfWeek;
      });

      // Nếu trong tuần hiện tại có giao dịch, dùng tuần này; nếu chưa đủ, lấy các giao dịch trong 7 ngày gần nhất
      let txsForDaily = thisWeekTxs;
      if (txsForDaily.length === 0) {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
        const recentTxs = expenseTxs.filter((t) => {
          const d = parseTxDate(t.transactionDate);
          return d && d >= sevenDaysAgo;
        });
        txsForDaily = recentTxs.length > 0 ? recentTxs : expenseTxs;
      }

      txsForDaily.forEach((t) => {
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

      const now = new Date();
      const currentMonthTxs = expenseTxs.filter((t) => {
        const d = parseTxDate(t.transactionDate);
        return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const txsForWeekly = currentMonthTxs.length > 0 ? currentMonthTxs : expenseTxs;

      txsForWeekly.forEach((t) => {
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
      // Sắp xếp các mốc ngày giao dịch thực tế theo thứ tự thời gian tăng dần
      const dateMap: Record<string, { label: string; dateObj: Date; amount: number }> = {};
      expenseTxs.forEach((t) => {
        const d = parseTxDate(t.transactionDate);
        if (d) {
          const pad = (n: number) => String(n).padStart(2, '0');
          const isoKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
          const displayLabel = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
          if (!dateMap[isoKey]) {
            dateMap[isoKey] = { label: displayLabel, dateObj: d, amount: 0 };
          }
          dateMap[isoKey].amount += t.amount;
        }
      });

      const sortedIsoKeys = Object.keys(dateMap).sort();
      if (sortedIsoKeys.length > 0) {
        return sortedIsoKeys.slice(-14).map((k) => ({
          label: dateMap[k].label,
          amount: dateMap[k].amount,
        }));
      }

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      return [6, 5, 4, 3, 2, 1, 0].map((daysAgo) => {
        const d = new Date(now);
        d.setDate(d.getDate() - daysAgo);
        return {
          label: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`,
          amount: 0,
        };
      });
    }

    default:
      return [];
  }
};

export const ChartSection: React.FC<ChartSectionProps> = ({ data }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('Custom');
  const { recentTransactions, token } = useStore();
  const [apiTrends, setApiTrends] = useState<Record<string, { label: string; amount: number }[]>>({});

  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(lastDay)}`;
  });

  const tabs: Timeframe[] = ['Custom', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

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
    if (timeframe === 'Custom') {
      const expenseTxs = recentTransactions.filter(
        (t) => t.transactionType === 'EXPENSE' && t.amount > 0
      );

      // Phân tách ngày bắt đầu và kết thúc theo local để tránh lệch múi giờ UTC
      let sYear = 2026, sMonth = 11, sDay = 1;
      let eYear = 2026, eMonth = 11, eDay = 30;

      if (customStartDate) {
        const parts = customStartDate.split('-').map(Number);
        if (parts.length === 3 && parts.every((n) => !isNaN(n))) [sYear, sMonth, sDay] = parts;
      }
      if (customEndDate) {
        const parts = customEndDate.split('-').map(Number);
        if (parts.length === 3 && parts.every((n) => !isNaN(n))) [eYear, eMonth, eDay] = parts;
      }

      let startDate = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
      let endDate = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);

      if (startDate > endDate) {
        const tmp = startDate;
        startDate = endDate;
        endDate = tmp;
      }

      const pad = (n: number) => String(n).padStart(2, '0');

      // Gom tổng chi tiêu theo từng ngày chuẩn YYYY-MM-DD
      const dateAmountMap: Record<string, number> = {};
      expenseTxs.forEach((t) => {
        const d = parseTxDate(t.transactionDate);
        if (d && d >= startDate && d <= endDate) {
          const isoKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
          dateAmountMap[isoKey] = (dateAmountMap[isoKey] || 0) + t.amount;
        }
      });

      const points: { label: string; fullDate: string; amount: number }[] = [];
      const cur = new Date(startDate);
      cur.setHours(0, 0, 0, 0);
      const endLimit = new Date(endDate);
      endLimit.setHours(0, 0, 0, 0);

      // Tạo chuỗi ngày liên tục theo đúng thứ tự thời gian từ bắt đầu tới kết thúc
      while (cur <= endLimit) {
        const isoKey = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`;
        const displayLabel = `${pad(cur.getDate())}/${pad(cur.getMonth() + 1)}`;
        const fullDateLabel = `${pad(cur.getDate())}/${pad(cur.getMonth() + 1)}/${cur.getFullYear()}`;

        points.push({
          label: displayLabel,
          fullDate: fullDateLabel,
          amount: dateAmountMap[isoKey] || 0,
        });

        cur.setDate(cur.getDate() + 1);
      }

      return points.length > 0 ? points : [{ label: 'Không có dữ liệu', fullDate: '', amount: 0 }];
    }

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
  }, [timeframe, apiTrends, data, recentTransactions, customStartDate, customEndDate]);

  // Nhãn khoảng thời gian động cho tab Custom
  const customRangeLabel = useMemo(() => {
    if (customStartDate && customEndDate) {
      const s = customStartDate.split('-').reverse().join('/');
      const e = customEndDate.split('-').reverse().join('/');
      return `${s} – ${e}`;
    }
    return '';
  }, [customStartDate, customEndDate]);

  // Tổng chi tiêu trong khoảng thời gian đang lọc
  const totalPeriodSpent = useMemo(() => {
    return activeData.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [activeData]);

  const handlePreset = (type: '7days' | '30days' | 'thisMonth') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    if (type === '7days') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 6);
      setCustomStartDate(`${past7.getFullYear()}-${pad(past7.getMonth() + 1)}-${pad(past7.getDate())}`);
      setCustomEndDate(todayStr);
    } else if (type === '30days') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 29);
      setCustomStartDate(`${past30.getFullYear()}-${pad(past30.getMonth() + 1)}-${pad(past30.getDate())}`);
      setCustomEndDate(todayStr);
    } else if (type === 'thisMonth') {
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      setCustomStartDate(`${startMonth.getFullYear()}-${pad(startMonth.getMonth() + 1)}-01`);
      setCustomEndDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(lastDay)}`);
    }
  };

  const activePreset = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const past7 = new Date();
    past7.setDate(now.getDate() - 6);
    const past7Str = `${past7.getFullYear()}-${pad(past7.getMonth() + 1)}-${pad(past7.getDate())}`;

    const past30 = new Date();
    past30.setDate(now.getDate() - 29);
    const past30Str = `${past30.getFullYear()}-${pad(past30.getMonth() + 1)}-${pad(past30.getDate())}`;

    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const startMonthStr = `${startMonth.getFullYear()}-${pad(startMonth.getMonth() + 1)}-01`;
    const endMonthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(lastDay)}`;

    if (customStartDate === past7Str && customEndDate === todayStr) return '7days';
    if (customStartDate === past30Str && customEndDate === todayStr) return '30days';
    if (customStartDate === startMonthStr && (customEndDate === endMonthStr || customEndDate === todayStr)) return 'thisMonth';

    return 'custom';
  }, [customStartDate, customEndDate]);

  const formatTooltipValue = (value: number) => {
    return [new Intl.NumberFormat('vi-VN').format(value) + ' ₫', 'Tổng chi tiêu'];
  };

  const formatYAxisTick = (v: number) => {
    if (v >= 1000000) {
      const m = v / 1000000;
      return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
    }
    if (v >= 1000) {
      return `${Math.round(v / 1000)}k`;
    }
    return `${v}`;
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Biến động chi tiêu (Total Spent)</h3>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center flex-wrap gap-1.5">
            <span>Dòng tiền chi tiêu theo mốc:</span>
            <span className="font-semibold text-emerald-600">{timeframe}</span>
            {timeframe === 'Custom' && (
              <>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                  {customRangeLabel}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Tổng chi: {new Intl.NumberFormat('vi-VN').format(totalPeriodSpent)} ₫
                </span>
              </>
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

      {/* Custom Date Range Picker */}
      {timeframe === 'Custom' && (
        <div className="flex flex-wrap items-center gap-3 mb-5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span>Từ ngày:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span>Đến ngày:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer shadow-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => handlePreset('7days')}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm ${
                activePreset === '7days'
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              7 ngày
            </button>
            <button
              type="button"
              onClick={() => handlePreset('30days')}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm ${
                activePreset === '30days'
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              30 ngày
            </button>
            <button
              type="button"
              onClick={() => handlePreset('thisMonth')}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm ${
                activePreset === 'thisMonth'
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Tháng này
            </button>
          </div>
        </div>
      )}

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
              tick={{ fill: '#64748b', fontSize: 11 }}
              minTickGap={24}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={formatYAxisTick}
            />
            <Tooltip
              formatter={formatTooltipValue}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload;
                if (item?.fullDate) {
                  return `Ngày ${item.fullDate}`;
                }
                return `Thời gian: ${label}`;
              }}
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
