// Database configuration - supports both Supabase and local file storage
import fileStorage from './storage';
import { isSupabaseConfigured } from './supabase';
import supabaseStorage from './supabaseStorage';

const USE_SUPABASE = process.env.USE_SUPABASE === 'true';
const USE_LOCAL_DB = process.env.USE_LOCAL_DB === 'true';
const IS_VERCEL = process.env.VERCEL === '1';

// Choose storage based on configuration
let db: any = null;

try {
	console.log('🔍 Database Configuration Debug:');
	console.log('- USE_SUPABASE:', USE_SUPABASE);
	console.log('- USE_LOCAL_DB:', USE_LOCAL_DB);
	console.log('- IS_VERCEL:', IS_VERCEL);
	console.log('- SUPABASE_URL set:', !!process.env.SUPABASE_URL);
	console.log('- SUPABASE_SERVICE_ROLE_KEY set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
	
	// If explicitly using local DB, honor that (but not on Vercel)
	if (USE_LOCAL_DB && !IS_VERCEL) {
		console.log('✅ Using local file storage as database (forced by USE_LOCAL_DB=true)');
		db = fileStorage;
	} else {
		const supabaseIsReady = isSupabaseConfigured();
		console.log('- Supabase configured:', supabaseIsReady);
		
		if (USE_SUPABASE || supabaseIsReady || IS_VERCEL) {
			if (supabaseIsReady) {
				console.log('✅ Using Supabase as database');
				db = supabaseStorage;
			} else {
				console.log('⚠️  Supabase not configured. On Vercel, this will cause errors. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
				console.log('⚠️  Falling back to file storage');
				db = fileStorage;
			}
		} else {
			console.log('✅ Using local file storage as database (no Supabase configuration detected)');
			db = fileStorage;
		}
	}
	
	console.log('✅ Database initialized:', db.constructor.name);
} catch (error) {
	console.error('⚠️  Failed to initialize database selection logic. Error:', error);
	if (IS_VERCEL) {
		console.error('❌ On Vercel, Supabase must be configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
		throw error;
	}
	db = fileStorage;
}

export function getDb(): any {
	return db;
}

// Export storage options for direct access if needed
export { fileStorage };