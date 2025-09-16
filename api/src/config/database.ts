// Database configuration - supports both Supabase and local file storage
import fileStorage from './storage';
import { isSupabaseConfigured } from './supabase';
import supabaseStorage from './supabaseStorage';

const USE_SUPABASE = process.env.USE_SUPABASE === 'true';
const USE_LOCAL_DB = process.env.USE_LOCAL_DB === 'true';
console.log('USE_SUPABASE', USE_SUPABASE, 'USE_LOCAL_DB', USE_LOCAL_DB, 'SUPABASE_URL', !!process.env.SUPABASE_URL, 'SUPABASE_SERVICE_ROLE_KEY', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Choose storage based on configuration
let db: any = null;

try {
	// If explicitly using local DB, honor that
	if (USE_LOCAL_DB) {
		console.log('✅ Using local file storage as database (forced by USE_LOCAL_DB=true)');
		db = fileStorage;
	} else {
		const supabaseIsReady = isSupabaseConfigured();
		if (USE_SUPABASE || supabaseIsReady) {
			if (supabaseIsReady) {
				console.log('✅ Using Supabase as database');
				db = supabaseStorage;
			} else {
				console.log('⚠️  USE_SUPABASE=true but Supabase is not configured. Falling back to local file storage');
				db = fileStorage;
			}
		} else {
			console.log('✅ Using local file storage as database (no Supabase configuration detected)');
			db = fileStorage;
		}
	}
} catch (error) {
	console.error('⚠️  Failed to initialize database selection logic. Falling back to local file storage. Error:', error);
	db = fileStorage;
}

export function getDb(): any {
	return db;
}

// Export storage options for direct access if needed
export { fileStorage };
