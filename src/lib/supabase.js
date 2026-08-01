import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  rawUrl && 
  rawKey && 
  rawUrl !== 'your_supabase_url_here' && 
  !rawUrl.includes('placeholder.supabase.co')
);

const SUPABASE_URL = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = isSupabaseConfigured ? rawKey : 'placeholder-key';

if (!isSupabaseConfigured) {
  console.warn('⚠️ Warning: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in Vercel environment variables.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
