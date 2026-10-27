import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  amount: number;
  currency?: string;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'blue' | 'rose' | 'amber';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  currency = '₫',
  subtext,
  icon: Icon,
  variant = 'emerald',
  trend,
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
            {formattedAmount} <span className="text-lg font-semibold text-slate-500">{currency}</span>
          </h3>
        </div>
        <div className={`p-3 rounded-xl border ${variantStyles[variant]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {(subtext || trend) && (
        <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
          {subtext && <span className="text-slate-500">{subtext}</span>}
          {trend && (
            <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
