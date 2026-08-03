import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  FiUsers,
  FiSearch,
  FiEdit3,
  FiDollarSign,
  FiPhone,
  FiCreditCard,
  FiRefreshCw,
  FiX,
  FiDownload,
  FiSend,
  FiMessageSquare,
  FiBell,
  FiCheckCircle,
  FiArrowRight,
  FiZap
} from 'react-icons/fi';
import { HiOutlineWallet, HiOutlineSparkles } from 'react-icons/hi2';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [editingUser, setEditingUser] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [newBalance, setNewBalance] = useState('');

  // Money & SMS Transfer Modal State
  const [transferUser, setTransferUser] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferComment, setTransferComment] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [successToast, setSuccessToast] = useState('');

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
        <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-lg flex items-center justify-between font-semibold text-sm">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-5 h-5" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="p-1 hover:bg-emerald-700 rounded-lg">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-[#0f7b4c]" /> Foydalanuvchilar Boshqaruvi
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
            <FiDownload className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Search & Stats Filter Row */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
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
              <FiX className="w-4 h-4" />
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
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
                    <FiRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0f7b4c]" />
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
                          <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                          {user.phone || '—'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">
                        {user.card_number ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-800 flex items-center gap-1.5 w-fit">
                            <FiCreditCard className="w-3.5 h-3.5 text-[#0f7b4c]" />
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
                            <FiSend className="w-3.5 h-3.5" /> Pul / SMS Yuborish
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setEditingName(user.full_name || user.name || '');
                              setNewBalance(user.cashback_balance || 0);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition-colors flex items-center gap-1"
                          >
                            <FiEdit3 className="w-3.5 h-3.5" /> Tahrirlash
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

      {/* Pul Tushirish va Izohli SMS Yuborish Modal */}
      {transferUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden my-8">
            
            {/* Header */}
            <div className="bg-[#0f7b4c] p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <HiOutlineWallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      Pul Tashlash & SMS Yuborish
                    </h3>
                    <p className="text-xs text-emerald-100 font-medium">
                      Mijoz kartasiga zudlik bilan pul va izoh yuborish
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTransferUser(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Recipient User Profile Card */}
              <div className="p-4 rounded-xl bg-slate-900 text-white shadow-sm border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30">
                      {(transferUser.full_name || transferUser.name || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">
                        {transferUser.full_name || transferUser.name || 'Mijoz'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <FiPhone className="w-3 h-3 text-emerald-400" /> {transferUser.phone || 'Noma\'lum'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-medium">Joriy Balans</p>
                    <p className="text-sm font-extrabold text-emerald-400">
                      {formatCurrency(transferUser.cashback_balance)}
                    </p>
                  </div>
                </div>

                {/* Live Balance Change Indicator */}
                {transferAmount && !isNaN(parseFloat(transferAmount)) && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-300 flex items-center gap-1">
                      <FiArrowRight className="w-3.5 h-3.5 text-emerald-400" /> Yangilangan Balans:
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                      {formatCurrency((parseFloat(transferUser.cashback_balance) || 0) + parseFloat(transferAmount))}
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMoneyAndSMS} className="space-y-4">
                {/* Amount Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <FiDollarSign className="w-4 h-4 text-[#0f7b4c]" />
                      O'tkaziladigan Summa (so'm):
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="Masalan: 50000"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-lg font-bold focus:bg-white focus:border-[#0f7b4c] focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                    />
                    {transferAmount && (
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-[#0f7b4c] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {formatCurrency(parseFloat(transferAmount))}
                      </span>
                    )}
                  </div>

                  {/* Quick Amount Preset Chips */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[10000, 25000, 50000, 100000, 250000, 500000, 1000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTransferAmount(amt.toString())}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                          parseFloat(transferAmount) === amt
                            ? 'bg-[#0f7b4c] text-white border-[#0f7b4c]'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-[#0f7b4c]'
                        }`}
                      >
                        +{new Intl.NumberFormat('uz-UZ').format(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment / SMS Text Area */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <FiMessageSquare className="w-4 h-4 text-[#0f7b4c]" />
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
                        {templateText}
                      </button>
                    ))}
                  </div>

                  <textarea
                    required
                    rows={3}
                    value={transferComment}
                    onChange={(e) => setTransferComment(e.target.value)}
                    placeholder="Foydalanuvchi ilovasida ko'rinadigan izohni yozing..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0f7b4c] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <FiBell className="w-3 h-3 text-amber-500" /> Bu matn foydalanuvchi ilovasida bildirishnoma bo'lib chiqadi.
                  </p>
                </div>

                {/* Submit / Cancel Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTransferUser(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTransfer}
                    className="px-5 py-2 rounded-xl bg-[#0f7b4c] hover:bg-[#0a5c39] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {submittingTransfer ? (
                      <>
                        <FiRefreshCw className="w-4 h-4 animate-spin" /> Yuborilmoqda...
                      </>
                    ) : (
                      <>
                        <FiSend className="w-4 h-4" /> Pul Tushirish va SMS Yuborish
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
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FiEdit3 className="w-5 h-5 text-[#0f7b4c]" /> Mijoz Ma'lumotlarini Tahrirlash
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <FiX className="w-5 h-5" />
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
    </div>
  );
}
