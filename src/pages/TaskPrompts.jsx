import React, { useState } from 'react';
import { 
  FiCheckSquare, 
  FiDatabase, 
  FiCode, 
  FiSmartphone,
  FiCopy,
  FiCheck
} from 'react-icons/fi';

export default function TaskPrompts() {
  const [copiedScript, setCopiedScript] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const sqlScript1 = `
-- 1. Bildirishnomalar jadvali
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id          BIGSERIAL PRIMARY KEY,
  chat_id     TEXT        NOT NULL,
  phone       TEXT,
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  category    TEXT        DEFAULT 'GENERAL',
  is_read     BOOLEAN     DEFAULT false,
  amount      NUMERIC     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.user_notifications FOR ALL USING (true) WITH CHECK (true);
  `.trim();

  const sqlScript2 = `
-- 2. Foydalanuvchilar jadvaliga yangi ustunlar (balans)
ALTER TABLE public.telegram_users
  ADD COLUMN IF NOT EXISTS cashback_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS card_number TEXT DEFAULT '';

-- 3. Balans o'tkazmalari tarixi
CREATE TABLE IF NOT EXISTS public.balance_transfers (
  id          BIGSERIAL PRIMARY KEY,
  chat_id     TEXT        NOT NULL,
  phone       TEXT,
  amount      NUMERIC     NOT NULL,
  comment     TEXT,
  admin_note  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.balance_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.balance_transfers FOR ALL USING (true) WITH CHECK (true);
  `.trim();

  const userPrompt = `
Sen "KechBek" — O'zbekistondagi yoqilg'i stansiyasi uchun mijozlar mobil ilovasisan (React Native / Flutter).

Asosiy vazifalar:
1. Yoqilg'i quyishda avtomatik keshbek hisoblash va ko'rsatish
2. Balansni ko'rish (telegram_users.cashback_balance)
3. Admin panel orqali yuborilgan xabarlarni real-time olish (user_notifications)
4. Balansga pul tushganda yoki yechilganda xabar ko'rsatish

Supabase Integratsiyasi:
- Asosiy jadval: telegram_users (autentifikatsiya phone + chat_id orqali)
- Xabarlar: user_notifications jadvaliga ulanish va filter (chat_id = joriy mijoz ID si)
- Real-time: Supabase .channel('user_notifications') orqali obuna bo'lish

Dizayn:
- Zamonaviy, Glassmorphism, yashil (emerald) ranglar asosida qurilishi kerak.
  `.trim();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <FiCheckSquare className="w-3.5 h-3.5" /> Bajarilgan Vazifalar
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tizim Yangilanishlari va Qo'llanmalar
          </h1>
          <p className="mt-2 text-sm text-slate-300 font-medium max-w-2xl">
            Siz so'ragan barcha vazifalar (pul o'tkazish, bildirishnomalar, alohida jadvallar) bajarildi. Bu yerda tizimni to'liq ishga tushirish uchun kerakli SQL kodlar va User App uchun prompt joylashgan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SQL Scripts Section */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FiDatabase className="w-5 h-5 text-blue-600" /> Supabase SQL Skriptlari
          </h2>
          <p className="text-sm text-slate-600">
            Keshbek balansini hisoblash va xabarnomalar to'g'ri ishlashi uchun Supabase <strong>SQL Editor</strong> ga kirib quyidagi kodlarni ishga tushiring:
          </p>

          {/* Script 1 */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <FiCode className="w-4 h-4 text-emerald-400" /> user_notifications jadvali
              </span>
              <button 
                onClick={() => copyToClipboard(sqlScript1, 'script1')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {copiedScript === 'script1' ? <FiCheck className="w-4 h-4 text-emerald-400" /> : <FiCopy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
              {sqlScript1}
            </pre>
          </div>

          {/* Script 2 */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <FiCode className="w-4 h-4 text-amber-400" /> Balans va Tarix jadvallari
              </span>
              <button 
                onClick={() => copyToClipboard(sqlScript2, 'script2')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {copiedScript === 'script2' ? <FiCheck className="w-4 h-4 text-emerald-400" /> : <FiCopy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-amber-200 overflow-x-auto whitespace-pre-wrap">
              {sqlScript2}
            </pre>
          </div>
        </div>

        {/* User App Prompt Section */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FiSmartphone className="w-5 h-5 text-emerald-600" /> Foydalanuvchi Ilovasi (Prompt)
          </h2>
          <p className="text-sm text-slate-600">
            Mijozlar uchun mo'ljallangan mobil yoki web ilovani yaratish uchun ushbu promptdan foydalanishingiz mumkin:
          </p>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-sm relative group">
            <button 
              onClick={() => copyToClipboard(userPrompt, 'prompt')}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm opacity-0 group-hover:opacity-100"
              title="Nusxa olish"
            >
              {copiedScript === 'prompt' ? <FiCheck className="w-4 h-4 text-emerald-600" /> : <FiCopy className="w-4 h-4" />}
            </button>
            
            <pre className="text-sm font-medium text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {userPrompt}
            </pre>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 mt-4">
            <h3 className="text-sm font-bold text-blue-900 mb-2">Qanday ishlaydi?</h3>
            <ul className="text-xs text-blue-800 space-y-2 list-disc pl-4">
              <li>Siz admin paneldan <strong>Pul O'tkazish</strong> tugmasini bosganingizda, foydalanuvchining <code>cashback_balance</code> qiymati oshadi.</li>
              <li>Shu zahoti <code>user_notifications</code> jadvaliga xabar yoziladi.</li>
              <li>Agar mijoz ilovada online bo'lsa, xabar (Notification) darhol ekraniga chiqadi.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
