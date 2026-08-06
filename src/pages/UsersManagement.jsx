import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  FiUsers,
  FiSearch,
  FiPhone,
  FiRefreshCw,
  FiX,
  FiDownload,
  FiSend,
  FiMessageSquare,
  FiBell,
  FiCheckCircle,
  FiHash,
  FiCalendar
} from 'react-icons/fi';
import { HiOutlineWallet } from 'react-icons/hi2';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // SMS/Xabar yuborish modal
  const [msgUser, setMsgUser] = useState(null);
  const [msgText, setMsgText] = useState('');
  const [submittingMsg, setSubmittingMsg] = useState(false);

  // Pul o'tkazish (Balans qo'shish) modal
  const [transferUser, setTransferUser] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferComment, setTransferComment] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);


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
        .from('telegram_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const localBalances = JSON.parse(localStorage.getItem('local_balances') || '{}');
      const mergedData = (data || []).map(u => ({
        ...u,
        cashback_balance: localBalances[u.chat_id] !== undefined ? localBalances[u.chat_id] : (u.cashback_balance || 0)
      }));

      setUsers(mergedData);
    } catch (err) {
      console.error('Foydalanuvchilarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  // Foydalanuvchiga xabar/izoh yuborish (user_notifications ga saqlanadi)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgUser) return;
    if (!msgText.trim()) {
      alert('Iltimos, xabar matnini kiriting!');
      return;
    }
    setSubmittingMsg(true);
    try {
      const { error } = await supabase
        .from('xabarlar')
        .insert([{
          chat_id: msgUser.chat_id,
          title: '💬 Yangi Xabar',
          message: msgText.trim(),
          category: 'GENERAL',
          is_read: false
        }]);
      
      if (error) throw error;

      setSuccessToast(`${msgUser.phone} ga xabar yuborildi!`);
      setMsgUser(null);
      setMsgText('');
      setTimeout(() => setSuccessToast(''), 5000);
    } catch (err) {
      alert('Xabar yuborishda xatolik: ' + err.message);
    } finally {
      setSubmittingMsg(false);
    }
  };

  // Balans o'tkazish
  const handleTransferBalance = async (e) => {
    e.preventDefault();
    if (!transferUser) return;
    const amount = Number(transferAmount);
    if (!amount || amount <= 0) {
      alert("Iltimos, to'g'ri summa kiriting!");
      return;
    }
    
    setSubmittingTransfer(true);
    try {
      // 1. Joriy balansni bilib olamiz va yangilaymiz
      const localBalances = JSON.parse(localStorage.getItem('local_balances') || '{}');
      const currentBalance = Number(localBalances[transferUser.chat_id] || transferUser.cashback_balance || 0);
      const newBalance = currentBalance + amount;
      
      const { error: updateErr } = await supabase
        .from('telegram_users')
        .update({ cashback_balance: newBalance })
        .eq('chat_id', transferUser.chat_id);
      
      if (updateErr && (updateErr.message.includes('schema cache') || updateErr.code === 'PGRST205')) {
        localBalances[transferUser.chat_id] = newBalance;
        localStorage.setItem('local_balances', JSON.stringify(localBalances));
      } else if (updateErr) {
        throw updateErr;
      }

      // 2. balance_transfers tarixini saqlaymiz
      const { error: historyErr } = await supabase
        .from('balance_transfers')
        .insert([{
          chat_id: transferUser.chat_id,
          phone: transferUser.phone,
          amount: amount,
          comment: transferComment.trim(),
          admin_note: 'Admin paneldan o\'tkazildi'
        }]);
      if (historyErr && (historyErr.message.includes('schema cache') || historyErr.code === 'PGRST205')) {
        const localTransfers = JSON.parse(localStorage.getItem('local_transfers') || '[]');
        localTransfers.unshift({
          chat_id: transferUser.chat_id,
          phone: transferUser.phone,
          amount: amount,
          comment: transferComment.trim(),
          admin_note: 'Admin paneldan o\'tkazildi',
          created_at: new Date().toISOString()
        });
        localStorage.setItem('local_transfers', JSON.stringify(localTransfers));
      } else if (historyErr) {
        console.warn('History:', historyErr);
      }

      // 3. Xabarni xabarlar jadvaliga saqlaymiz
      const { error: notifErr } = await supabase
        .from('xabarlar')
        .insert([{
          chat_id: transferUser.chat_id,
          title: '💳 Kartangizga pul tushdi!',
          message: `${amount.toLocaleString('uz-UZ')} so'm keshbek balansingizga qo'shildi. ${transferComment.trim()}`,
          category: 'TRANSFER',
          amount: amount,
          is_read: false
        }]);
      if (notifErr) console.warn('Notif:', notifErr);

      setSuccessToast(`${transferUser.phone} balansiga ${amount.toLocaleString('uz-UZ')} so'm o'tkazildi!`);
      setTransferUser(null);
      setTransferAmount('');
      setTransferComment('');
      
      // Update local state immediately
      const updatedUsers = users.map(u => {
        if (u.chat_id === transferUser.chat_id) {
          return { ...u, cashback_balance: newBalance };
        }
        return u;
      });
      setUsers(updatedUsers);

      setTimeout(() => setSuccessToast(''), 5000);
    } catch (err) {
      alert("Balans o'tkazishda xatolik: " + err.message);
    } finally {
      setSubmittingTransfer(false);
    }
  };



  // Qidirish: telefon yoki chat_id, ism, karta bo'yicha
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const phoneMatch = u.phone?.toLowerCase().includes(q);
    const chatMatch = u.chat_id?.toLowerCase().includes(q);
    const nameMatch = u.full_name?.toLowerCase().includes(q);
    const cardMatch = u.card_number?.toLowerCase().includes(q);
    return phoneMatch || chatMatch || nameMatch || cardMatch;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('uz-UZ', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const exportUsersCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = ['Ism / F.I.O', 'Telefon Raqam', 'Chat ID', 'Karta Raqami', "Ro'yxatdan O'tgan Sana"];
    const rows = filteredUsers.map(u => [
      `"${u.full_name || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.chat_id || ''}"`,
      `"${u.card_number || ''}"`,
      `"${formatDate(u.created_at)}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `telegram_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Success Toast */}
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-[#0f7b4c]" /> Foydalanuvchilar Boshqaruvi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Telegram bot orqali ro'yxatdan o'tgan barcha foydalanuvchilar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportUsersCSV}
            disabled={filteredUsers.length === 0}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors disabled:opacity-40"
          >
            <FiDownload className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ism, Telefon, Chat ID yoki Karta Raqami bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0f7b4c] outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Jami: <strong className="text-slate-900">{filteredUsers.length}</strong> ta foydalanuvchi</span>
          <button onClick={fetchUsers} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Yangilash">
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
                <th className="p-3.5">#</th>
                <th className="p-3.5">F.I.O</th>
                <th className="p-3.5">Telefon / Karta</th>
                <th className="p-3.5">Telegram Chat ID</th>
                <th className="p-3.5">Ro'yxatga Kirgan</th>
                <th className="p-3.5 text-right">Balans</th>
                <th className="p-3.5 text-center">Amallar</th>

              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400">
                    <FiRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0f7b4c]" />
                    <p>Foydalanuvchilar yuklanmoqda...</p>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <tr key={user.chat_id || user.phone} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-800 tracking-wide block truncate max-w-[150px]">
                        {user.full_name || '—'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-emerald-700 font-mono tracking-wide text-[11px]">
                          {user.phone || '—'}
                        </span>
                        {user.card_number && (
                          <span className="px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-[#0f7b4c] font-mono text-[10px] inline-block w-max">
                            {user.card_number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-slate-700 text-[11px] font-semibold">
                        {user.chat_id || '—'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-800">
                      {Number(user.cashback_balance || 0).toLocaleString('uz-UZ')} <span className="text-[10px] text-slate-500 font-normal">so'm</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setTransferUser(user); setTransferAmount(''); setTransferComment(''); }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <HiOutlineWallet className="w-4 h-4" /> Pul O'tkazish
                        </button>
                        <button
                          onClick={() => { setMsgUser(user); setMsgText(''); }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-[#0f7b4c] hover:bg-[#0f7b4c] hover:text-white font-semibold text-xs transition-colors flex items-center gap-1.5 border border-emerald-200"
                        >
                          <FiSend className="w-3.5 h-3.5" /> Xabar
                        </button>
                      </div>
                    </td>
                  </tr>

                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <FiUsers className="w-10 h-10 opacity-30" />
                      <p className="font-medium text-sm">
                        {searchQuery ? "Qidiruv bo'yicha foydalanuvchi topilmadi" : "Hozircha foydalanuvchilar ro'yxatdan o'tmagan"}
                      </p>
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-xs text-[#0f7b4c] underline">Filtrni tozalash</button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && filteredUsers.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4">
            <span>{filteredUsers.length} ta foydalanuvchi ko'rsatilmoqda</span>
            <span>Jami: <strong className="text-slate-700">{users.length}</strong> ta</span>
          </div>
        )}
      </div>

      {/* Xabar Yuborish Modal */}
      {msgUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-[#0f7b4c] p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <FiMessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Foydalanuvchiga Xabar</h3>
                    <p className="text-xs text-emerald-100 font-medium">Bildirishnoma va izoh yuborish</p>
                  </div>
                </div>
                <button onClick={() => setMsgUser(null)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/30">
                    {msgUser.phone ? msgUser.phone.slice(-2) : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white font-mono">{msgUser.phone}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Chat ID: {msgUser.chat_id}</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">Xabar Matni:</label>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {[
                      'Sizga maxsus taklif yuborildi!',
                      'Keshbek balansingiz yangilandi.',
                      'Aksiya muddati tugashiga 1 kun qoldi.',
                      'Tizim yangilandi, yangi imkoniyatlar mavjud.'
                    ].map((tpl, i) => (
                      <button key={i} type="button" onClick={() => setMsgText(tpl)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-[#0f7b4c] border border-slate-200 transition-colors">
                        {tpl}
                      </button>
                    ))}
                  </div>
                  <textarea required rows={3} value={msgText} onChange={(e) => setMsgText(e.target.value)}
                    placeholder="Foydalanuvchiga yuboriladigan xabarni yozing..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0f7b4c] focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none" />
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <FiBell className="w-3 h-3 text-amber-500" /> Bu xabar foydalanuvchi ilovasida bildirishnoma bo'lib ko'rinadi.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setMsgUser(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Bekor qilish</button>
                  <button type="submit" disabled={submittingMsg}
                    className="px-5 py-2 rounded-xl bg-[#0f7b4c] hover:bg-[#0a5c39] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50">
                    {submittingMsg ? (<><FiRefreshCw className="w-4 h-4 animate-spin" /> Yuborilmoqda...</>) : (<><FiSend className="w-4 h-4" /> Xabar Yuborish</>)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Balans O'tkazish Modal */}
      {transferUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="bg-emerald-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <HiOutlineWallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Pul O'tkazish</h3>
                    <p className="text-xs text-emerald-100 font-medium">Mijoz balansini to'ldirish</p>
                  </div>
                </div>
                <button onClick={() => setTransferUser(null)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-0.5">Mijoz:</p>
                    <p className="text-sm font-bold text-slate-900">{transferUser.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium mb-0.5">Joriy Balans:</p>
                    <p className="text-sm font-bold text-[#0f7b4c]">
                      {Number(transferUser.cashback_balance || 0).toLocaleString('uz-UZ')} so'm
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleTransferBalance} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Summa (so'm):</label>
                  <input required type="number" min="1" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Masalan: 15000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-bold focus:border-[#0f7b4c] focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Izoh (Mijozga ko'rinadi):</label>
                  <input required type="text" value={transferComment} onChange={(e) => setTransferComment(e.target.value)}
                    placeholder="Masalan: Aksiya g'olibi bo'lganingiz uchun"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:border-[#0f7b4c] focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none" />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setTransferUser(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Bekor qilish</button>
                  <button type="submit" disabled={submittingTransfer}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50">
                    {submittingTransfer ? (<><FiRefreshCw className="w-4 h-4 animate-spin" /> O'tkazilmoqda...</>) : (<><HiOutlineWallet className="w-4 h-4" /> Balansni To'ldirish</>)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
