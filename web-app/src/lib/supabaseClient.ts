import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as any)?.env || {};
const supabaseUrl = env?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY as string | undefined;

let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return cachedClient;
};

