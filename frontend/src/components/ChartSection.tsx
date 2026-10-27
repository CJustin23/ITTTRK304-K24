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

interface ChartSectionProps {
  data: { label: string; amount: number }[];
}

export const ChartSection: React.FC<ChartSectionProps> = ({ data }) => {
  const [timeframe, setTimeframe] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Monthly');

  const tabs: ('Daily' | 'Weekly' | 'Monthly' | 'Yearly')[] = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

  const formatTooltipValue = (value: number) => {
    return [new Intl.NumberFormat('vi-VN').format(value) + ' ₫', 'Tổng chi tiêu'];
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Biến động chi tiêu (Total Spent)</h3>
          <p className="text-xs text-slate-500 mt-0.5">Theo dõi dòng tiền chi tiêu thực tế qua các mốc thời gian</p>
        </div>

        {/* Timeframe Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setTimeframe(tab)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === tab
                  ? 'bg-white text-emerald-600 shadow-sm'
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
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
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
