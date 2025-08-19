"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const serviceAccountKey_json_1 = __importDefault(require("./serviceAccountKey.json"));
const storage_1 = __importDefault(require("./storage"));
const USE_LOCAL_DB = process.env.USE_LOCAL_DB === 'true';
let db = null;
if (!USE_LOCAL_DB) {
    if (!firebase_admin_1.default.apps.length) {
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccountKey_json_1.default),
        });
    }
    db = firebase_admin_1.default.firestore();
}
function getDb() {
    return storage_1.default;
}
//# sourceMappingURL=firebase.js.map