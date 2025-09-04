// Database configuration - supports both Supabase and local file storage
import fileStorage from './storage';

const USE_SUPABASE = process.env.USE_SUPABASE === 'true';
const USE_LOCAL_DB = process.env.USE_LOCAL_DB === 'true';

// Choose storage based on configuration
let db: any = null;
let supabaseStorage: any = null;

// Only try to load Supabase if explicitly requested
if (USE_SUPABASE) {
  try {
    const { isSupabaseConfigured } = require('./supabase');
    if (isSupabaseConfigured()) {
      supabaseStorage = require('./supabaseStorage').default;
      console.log('✅ Using Supabase as database');
      db = supabaseStorage;
    } else {
      console.log('⚠️  Supabase not configured, falling back to local file storage');
      db = fileStorage;
    }
  } catch (error) {
    console.log('⚠️  Failed to load Supabase, falling back to local file storage');
    db = fileStorage;
  }
} else if (USE_LOCAL_DB) {
  console.log('✅ Using local file storage as database');
  db = fileStorage;
} else {
  console.log('✅ Using local file storage as database (default)');
  db = fileStorage;
}

export function getDb(): any {
  return db;
}

// Export storage options for direct access if needed
export { fileStorage };
