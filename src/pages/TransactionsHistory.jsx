import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Download,
  Clock,
  Tag,
  DollarSign,
  Wallet
} from 'lucide-react';

export default function TransactionsHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // ALL, EARN, WITHDRAW
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTransactions();
    subscribeToTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToTransactions = () => {
    const channelTopic = `transactions_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelTopic)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.new) {
          setTransactions((prev) => [payload.new, ...prev]);
        }
      });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('uz-UZ').format(val || 0) + " so'm";
  };

  // Aniq operatsiya turini aniqlash (Berilgan vs Yechilgan)
  const isTransactionEarn = (t) => {
    const typeUpper = (t.type || '').toUpperCase();
    if (typeUpper === 'WITHDRAW' || typeUpper === 'YECHILGAN' || typeUpper === 'SPENT' || typeUpper === 'MINUS' || typeUpper === 'USE' || typeUpper === 'REDEEM') {
      return false;
    }
    if (typeUpper === 'EARN' || typeUpper === 'CASHBACK' || typeUpper === 'GIVEN' || typeUpper === 'ADD' || typeUpper === 'BONUS' || typeUpper === 'PLUS') {
      return true;
    }
    if (t.cashback_amount !== undefined && t.cashback_amount !== null) {
      return Number(t.cashback_amount) >= 0;
    }
    return Number(t.amount || 0) >= 0;
  };

  // Filtrlangan tranzaksiyalar
  const filteredTransactions = transactions.filter((t) => {
    const isEarn = isTransactionEarn(t);
    const typeMatch = 
      filterType === 'ALL' ||
      (filterType === 'EARN' && isEarn) ||
      (filterType === 'WITHDRAW' && !isEarn);

    const userName = t.user_name || t.full_name || t.name || '';
    const searchMatch = !searchQuery || 
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.fuel_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.code || '').toLowerCase().includes(searchQuery.toLowerCase());

    return typeMatch && searchMatch;
  });

  // Jami summalarni hisoblash
  const totalSalesSum = filteredTransactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalCashbackSum = filteredTransactions.reduce((acc, t) => {
    const cb = t.cashback_amount !== undefined && t.cashback_amount !== null 
      ? Math.abs(Number(t.cashback_amount)) 
      : Math.abs(Number(t.amount || 0));
    return acc + cb;
  }, 0);

  const exportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ["ID", "Vaqt", "Turi", "Mijoz Nomi", "Telefon", "Summa (so'm)", "Keshbek (so'm)", "Yoqilg'i Turi"];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.created_at,
      isTransactionEarn(t) ? 'BERILGAN' : 'YECHILGAN',
      `"${t.user_name || t.full_name || t.name || ''}"`,
      `"${t.phone || ''}"`,
      t.amount || 0,
      t.cashback_amount || 0,
      t.fuel_type || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0f7b4c]" /> Tranzaksiyalar Tarixi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Barcha keshbek berish va yechib olish amallarining real-time ro'yxati
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors self-start sm:self-auto shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Mijoz ismi, telefon raqami yoki yoqilg'i turi bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c]"
          />
        </div>

        {/* Filter Type Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Barchasi
          </button>
          <button
            onClick={() => setFilterType('EARN')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'EARN'
                ? 'bg-[#0f7b4c] text-white shadow-md shadow-emerald-800/20'
                : 'text-slate-600 hover:text-[#0f7b4c]'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Berilgan (Keshbek)
          </button>
          <button
            onClick={() => setFilterType('WITHDRAW')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'WITHDRAW'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-800/20'
                : 'text-slate-600 hover:text-purple-600'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" /> Yechilgan
          </button>
        </div>
      </div>

      {/* Total Sum Summary Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0f7b4c] flex items-center justify-center font-bold border border-emerald-200/80 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
              Jami Summa ({filterType === 'ALL' ? 'Barchasi' : filterType === 'EARN' ? 'Berilgan Keshbek' : 'Yechilgan Keshbek'})
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Jami <strong className="text-slate-900">{filteredTransactions.length} ta</strong> tranzaksiya bo'yicha
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 sm:gap-8 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Jami Savdo Summasi:</span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900">
              {formatCurrency(totalSalesSum)}
            </span>
          </div>
          <div className="border-l border-slate-200 pl-6 sm:pl-8">
            <span className="text-[11px] text-slate-500 font-medium block">
              {filterType === 'WITHDRAW' ? "Jami Yechilgan Keshbek:" : "Jami Keshbek Summasi:"}
            </span>
            <span className={`text-base sm:text-lg font-extrabold ${filterType === 'WITHDRAW' ? 'text-purple-700' : 'text-[#0f7b4c]'}`}>
              {formatCurrency(totalCashbackSum)}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Vaqt & Sana</th>
                <th className="p-3.5">Operatsiya Turi</th>
                <th className="p-3.5">Mijoz Ma'lumotlari</th>
                <th className="p-3.5">Yoqilg'i Turi</th>
                <th className="p-3.5 text-right">Savdo Summasi</th>
                <th className="p-3.5 text-right">Keshbek Summasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0f7b4c]" />
                    Tranzaksiyalar yuklanmoqda...
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => {
                  const isEarn = isTransactionEarn(t);
                  const cbVal = Math.abs(t.cashback_amount !== undefined && t.cashback_amount !== null ? t.cashback_amount : t.amount);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 text-slate-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {t.created_at ? new Date(t.created_at).toLocaleString('uz-UZ') : '—'}
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isEarn
                            ? 'bg-emerald-50 text-[#0f7b4c] border border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {isEarn ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                          {isEarn ? 'Keshbek Berildi' : 'Keshbek Yechildi'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">
                          {t.user_name || t.full_name || t.name || 'Mijoz'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{t.phone || '—'}</div>
                      </td>
                      <td className="p-3.5">
                        {t.fuel_type ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200 flex items-center gap-1 w-fit">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {t.fuel_type}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-slate-900">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className={`p-3.5 text-right font-bold text-sm ${isEarn ? 'text-[#0f7b4c]' : 'text-purple-600'}`}>
                        {isEarn ? '+' : '-'}{formatCurrency(cbVal)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Tranzaksiyalar topilmadi
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
