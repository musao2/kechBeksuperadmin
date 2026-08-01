import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, trend, color = 'emerald' }) {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50/60',
      border: 'border-emerald-200/80',
      iconBg: 'bg-emerald-100 text-[#0f7b4c]',
      accent: 'text-[#0f7b4c]'
    },
    blue: {
      bg: 'bg-blue-50/60',
      border: 'border-blue-200/80',
      iconBg: 'bg-blue-100 text-blue-600',
      accent: 'text-blue-600'
    },
    purple: {
      bg: 'bg-purple-50/60',
      border: 'border-purple-200/80',
      iconBg: 'bg-purple-100 text-purple-600',
      accent: 'text-purple-600'
    },
    amber: {
      bg: 'bg-amber-50/60',
      border: 'border-amber-200/80',
      iconBg: 'bg-amber-100 text-amber-600',
      accent: 'text-amber-600'
    }
  };

  const theme = colorMap[color] || colorMap.emerald;

  return (
    <div className="p-4 sm:p-4.5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">
          {title}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${theme.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2 mb-1">
        <h3 className="text-lg sm:text-xl xl:text-[22px] font-extrabold text-slate-900 tracking-tight leading-snug">
          {value}
        </h3>
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-slate-500 font-medium flex items-center gap-1.5 truncate">
          {trend && <span className="font-semibold text-emerald-600 shrink-0">{trend}</span>}
          <span className="truncate">{subtext}</span>
        </p>
      )}
    </div>
  );
}
