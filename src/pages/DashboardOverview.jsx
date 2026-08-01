import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import StatCard from '../components/StatCard';
import { 
  Users, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  DollarSign, 
  Calendar, 
  Download,
  Activity,
  Fuel
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCashbackGiven: 0,
    totalCashbackWithdrawn: 0,
    todaySales: 0,
    todayCashbackGiven: 0
  });
  const [dailyReports, setDailyReports] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch profiles count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 2. Fetch daily_reports
      const { data: reportsData } = await supabase
        .from('daily_reports')
        .select('*')
        .order('report_date', { ascending: true });

      // Process aggregated numbers
      let totalGiven = 0;
      let totalWithdrawn = 0;
      let todaySalesSum = 0;
      let todayGivenSum = 0;

      const todayStr = new Date().toISOString().split('T')[0];

      if (reportsData && reportsData.length > 0) {
        reportsData.forEach((row) => {
          totalGiven += Number(row.total_cashback_given || 0);
          totalWithdrawn += Number(row.total_cashback_withdrawn || 0);
          
          if (row.report_date === todayStr) {
            todaySalesSum = Number(row.total_sales || 0);
            todayGivenSum = Number(row.total_cashback_given || 0);
          }
        });
      }

      setStats({
        totalUsers: usersCount || 0,
        totalCashbackGiven: totalGiven,
        totalCashbackWithdrawn: totalWithdrawn,
        todaySales: todaySalesSum,
        todayCashbackGiven: todayGivenSum
      });

      setDailyReports(reportsData || []);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('uz-UZ').format(val || 0) + " so'm";
  };

  const exportToCSV = () => {
    if (!dailyReports || dailyReports.length === 0) return;
    
    const headers = ["Sana", "Tranzaksiyalar Soni", "Berilgan Keshbek (so'm)", "Yechilgan Keshbek (so'm)", "Umumiy Savdo (so'm)"];
    const rows = dailyReports.map(r => [
      r.report_date,
      r.total_transactions,
      r.total_cashback_given,
      r.total_cashback_withdrawn,
      r.total_sales
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `daily_reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#0f7b4c] via-[#0a5c39] to-emerald-800 text-white shadow-lg shadow-emerald-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Fuel className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Activity className="w-3.5 h-3.5" /> CRM Analytics Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xush kelibsiz! Zapravka Keshbek Tizimi
          </h1>
          <p className="mt-2 text-sm text-emerald-100 font-medium">
            Real-vaqtdagi tranzaksiyalar, foydalanuvchilar faolligi va stansiyaning keshbek statistikasi
          </p>
        </div>
      </div>

      {/* KPI Cards Grid (4 Asosiy Ko'rsatkich) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Jami Foydalanuvchilar"
          value={loading ? '...' : stats.totalUsers}
          subtext="Ro'yxatdan o'tgan mijozlar"
          icon={Users}
          trend="+100%"
          color="blue"
        />
        <StatCard
          title="Tarqatilgan Keshbek"
          value={loading ? '...' : formatCurrency(stats.totalCashbackGiven)}
          subtext="Berilgan jami keshbek"
          icon={ArrowUpRight}
          color="emerald"
        />
        <StatCard
          title="Yechib Olingan Keshbek"
          value={loading ? '...' : formatCurrency(stats.totalCashbackWithdrawn)}
          subtext="Ishlatilgan jami keshbek"
          icon={ArrowDownLeft}
          color="purple"
        />
        <StatCard
          title="Bugungi Savdo"
          value={loading ? '...' : formatCurrency(stats.todaySales)}
          subtext={`Bugungi keshbek: ${formatCurrency(stats.todayCashbackGiven)}`}
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales & Cashback Trend Chart */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#0f7b4c]" />
                Kunlik Savdo & Keshbek Grafigi
              </h3>
              <p className="text-xs text-slate-500">
                Kunlar kesimidagi berilgan va yechilgan keshbek ko'rsatkichlari
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {dailyReports.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyReports}>
                  <defs>
                    <linearGradient id="colorGiven" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f7b4c" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0f7b4c" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorWithdrawn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="report_date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderColor: '#cbd5e1', 
                      borderRadius: '0.75rem',
                      color: '#0f172a',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [formatCurrency(val), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="total_cashback_given" 
                    name="Berilgan Keshbek" 
                    stroke="#0f7b4c" 
                    fillOpacity={1} 
                    fill="url(#colorGiven)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total_cashback_withdrawn" 
                    name="Yechilgan Keshbek" 
                    stroke="#8b5cf6" 
                    fillOpacity={1} 
                    fill="url(#colorWithdrawn)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Hisobot ma'lumotlari yuklanmoqda...
              </div>
            )}
          </div>
        </div>

        {/* Transactions Count Bar Chart */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Kunlik Tranzaksiyalar Soni
              </h3>
              <p className="text-xs text-slate-500">
                Har bir kun bo'yicha amalga oshirilgan tranzaksiyalar hajmi
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {dailyReports.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyReports}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="report_date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderColor: '#cbd5e1', 
                      borderRadius: '0.75rem',
                      color: '#0f172a',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="total_transactions" name="Jami Tranzaksiyalar" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="cashback_given_count" name="Keshbek Berilgan" fill="#0f7b4c" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="cashback_withdrawn_count" name="Keshbek Yechilgan" fill="#d97706" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Hisobot ma'lumotlari yuklanmoqda...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Reports Data Table (`daily_reports`) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0f7b4c]" />
              Kunlik Hisobotlar Jadvali (`daily_reports`)
            </h3>
            <p className="text-xs text-slate-500">
              Har bir kun bo'yicha jamlangan tranzaksiya va keshbek hisobotlari
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-[#0f7b4c] hover:bg-emerald-100 border border-emerald-200 flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <Download className="w-4 h-4" /> CSV Faylga Yuklash
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Sana</th>
                <th className="p-3.5 text-center">Tranzaksiyalar Soni</th>
                <th className="p-3.5 text-right">Berilgan Keshbek</th>
                <th className="p-3.5 text-right">Yechilgan Keshbek</th>
                <th className="p-3.5 text-right">Umumiy Savdo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {dailyReports.length > 0 ? (
                dailyReports.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-medium text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0f7b4c]"></span>
                      {row.report_date}
                    </td>
                    <td className="p-3.5 text-center font-semibold">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">
                        {row.total_transactions} ta
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-medium text-[#0f7b4c]">
                      +{formatCurrency(row.total_cashback_given)}
                    </td>
                    <td className="p-3.5 text-right font-medium text-amber-700">
                      -{formatCurrency(row.total_cashback_withdrawn)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      {formatCurrency(row.total_sales)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    Hozircha hisobotlar mavjud emas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
