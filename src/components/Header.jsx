import React from 'react';
import { 
  RefreshCw, 
  Bell, 
  Fuel, 
  Lock,
  Settings,
  ShieldCheck,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ 
  title, 
  stationStatus, 
  onRefresh, 
  isRefreshing,
  isCollapsed,
  onToggleSidebar,
  onOpenMobileMenu,
  onLock,
  onOpenAccountSettings
}) {
  const { user } = useAuth();

  return (
    <header className="h-20 border-b border-slate-200 bg-white px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-all">
      {/* Left section: Toggle button & Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
            "KeshBak" Zapravka tizimini markaziy boshqaruv paneli
          </p>
        </div>
      </div>

      {/* Right section: Station Status & Actions */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Station Status Quick Pill */}
        {stationStatus && (
          <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80">
            <Fuel className="w-4 h-4 text-slate-500" />
            <div className="text-xs">
              <span className="text-slate-500 font-medium">Stansiya: </span>
              <span className={`font-semibold ${stationStatus.is_open ? 'text-[#0f7b4c]' : 'text-rose-600'}`}>
                {stationStatus.is_open ? 'OCHIQ' : 'YOPIQ'}
              </span>
            </div>
            <span className="text-xs text-slate-400 border-l border-slate-200 pl-2 font-mono">
              {stationStatus.cashback_percent}% keshbek
            </span>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 relative group"
          title="Ma'lumotlarni yangilash"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0f7b4c]' : ''}`} />
        </button>

        {/* Manual Lock Screen Button */}
        <button
          onClick={onLock}
          className="p-2.5 rounded-xl text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200/80 flex items-center gap-1.5 text-xs font-semibold"
          title="Ekranni hoziroq bloklash (5 daqiqa harakatsizlikda ham avtomatik bloklanadi)"
        >
          <Lock className="w-4 h-4 text-amber-600" />
          <span className="hidden md:inline">Bloklash</span>
        </button>

        {/* User Account Settings Button (Premium Styled) */}
        <button
          onClick={onOpenAccountSettings}
          className="pl-2 pr-3.5 py-1.5 rounded-xl text-slate-700 hover:text-slate-900 bg-white hover:bg-emerald-50/60 border border-slate-200/90 hover:border-emerald-300 flex items-center gap-2.5 text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 group"
          title="Profil va Xavfsizlik Sozlamalari (Email & Parol)"
        >
          <div className="relative shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0f7b4c] to-emerald-600 text-white flex items-center justify-center font-extrabold text-[11px] shadow-sm shadow-emerald-700/20 group-hover:scale-105 transition-transform">
              SA
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-0.5 -right-0.5 shadow-sm" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800 group-hover:text-[#0f7b4c] transition-colors">
              Profil
            </span>
            <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0f7b4c] group-hover:rotate-45 transition-all" />
          </div>
        </button>
      </div>
    </header>
  );
}
