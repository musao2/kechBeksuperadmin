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
    <div className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </h3>
      </div>

      {subtext && (
        <p className="mt-2 text-xs text-slate-500 font-medium flex items-center gap-1.5">
          {trend && <span className="font-semibold text-[#0f7b4c]">{trend}</span>}
          <span>{subtext}</span>
        </p>
      )}
    </div>
  );
}
