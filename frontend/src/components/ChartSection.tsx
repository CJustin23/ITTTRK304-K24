import React, { useState } from 'react';
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
import { Timeframe } from '../types';

interface ChartSectionProps {
  data?: { label: string; amount: number }[];
}

export const ChartSection: React.FC<ChartSectionProps> = ({ data }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('Monthly');
  const { currentUser, recentTransactions } = useStore();

  const tabs: Timeframe[] = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'];

  // Dữ liệu mẫu theo các mốc thời gian dành cho Demo
  const demoDatasets: Record<Timeframe, { label: string; amount: number }[]> = {
    Daily: [
      { label: 'Thứ 2', amount: 1200000 },
      { label: 'Thứ 3', amount: 2450000 },
      { label: 'Thứ 4', amount: 850000 },
      { label: 'Thứ 5', amount: 3100000 },
      { label: 'Thứ 6', amount: 1950000 },
      { label: 'Thứ 7', amount: 3500000 },
      { label: 'Chủ nhật', amount: 1200000 },
    ],
    Weekly: [
      { label: 'Tuần 1', amount: 4500000 },
      { label: 'Tuần 2', amount: 5200000 },
      { label: 'Tuần 3', amount: 3800000 },
      { label: 'Tuần 4', amount: 4100000 },
    ],
    Monthly: [
      { label: 'Tháng 7', amount: 12500000 },
      { label: 'Tháng 8', amount: 13800000 },
      { label: 'Tháng 9', amount: 15200000 },
      { label: 'Tháng 10', amount: 14250000 },
    ],
    Yearly: [
      { label: '2023', amount: 120000000 },
      { label: '2024', amount: 155000000 },
      { label: '2025', amount: 170000000 },
      { label: '2026', amount: 142500000 },
    ],
    Custom: [
      { label: '15/10', amount: 1850000 },
      { label: '18/10', amount: 2400000 },
      { label: '21/10', amount: 950000 },
      { label: '24/10', amount: 3200000 },
      { label: '28/10', amount: 1450000 },
    ],
  };

  const isDemo = currentUser?.email.toLowerCase() === 'demo@budglee.com';
  const hasExpenses = recentTransactions.some((t) => t.transactionType === 'EXPENSE');

  // Tài khoản Demo hiển thị dữ liệu demo; tài khoản thường nếu chưa có chi tiêu thì để 0
  const activeData = isDemo
    ? (demoDatasets[timeframe] || data || [])
    : hasExpenses
    ? (demoDatasets[timeframe] || data || [])
    : [
        { label: 'Thứ 2', amount: 0 },
        { label: 'Thứ 3', amount: 0 },
        { label: 'Thứ 4', amount: 0 },
        { label: 'Thứ 5', amount: 0 },
        { label: 'Thứ 6', amount: 0 },
        { label: 'Thứ 7', amount: 0 },
        { label: 'Chủ nhật', amount: 0 },
      ];

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
                15/10/2026 – 28/10/2026
              </span>
            )}
            {!hasExpenses && !isDemo && (
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
