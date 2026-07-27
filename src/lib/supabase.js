import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ycffsnlrxalxcpfsrdjq.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZmZzbmxyeGFseGNwZnNyZGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNjUxMDMsImV4cCI6MjEwMDY0MTEwM30.hI1bZSn1RJCalO1nQtJKAMYljflo1_3JtEdh3Q9-GUA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
