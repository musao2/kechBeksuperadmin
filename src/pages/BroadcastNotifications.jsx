import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  FiSend,
  FiUsers,
  FiCheckCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiMessageSquare,
  FiRadio,
  FiClock,
  FiFilter,
  FiBell,
  FiX,
  FiInbox,
  FiTag,
  FiZap
} from 'react-icons/fi';

export default function BroadcastNotifications() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('AKSIYA');
  const [targetGroup, setTargetGroup] = useState('ALL');

  // Broadcast sending state
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // History of broadcast messages
  const [broadcastHistory, setBroadcastHistory] = useState([]);

  useEffect(() => {
    fetchUsers();
    loadHistoryFromStorage();
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
        .select('*');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Foydalanuvchilarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };


  const loadHistoryFromStorage = () => {
    try {
      const saved = localStorage.getItem('broadcast_history_list');
      if (saved) {
        setBroadcastHistory(JSON.parse(saved));
      }
    } catch (e) {}
  };

  const saveHistoryToStorage = (newHistory) => {
    try {
      localStorage.setItem('broadcast_history_list', JSON.stringify(newHistory));
    } catch (e) {}
  };

  // Barcha foydalanuvchilar (telegram_users da card_number ustuni yo'q)
  const getTargetUsers = () => {
    return users;
  };


  const targetUsersList = getTargetUsers();

  const handleStartBroadcast = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Iltimos, yangilik sarlavhasini kiriting!");
      return;
    }
    if (!message.trim()) {
      alert("Iltimos, SMS / Yangilik matnini kiriting!");
      return;
    }
    if (targetUsersList.length === 0) {
      alert("Xabar yuborish uchun mos foydalanuvchilar topilmadi!");
      return;
    }

    setShowConfirmModal(true);
  };

  const executeBroadcast = async () => {
    setShowConfirmModal(false);
    setIsSending(true);
    setProgress(0);
    setSentCount(0);

    const fullBroadcastText = `[${title.trim()}] ${message.trim()}`;
    const totalTargets = targetUsersList.length;
    let successCounter = 0;

    for (let i = 0; i < totalTargets; i++) {
      const targetUser = targetUsersList[i];
      try {
        const { error: insertErr } = await supabase
          .from('xabarlar')
          .insert([{
            chat_id: targetUser.chat_id,
            title: title.trim(),
            message: message.trim(),
            category: category,
            is_read: false
          }]);
        
        if (insertErr) {
          console.warn('xabarlar insert warning:', insertErr);
        } else {
          successCounter++;
        }
      } catch (err) {
        console.warn(`User ${targetUser.chat_id} ga yuborishda xato:`, err);
      }

      setSentCount(successCounter);
      setProgress(Math.round(((i + 1) / totalTargets) * 100));

      // Progressni ko'rsatish uchun kichik kutish
      await new Promise(resolve => setTimeout(resolve, 30));
    }


    const newRecord = {
      id: Date.now(),
      title: title.trim(),
      message: message.trim(),
      category: category,
      recipientCount: successCounter,
      created_at: new Date().toISOString()
    };

    const updatedHistory = [newRecord, ...broadcastHistory];
    setBroadcastHistory(updatedHistory);
    saveHistoryToStorage(updatedHistory);

    setSuccessToast(`Muvaffaqiyatli! Jami ${successCounter} ta foydalanuvchiga yangilik yuborildi!`);
    setTitle('');
    setMessage('');
    setIsSending(false);

    setTimeout(() => setSuccessToast(''), 7000);
  };

  const templateOptions = [
    {
      title: "10% Keshbek Aksiya!",
      text: "Hurmatli mijoz! Stansiyamizda 10% bonus keshbek aksiyasi boshlandi. Yoqilg'i quyib ko'proq keshbekga ega bo'ling!"
    },
    {
      title: "Yoqilg'i Narxi Arzonlashdi",
      text: "Sifatli AI-92 va Metan yoqilg'ilari narxi arzonlashdi! Barcha haydovchilarimizni stansiyamizda kutib qolamiz."
    },
    {
      title: "Bayram Munosabati Bilan Bonus",
      text: "Bayram munosabati bilan barcha sodiq mijozlarimizga maxsus bonus keshbeklar taqdim etiladi!"
    },
    {
      title: "Texnik Profilaktika Ishlari",
      text: "Hurmatli haydovchilar! Bugun soat 23:00 dan 01:00 gacha profilaktika ishlari olib boriladi."
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert Banner */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-[#0f7b4c] text-white shadow-md flex items-center justify-between font-semibold text-sm">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="w-5 h-5" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="p-1 hover:bg-white/20 rounded-lg">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <FiRadio className="w-5 h-5 text-[#0f7b4c]" /> Ommaviy SMS va Yangiliklar Tarqatish
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ro'yxatdan o'tgan barcha mijozlarning ilovasiga zudlik bilan bildirishnoma va aksiyalarni yuborish
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <FiUsers className="w-4 h-4 text-[#0f7b4c]" />
            Jami Mijozlar: <span className="font-bold text-[#0f7b4c]">{users.length} ta</span>
          </div>
        </div>
      </div>

      {/* Main Broadcast Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Broadcast Form (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FiSend className="w-4 h-4 text-[#0f7b4c]" /> Yangi Xabar Yaratish
              </h2>
              <span className="text-xs text-slate-400 font-medium">Barcha ilova foydalanuvchilariga boradi</span>
            </div>

            {/* Quick Templates Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <FiZap className="w-4 h-4 text-amber-500" /> Tezkor Shablonlar:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templateOptions.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTitle(tpl.title);
                      setMessage(tpl.text);
                    }}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 text-left transition-all group"
                  >
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#0f7b4c]">
                      {tpl.title}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {tpl.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleStartBroadcast} className="space-y-4 pt-1">
              {/* Target Audience & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <FiFilter className="w-3.5 h-3.5 text-[#0f7b4c]" /> Qabul Qiluvchilar Guruhi:
                  </label>
                  <select
                    value={targetGroup}
                    onChange={(e) => setTargetGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0f7b4c]"
                  >
                    <option value="ALL">Barcha Telegram Foydalanuvchilar ({users.length} ta)</option>
                  </select>

                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <FiTag className="w-3.5 h-3.5 text-[#0f7b4c]" /> Xabar Turi:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0f7b4c]"
                  >
                    <option value="AKSIYA">Aksiya & Chegirma</option>
                    <option value="MUHIM">Zudlik bilan (Muhim)</option>
                    <option value="BONUS">Bayram Bonusi</option>
                    <option value="YANGILIK">Umumiy Yangilik</option>
                  </select>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yangilik Sarlavhasi:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Bayram munosabati bilan 10% Keshbek!"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:bg-white focus:border-[#0f7b4c] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* Message Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <FiMessageSquare className="w-4 h-4 text-[#0f7b4c]" />
                    SMS / Bildirishnoma Matni:
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {message.length} belgi
                  </span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mijozlar ilovasida bildirishnoma va SMS ko'rinishida chiqadigan matnni yozing..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#0f7b4c] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* Progress bar during broadcast */}
              {isSending && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0f7b4c]">
                    <span className="flex items-center gap-2">
                      <FiRefreshCw className="w-4 h-4 animate-spin" /> Yuborilmoqda...
                    </span>
                    <span>{sentCount} / {targetUsersList.length} mijoz ({progress}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0f7b4c] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSending || targetUsersList.length === 0}
                  className="w-full py-3 px-5 rounded-xl bg-[#0f7b4c] hover:bg-[#0a5c39] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <FiSend className="w-4 h-4" /> Barcha {targetUsersList.length} ta Mijozga SMS Yuborish
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Live Green Preview & Info Card (1 Col) */}
        <div className="space-y-6">
          {/* Mobile Green Notification Preview Mockup */}
          <div className="bg-[#0f7b4c] rounded-2xl p-5 text-white border border-emerald-700 shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-emerald-100 border-b border-emerald-600/60 pb-2.5">
              <span className="font-bold flex items-center gap-1.5 text-white">
                <FiBell className="w-4 h-4 text-emerald-200" /> Ilovada ko'rinishi
              </span>
              <span className="font-mono text-[10px] text-emerald-200">Hozir</span>
            </div>

            {/* Notification Card Green Mockup */}
            <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 space-y-1.5 text-white">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white text-[#0f7b4c] flex items-center justify-center shrink-0 font-bold">
                  <FiBell className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">
                    {title || "Kartangizga pul tushdi!"}
                  </p>
                  <p className="text-[10px] text-emerald-200 font-mono">Bugun, KeshBak Notification</p>
                </div>
              </div>

              <p className="text-xs text-emerald-50 leading-relaxed font-medium pt-1">
                {message || "SMS va yangilik matni foydalanuvchi mobil ilovasining Header qismida aks etadi."}
              </p>
            </div>

            <p className="text-[11px] text-emerald-100 leading-normal pt-1">
              Ushbu xabar tugma bosilishi bilan tizimdagi barcha <strong className="text-white font-bold">{targetUsersList.length} ta</strong> aktiv foydalanuvchilar ilovasiga yuboriladi.
            </p>
          </div>

          {/* Stats Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Yuborish Statistikalari
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Jami mijozlar bazasi:</span>
                <span className="font-bold text-slate-900">{users.length} ta</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Tanlangan guruh:</span>
                <span className="font-bold text-[#0f7b4c]">{targetUsersList.length} ta mijoz</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Kanal:</span>
                <span className="font-bold text-slate-900">App Notification & Realtime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Past Broadcast History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FiClock className="w-5 h-5 text-[#0f7b4c]" /> Oxirgi Yuborilgan Ommaviy Xabarlar Tarixi
          </h3>
          <span className="text-xs text-slate-400">Jami {broadcastHistory.length} ta xabar</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Vaqti</th>
                <th className="p-3.5">Sarlavha</th>
                <th className="p-3.5">Xabar Matni</th>
                <th className="p-3.5">Kategoriya</th>
                <th className="p-3.5 text-right">Qabul qiluvchilar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {broadcastHistory.length > 0 ? (
                broadcastHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString('uz-UZ')}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {item.title}
                    </td>
                    <td className="p-3.5 max-w-md text-slate-600 truncate">
                      {item.message}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#0f7b4c] border border-emerald-200 font-bold text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900 font-mono">
                      {item.recipientCount} ta mijoz
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <FiInbox className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#0f7b4c]" />
                    Hali ommaviy xabarlar yuborilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200 shrink-0">
                <FiAlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ommaviy Xabarni Tasdiqlash
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Diqqat! Ushbu xabarnoma qaytarib bo'lmaydi.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p><strong>Sarlavha:</strong> {title}</p>
              <p><strong>Qabul qiluvchilar:</strong> {targetUsersList.length} ta foydalanuvchi</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={executeBroadcast}
                className="px-4 py-2 rounded-xl bg-[#0f7b4c] hover:bg-[#0a5c39] text-white text-xs font-bold shadow-md flex items-center gap-2"
              >
                <FiCheckCircle className="w-4 h-4" /> Ha, barchaga yuborilsin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
