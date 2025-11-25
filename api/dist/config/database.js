"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
const storage_1 = __importDefault(require("./storage"));
const supabaseStorage_1 = __importDefault(require("./supabaseStorage"));
const supabase_1 = require("./supabase");
function getDb() {
    const forceLocal = process.env.USE_LOCAL_DB === 'true';
    const forceSupabase = process.env.USE_SUPABASE === 'true';
    if (!forceLocal) {
        try {
            if (forceSupabase || (0, supabase_1.isSupabaseConfigured)()) {
                return supabaseStorage_1.default;
            }
        }
        catch (_) {
        }
    }
    return storage_1.default;
}
//# sourceMappingURL=database.js.map