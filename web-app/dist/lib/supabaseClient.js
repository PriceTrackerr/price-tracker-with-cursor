import { createClient } from '@supabase/supabase-js';
const env = import.meta?.env || {};
const supabaseUrl = env?.VITE_SUPABASE_URL;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY;
let cachedClient = null;
export const getSupabaseClient = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    if (!cachedClient) {
        cachedClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    return cachedClient;
};
//# sourceMappingURL=supabaseClient.js.map