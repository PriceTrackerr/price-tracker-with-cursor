"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const storage_1 = __importDefault(require("../config/storage"));
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const authMiddleware = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) {
        console.log('[AUTH] Missing Authorization header');
        return res.status(401).json({ success: false, message: 'Missing token from auth.ts function' });
    }
    try {
        const token = auth.replace('Bearer ', '');
        console.log('[AUTH] Verifying token:', token.substring(0, 20) + '...');
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await storage_1.default.getUserById(decoded.uid);
        if (!user) {
            console.log('[AUTH] User not found for uid:', decoded.uid);
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.role === 'banned') {
            console.log('[AUTH] Banned user attempted access:', decoded.uid);
            return res.status(403).json({ success: false, message: 'Account has been suspended' });
        }
        req.user = { uid: decoded.uid, email: decoded.email };
        console.log('[AUTH] Successfully authenticated user:', decoded.uid);
        return next();
    }
    catch (e) {
        console.log('[AUTH] Token verification failed:', e);
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.js.map