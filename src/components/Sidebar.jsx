import React from 'react';
import { 
  LayoutDashboard, 
  Fuel, 
  Users, 
  History, 
  ShieldCheck, 
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isLive, 
  isCollapsed, 
  setIsCollapsed,
  mobileOpen,
  setMobileOpen
}) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Bosh Sahifa',
      icon: LayoutDashboard,
      desc: 'Analitika va Hisobotlar'
    },
    {
      id: 'station',
      label: 'Stansiya Sozlamalari',
      icon: Fuel,
      desc: 'Xarita va Parametrlar'
    },
    {
      id: 'users',
      label: 'Foydalanuvchilar',
      icon: Users,
      desc: 'Mijozlar Boshqaruvi'
    },
    {
      id: 'transactions',
      label: 'Tranzaksiyalar',
      icon: History,
      desc: 'Tarix va Harakatlar'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)} 
          className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-72'}`}
      >
        {/* Brand Logo Header */}
        <div className={`p-4 border-b border-slate-100 flex items-center min-h-[5rem] transition-all ${
          isCollapsed && !mobileOpen ? 'justify-center px-2' : 'justify-between sm:p-6'
        }`}>
          <div 
            onClick={() => isCollapsed && setIsCollapsed(false)}
            className={`flex items-center gap-3 overflow-hidden ${isCollapsed && !mobileOpen ? 'cursor-pointer hover:opacity-90' : ''}`}
            title={isCollapsed && !mobileOpen ? "KeshBak - Menyuni kengaytirish" : undefined}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f7b4c] to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 shrink-0 transition-transform hover:scale-105">
              <Fuel className="w-5 h-5" />
            </div>
            {(!isCollapsed || mobileOpen) && (
              <div className="transition-opacity duration-200 whitespace-nowrap">
                <h1 className="font-extrabold text-lg text-slate-900 tracking-wide flex items-center gap-1">
                  Kesh<span className="text-[#0f7b4c]">Bak</span>
                </h1>
                <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                  Super Admin CRM
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle Button */}
          {(!isCollapsed || mobileOpen) && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Menyuni kichraytirish"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realtime Connection Badge */}
        <div className={`px-4 py-3 border-b border-slate-100 bg-slate-50/70 transition-all ${
          isCollapsed && !mobileOpen ? 'flex justify-center' : 'px-6'
        }`}>
          <div className="flex items-center justify-between w-full">
            {(!isCollapsed || mobileOpen) && (
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                Supabase Sync:
              </span>
            )}
            <span 
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-all ${
                isLive 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              } ${isCollapsed && !mobileOpen ? 'p-1.5 border-none bg-transparent' : ''}`}
              title={isLive ? 'REAL-TIME FAOL' : 'ULANMOQDA'}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              {(!isCollapsed || mobileOpen) && (isLive ? 'REAL-TIME FAOL' : 'ULANMOQDA')}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {(!isCollapsed || mobileOpen) && (
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Asosiy Menyular
            </div>
          )}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                title={isCollapsed && !mobileOpen ? `${item.label} - ${item.desc}` : undefined}
                className={`w-full flex items-center ${
                  isCollapsed && !mobileOpen ? 'justify-center px-0 py-3.5' : 'justify-between px-4 py-3.5'
                } rounded-xl transition-all duration-200 text-left group relative ${
                  isActive
                    ? 'bg-emerald-50 text-[#0f7b4c] font-bold border border-emerald-200/80 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-[#0f7b4c]' : 'text-slate-400 group-hover:text-slate-600'
                  }`} />
                  {(!isCollapsed || mobileOpen) && (
                    <div className="truncate">
                      <div className="text-sm leading-tight truncate">{item.label}</div>
                      <div className="text-[11px] text-slate-400 font-normal mt-0.5 truncate">
                        {item.desc}
                      </div>
                    </div>
                  )}
                </div>
                {isActive && (!isCollapsed || mobileOpen) && (
                  <ChevronRight className="w-4 h-4 text-[#0f7b4c] shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin Profile Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className={`flex items-center ${isCollapsed && !mobileOpen ? 'justify-center' : 'gap-3'}`}>
            <div 
              className="w-9 h-9 rounded-full bg-emerald-100 text-[#0f7b4c] flex items-center justify-center font-extrabold text-sm border border-emerald-200 shrink-0"
              title="Super Admin (admin@keshbak.uz)"
            >
              SA
            </div>
            {(!isCollapsed || mobileOpen) && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    Super Admin
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    admin@keshbak.uz
                  </p>
                </div>
                <ShieldCheck className="w-4 h-4 text-[#0f7b4c] shrink-0" title="Bosh administrator" />
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
