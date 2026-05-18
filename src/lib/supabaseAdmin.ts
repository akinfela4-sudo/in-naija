import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxnzuckaptnzifeoxirn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bnp1Y2thcHRuemlmZW94aXJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzU5MjQsImV4cCI6MjA5NDQ1MTkyNH0.rlc6FiYfUgk8Gp5Kh7QQVSgzaSBkR_XTD_VNF8eC-Ao';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
