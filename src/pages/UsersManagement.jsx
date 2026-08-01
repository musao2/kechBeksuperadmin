import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Users,
  Search,
  Plus,
  Edit3,
  DollarSign,
  Phone,
  CreditCard,
  RefreshCw,
  X,
  Download,
  UserCheck,
  Send,
  MessageSquare,
  Bell,
  CheckCircle2,
  Wallet,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [newBalance, setNewBalance] = useState('');

  // Money & SMS Transfer Modal State
  const [transferUser, setTransferUser] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferComment, setTransferComment] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // New User Form State
  const [newUser, setNewUser] = useState({
    full_name: '',
    phone: '+998',
    card_number: '',
    cashback_balance: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          full_name: newUser.full_name,
          name: newUser.full_name,
          phone: newUser.phone,
          card_number: newUser.card_number,
          cashback_balance: parseFloat(newUser.cashback_balance || 0),
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      setShowAddModal(false);
      setNewUser({ full_name: '', phone: '+998', card_number: '', cashback_balance: 0 });
      fetchUsers();
    } catch (err) {
      alert("Foydalanuvchi qo'shishda xatolik: " + err.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updatedBalance = parseFloat(newBalance);
      const cleanName = editingName.trim();
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: cleanName,
          name: cleanName,
          cashback_balance: updatedBalance
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert("Foydalanuvchi ma'lumotlarini yangilashda xatolik: " + err.message);
    }
  };

  // Kartaga pul tashlash va foydalanuvchiga SMS/Bildirishnoma izoh bilan yuborish
  const handleSendMoneyAndSMS = async (e) => {
    e.preventDefault();
    if (!transferUser) return;

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount === 0) {
      alert("Iltimos, o'tkaziladigan pul summasini kiriting!");
      return;
    }
    if (!transferComment.trim()) {
      alert("Iltimos, pul o'tkazmasi uchun izoh yoki SMS matnini kiriting!");
      return;
    }

    setSubmittingTransfer(true);
    try {
      const currentBalance = parseFloat(transferUser.cashback_balance || 0);
      const newBal = currentBalance + amount;

      // 1. Foydalanuvchi balansini yangilash
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ cashback_balance: newBal })
        .eq('id', transferUser.id);

      if (profileErr) throw profileErr;

      // 2. Tranzaksiyalar jadvaliga yozish (SMS va Izoh qr_data ustunida saqlanadi)
      const { error: txErr } = await supabase
        .from('transactions')
        .insert([{
          user_id: String(transferUser.id),
          amount: amount,
          cashback_amount: amount,
          qr_data: transferComment.trim(),
          created_at: new Date().toISOString()
        }]);

      if (txErr) {
        throw txErr;
      }

      const recipientName = transferUser.full_name || transferUser.name || 'Mijoz';
      setSuccessToast(`${recipientName} kartasiga ${formatCurrency(amount)} tushirildi!`);
      setTransferUser(null);
      setTransferAmount('');
      setTransferComment('');
      fetchUsers();

      setTimeout(() => setSuccessToast(''), 6000);
    } catch (err) {
      alert("Pul tushirishda xatolik: " + err.message);
    } finally {
      setSubmittingTransfer(false);
    }
  };

  // Filter users by search query (phone or name)
  const filteredUsers = users.filter((u) => {
    const userName = u.full_name || u.name || '';
    const nameMatch = userName.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = u.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    const cardMatch = u.card_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || phoneMatch || cardMatch;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('uz-UZ').format(val || 0) + " so'm";
  };

  const exportUsersCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = ["ID", "Ism-Sharif", "Telefon", "Karta Raqam", "Keshbek Balans (so'm)"];
    const rows = filteredUsers.map(u => [
      u.id,
      `"${u.full_name || u.name || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.card_number || ''}"`,
      u.cashback_balance || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `profiles_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast alert message */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg flex items-center justify-between font-semibold text-sm animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="p-1 hover:bg-emerald-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0f7b4c]" /> Foydalanuvchilar Boshqaruvi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ro'yxatdan o'tgan mijozlar, kartalarga pul tushirish, izohli SMS va bildirishnomalar yuborish
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportUsersCSV}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0f7b4c] hover:bg-[#0a5c39] text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-md shadow-emerald-900/10"
          >
            <Plus className="w-4 h-4" /> Yangi Mijoz
          </button>
        </div>
      </div>

      {/* Search & Stats Filter Row */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Telefon raqami yoki Ism bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Jami topildi: <strong className="text-slate-900">{filteredUsers.length}</strong> ta mijoz</span>
          <button
            onClick={fetchUsers}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Foydalanuvchi</th>
                <th className="p-3.5">Telefon Raqami</th>
                <th className="p-3.5">Karta Raqami</th>
                <th className="p-3.5 text-right">Keshbek Balans</th>
                <th className="p-3.5 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0f7b4c]" />
                    Foydalanuvchilar ro'yxati yuklanmoqda...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const displayName = user.full_name || user.name || 'Noma\'lum Mijoz';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#0f7b4c] font-bold flex items-center justify-center text-xs border border-emerald-200">
                            {displayName !== 'Noma\'lum Mijoz' ? displayName.charAt(0).toUpperCase() : 'M'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {displayName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {user.id ? String(user.id).substring(0, 8) : '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-medium font-mono">
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {user.phone || '—'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">
                        {user.card_number ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-800 flex items-center gap-1.5 w-fit">
                            <CreditCard className="w-3.5 h-3.5 text-[#0f7b4c]" />
                            {user.card_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Karta biriktirilmagan</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-bold text-[#0f7b4c] text-sm">
                        {formatCurrency(user.cashback_balance)}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setTransferUser(user);
                              setTransferAmount('');
                              setTransferComment('Kartangizga keshbek puli tushirildi.');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-[#0f7b4c] hover:bg-[#0f7b4c] hover:text-white font-semibold text-xs transition-colors flex items-center gap-1 border border-emerald-200"
                            title="Pul tushirish va Izohli SMS yuborish"
                          >
                            <Send className="w-3.5 h-3.5" /> Pul / SMS Yuborish
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setEditingName(user.full_name || user.name || '');
                              setNewBalance(user.cashback_balance || 0);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Tahrirlash
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Mos keluvchi foydalanuvchilar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Premium Pul Tushirish va Izohli SMS Yuborish Modal */}
      {transferUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden my-8 transform transition-all">
            
            {/* Header with Emerald Gradient & Glassmorphism */}
            <div className="bg-gradient-to-r from-[#0f7b4c] via-emerald-600 to-teal-700 p-6 text-white relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute left-1/2 -top-12 w-24 h-24 bg-emerald-400/20 rounded-full blur-xl pointer-events-none"></div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                    <Wallet className="w-6 h-6 text-emerald-100" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                      Pul Tashlash & SMS <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    </h3>
                    <p className="text-xs text-emerald-100 font-medium mt-0.5">
                      Mijoz kartasiga zudlik bilan pul va izoh yuborish
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTransferUser(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Recipient User Profile Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-md relative overflow-hidden border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center text-sm">
                      {(transferUser.full_name || transferUser.name || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">
                        {transferUser.full_name || transferUser.name || 'Mijoz'}
                      </p>
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-400" /> {transferUser.phone || 'Noma\'lum'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400 font-medium">Joriy Balans</p>
                    <p className="text-base font-extrabold text-emerald-400">
                      {formatCurrency(transferUser.cashback_balance)}
                    </p>
                  </div>
                </div>

                {/* Live Balance Change Indicator */}
                {transferAmount && !isNaN(parseFloat(transferAmount)) && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-300 flex items-center gap-1">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400" /> Yangilangan Balans:
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
                      {formatCurrency((parseFloat(transferUser.cashback_balance) || 0) + parseFloat(transferAmount))}
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMoneyAndSMS} className="space-y-5">
                {/* Amount Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#0f7b4c]" />
                      O'tkaziladigan Summa (so'm):
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Istalgan summani kiriting</span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="Masalan: 50000"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 text-xl font-black focus:bg-white focus:border-[#0f7b4c] focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                    />
                    {transferAmount && (
                      <span className="absolute right-4 top-3.5 text-xs font-extrabold text-[#0f7b4c] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {formatCurrency(parseFloat(transferAmount))}
                      </span>
                    )}
                  </div>

                  {/* Quick Amount Preset Chips */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {[10000, 25000, 50000, 100000, 250000, 500000, 1000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTransferAmount(amt.toString())}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          parseFloat(transferAmount) === amt
                            ? 'bg-[#0f7b4c] text-white border-[#0f7b4c] shadow-sm'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-[#0f7b4c] hover:border-emerald-300'
                        }`}
                      >
                        +{new Intl.NumberFormat('uz-UZ').format(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment / SMS Text Area */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-[#0f7b4c]" />
                      Izoh / SMS Matni (Foydalanuvchiga yuboriladi):
                    </label>
                  </div>

                  {/* Template selector chips */}
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {[
                      "Yoqilg'i keshbegi kartangizga tushirildi.",
                      "Aksiya g'olibi uchun mukofot bonusi.",
                      "Karta balansingiz muvaffaqiyatli to'ldirildi.",
                      "Tizim keshbegi qayta hisoblandi."
                    ].map((templateText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTransferComment(templateText)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-[#0f7b4c] border border-slate-200 transition-colors"
                      >
                        💡 {templateText}
                      </button>
                    ))}
                  </div>

                  <textarea
                    required
                    rows={3}
                    value={transferComment}
                    onChange={(e) => setTransferComment(e.target.value)}
                    placeholder="Foydalanuvchi ilovasida ko'rinadigan izohni yozing..."
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0f7b4c] focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Bell className="w-3 h-3 text-amber-500" /> Bu matn foydalanuvchi ilovasida (`🔔` ikonkasida) zudlik bilan bildirishnoma bo'lib chiqadi.
                  </p>
                </div>

                {/* Submit / Cancel Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTransferUser(null)}
                    className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTransfer}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0f7b4c] via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-extrabold shadow-xl shadow-emerald-900/20 flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    {submittingTransfer ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Yuborilmoqda...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Pul Tushirish va SMS Yuborish
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#0f7b4c]" /> Mijoz Ma'lumotlarini Tahrirlash
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mijoz Ismi va Familiyasi:
                </label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Mijoz ismini kiriting..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keshbek Balansi (so'm):
                </label>
                <input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-base font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c]"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500 space-y-1">
                <p>Telefon: <strong className="text-slate-800">{editingUser.phone || '—'}</strong></p>
                <p>Karta: <strong className="text-slate-800">{editingUser.card_number || '—'}</strong></p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0f7b4c] hover:bg-[#0a5c39] text-white text-xs font-bold shadow-md shadow-emerald-900/10"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0f7b4c]" /> Yangi Foydalanuvchi Yaratish
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ism va Sharif:
                </label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Masalan: Sardor Rahimov"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefon Raqami:
                </label>
                <input
                  type="text"
                  required
                  value={newUser.phone}
                  onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Karta Raqami (ixtiyoriy):
                </label>
                <input
                  type="text"
                  value={newUser.card_number}
                  onChange={(e) => setNewUser(prev => ({ ...prev, card_number: e.target.value }))}
                  placeholder="8600 **** **** ****"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Boshlang'ich Keshbek Balans (so'm):
                </label>
                <input
                  type="number"
                  value={newUser.cashback_balance}
                  onChange={(e) => setNewUser(prev => ({ ...prev, cashback_balance: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0f7b4c] hover:bg-[#0a5c39] text-white text-xs font-bold shadow-md shadow-emerald-900/10"
                >
                  Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

