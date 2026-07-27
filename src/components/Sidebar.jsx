import React from 'react';
import { 
  LayoutDashboard, 
  Fuel, 
  Users, 
  History, 
  ShieldCheck, 
  Activity,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isLive }) {
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
    <aside className="w-72 border-r border-slate-200 bg-white flex flex-col z-30">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f7b4c] to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-900 tracking-wide flex items-center gap-1">
              Kesh<span className="text-[#0f7b4c]">Bak</span>
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              Super Admin CRM
            </p>
          </div>
        </div>
      </div>

      {/* Realtime Connection Badge */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            Supabase Sync:
          </span>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
            isLive 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            {isLive ? 'REAL-TIME FAOL' : 'ULANMOQDA'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Asosiy Menyular
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 text-left group relative ${
                isActive
                  ? 'bg-emerald-50 text-[#0f7b4c] font-bold border border-emerald-200/80 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-[#0f7b4c]' : 'text-slate-400 group-hover:text-slate-600'
                }`} />
                <div>
                  <div className="text-sm leading-tight">{item.label}</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                    {item.desc}
                  </div>
                </div>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-[#0f7b4c]" />}
            </button>
          );
        })}
      </nav>

      {/* Admin Profile Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#0f7b4c] flex items-center justify-center font-extrabold text-sm border border-emerald-200">
            SA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">
              Super Admin
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              admin@keshbak.uz
            </p>
          </div>
          <ShieldCheck className="w-4 h-4 text-[#0f7b4c]" title="Bosh administrator" />
        </div>
      </div>
    </aside>
  );
}
