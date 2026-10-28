import React from 'react';
import { Utensils, ShoppingBag, Car, HeartPulse, Receipt, Edit2 } from 'lucide-react';

interface CategoryListProps {
  categories: Record<string, number>;
  onEdit?: () => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({ categories, onEdit }) => {
  const getCategoryIcon = (name: string) => {
    if (name.includes('Ăn uống') || name.includes('Food')) return Utensils;
    if (name.includes('Mua sắm') || name.includes('Shopping')) return ShoppingBag;
    if (name.includes('Di chuyển') || name.includes('Travel')) return Car;
    if (name.includes('Sức khỏe') || name.includes('Health')) return HeartPulse;
    return Receipt;
  };

  const getCategoryColor = (name: string) => {
    if (name.includes('Ăn uống')) return 'bg-amber-100 text-amber-700';
    if (name.includes('Mua sắm')) return 'bg-rose-100 text-rose-700';
    if (name.includes('Di chuyển')) return 'bg-blue-100 text-blue-700';
    if (name.includes('Sức khỏe')) return 'bg-emerald-100 text-emerald-700';
    return 'bg-purple-100 text-purple-700';
  };

  const entries = Object.entries(categories);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Hạng mục chi tiêu</h3>
          <p className="text-xs text-slate-500 mt-0.5">Tỷ trọng chi tiêu theo từng danh mục</p>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
      </div>

      <div className="space-y-3">
        {entries.map(([name, amount]) => {
          const Icon = getCategoryIcon(name);
          const colorClass = getCategoryColor(name);
          return (
            <div
              key={name}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700">{name}</span>
              </div>
              <span className="text-sm font-bold text-slate-800">
                {new Intl.NumberFormat('vi-VN').format(amount)} ₫
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
