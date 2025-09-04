"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileStorage = void 0;
exports.getDb = getDb;
const storage_1 = __importDefault(require("./storage"));
exports.fileStorage = storage_1.default;
const USE_SUPABASE = process.env.USE_SUPABASE === 'true';
const USE_LOCAL_DB = process.env.USE_LOCAL_DB === 'true';
let db = null;
let supabaseStorage = null;
if (USE_SUPABASE) {
    try {
        const { isSupabaseConfigured } = require('./supabase');
        if (isSupabaseConfigured()) {
            supabaseStorage = require('./supabaseStorage').default;
            console.log('✅ Using Supabase as database');
            db = supabaseStorage;
        }
        else {
            console.log('⚠️  Supabase not configured, falling back to local file storage');
            db = storage_1.default;
        }
    }
    catch (error) {
        console.log('⚠️  Failed to load Supabase, falling back to local file storage');
        db = storage_1.default;
    }
}
else if (USE_LOCAL_DB) {
    console.log('✅ Using local file storage as database');
    db = storage_1.default;
}
else {
    console.log('✅ Using local file storage as database (default)');
    db = storage_1.default;
}
function getDb() {
    return db;
}
//# sourceMappingURL=database.js.map