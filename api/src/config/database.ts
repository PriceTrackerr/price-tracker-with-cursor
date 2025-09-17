// database.ts
import fileStorage from './storage';
import { isSupabaseConfigured } from './supabase';
import supabaseStorage from './supabaseStorage';

const USE_SUPABASE = process.env.USE_SUPABASE === 'true';
const USE_LOCAL_DB = process.env.USE_LOCAL_DB === 'true';

console.log(
  '[DB INIT] USE_SUPABASE:', USE_SUPABASE,
  'USE_LOCAL_DB:', USE_LOCAL_DB,
  'SUPABASE_URL:', !!process.env.SUPABASE_URL,
  'SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY
);

let db: any = null;

try {
  // Production-ready logic: Prefer Supabase if configured
  const supabaseReady = isSupabaseConfigured();
  
  if (USE_LOCAL_DB) {
    console.log('[DB INIT] ✅ Forced to use local JSON storage (USE_LOCAL_DB=true)');
    db = fileStorage;
  } else if (USE_SUPABASE || supabaseReady) {
    if (!supabaseReady) {
      throw new Error('Supabase environment variables missing or invalid');
    }
    console.log('[DB INIT] ✅ Using Supabase as database (production)');
    db = supabaseStorage;
  } else {
    console.warn('[DB INIT] ⚠️ Supabase not configured. Using local JSON storage as fallback (dev only).');
    db = fileStorage;
  }
} catch (error) {
  console.error('[DB INIT] ❌ Failed to initialize DB. Falling back to local JSON storage. Error:', error);
  db = fileStorage;
}

// Export function to get the active database
export function getDb(): any {
  if (!db) {
    throw new Error('[DB ACCESS] Database not initialized properly.');
  }
  return db;
}

// Optional: Export storages for direct access (debug / testing)
export { fileStorage, supabaseStorage };
