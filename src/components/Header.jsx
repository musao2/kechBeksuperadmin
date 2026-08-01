import React from 'react';
import { 
  RefreshCw, 
  Bell, 
  Fuel, 
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Lock
} from 'lucide-react';

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
  return (
    <header className="h-20 border-b border-slate-200 bg-white px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-all">
      {/* Left section: Toggle button & Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Toggle Menu Button */}
        

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
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Station Status Quick Pill */}
        {stationStatus && (
          <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50">
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

        {/* User Account Settings Button */}
        <button
          onClick={onOpenAccountSettings}
          className="p-2.5 rounded-xl text-slate-700 hover:text-[#0f7b4c] hover:bg-slate-100 transition-colors border border-slate-200 flex items-center gap-2 text-xs font-semibold"
          title="Profil va Xavfsizlik Sozlamalari (Email & Parol)"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#0f7b4c] flex items-center justify-center font-extrabold text-[10px]">
            SA
          </div>
          <span className="hidden md:inline">Profil</span>
        </button>
      </div>
    </header>
  );
}
