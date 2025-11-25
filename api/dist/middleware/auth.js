"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = exports.isAdminEmail = void 0;
const supabase_1 = require("../config/supabase");
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'realpricetracker94@gmail.com').toLowerCase();
const isAdminEmail = (email) => !!email && email.toLowerCase() === ADMIN_EMAIL;
exports.isAdminEmail = isAdminEmail;
const authMiddleware = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        console.log('[AUTH] Missing Authorization header');
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
    try {
        const token = auth.replace('Bearer ', '');
        console.log('[AUTH] Validating Supabase token:', token.substring(0, 20) + '...');
        const { data: { user: authUser }, error } = await supabase_1.supabasePublic.auth.getUser(token);
        if (error || !authUser) {
            console.log('[AUTH] Supabase token invalid:', error?.message);
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        req.user = {
            uid: authUser.id,
            email: authUser.email || '',
            isAdmin: (0, exports.isAdminEmail)(authUser.email || ''),
        };
        console.log('[AUTH] Successfully authenticated user:', authUser.id, 'Admin:', req.user.isAdmin);
        return next();
    }
    catch (e) {
        console.log('[AUTH] Token verification failed:', e);
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.js.map