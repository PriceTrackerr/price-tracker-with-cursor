"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileStorage = void 0;
exports.getDb = getDb;
const storage_1 = __importDefault(require("./storage"));
exports.fileStorage = storage_1.default;
const supabase_1 = require("./supabase");
const supabaseStorage_1 = __importDefault(require("./supabaseStorage"));
const USE_SUPABASE = process.env.USE_SUPABASE === 'true';
const USE_LOCAL_DB = process.env.USE_LOCAL_DB === 'true';
let db = null;
try {
    if (USE_LOCAL_DB) {
        console.log('✅ Using local file storage as database (forced by USE_LOCAL_DB=true)');
        db = storage_1.default;
    }
    else {
        const supabaseIsReady = (0, supabase_1.isSupabaseConfigured)();
        if (USE_SUPABASE || supabaseIsReady) {
            if (supabaseIsReady) {
                console.log('✅ Using Supabase as database');
                db = supabaseStorage_1.default;
            }
            else {
                console.log('⚠️  USE_SUPABASE=true but Supabase is not configured. Falling back to local file storage');
                db = storage_1.default;
            }
        }
        else {
            console.log('✅ Using local file storage as database (no Supabase configuration detected)');
            db = storage_1.default;
        }
    }
}
catch (error) {
    console.error('⚠️  Failed to initialize database selection logic. Falling back to local file storage. Error:', error);
    db = storage_1.default;
}
function getDb() {
    return db;
}
//# sourceMappingURL=database.js.map