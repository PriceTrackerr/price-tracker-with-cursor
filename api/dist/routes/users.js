"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_1 = require("../config/supabase");
const emailService_1 = __importDefault(require("../services/emailService"));
const auth_1 = require("../middleware/auth");
const emailService = new emailService_1.default();
const router = express_1.default.Router();
const frontendBaseUrl = process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    process.env.SUPABASE_REDIRECT_TO ||
    'http://localhost:5173';
router.post('/signup', async (req, res) => {
    try {
        const { email, password, username = email.split('@')[0] } = req.body;
        console.log('Signup attempt for email:', email);
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }
        const { data: existingUser, error: checkError } = await supabase_1.supabase
            .from(supabase_1.TABLES.USERS)
            .select('email')
            .eq('email', email)
            .single();
        if (existingUser) {
            console.log('Email already exists:', email);
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }
        if (checkError && checkError.code !== 'PGRST116') {
            (0, supabase_1.handleSupabaseError)(checkError, 'check user');
        }
        const { data: authData, error: authError } = await supabase_1.supabasePublic.auth.signUp({
            email,
            password,
            options: {
                data: { username },
            },
        });
        if (authError) {
            console.error('Signup error:', authError.message);
            return res.status(400).json({ success: false, message: authError.message });
        }
        const { error: insertError } = await supabase_1.supabase.from(supabase_1.TABLES.USERS).insert({
            id: authData.user.id,
            email,
            username,
            role: 'user',
            notification_settings: { priceDrops: true, newProducts: true, weeklySummary: true },
            privacy_settings: { shareData: false, analytics: true },
            preferences: { currency: 'USD', language: 'en' },
            seen_price_drop_ids: [],
        });
        if (insertError) {
            (0, supabase_1.handleSupabaseError)(insertError, 'insert user');
        }
        try {
            await emailService.sendWelcomeEmail(email, username);
        }
        catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }
        console.log('User created successfully:', authData.user.id);
        return res.json({
            success: true,
            data: {
                user: { uid: authData.user.id, email, username },
                token: authData.session?.access_token,
                refreshToken: authData.session?.refresh_token,
            },
            message: 'User registered successfully',
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: errorMessage });
    }
});
const ADMIN_EMAIL_RAW = process.env.ADMIN_EMAIL || 'realpricetracker94@gmail.com';
const ADMIN_EMAIL = ADMIN_EMAIL_RAW.toLowerCase();
const ADMIN_PASSWORD = 'admin123';
router.post('/login', async (req, res) => {
    try {
        const { email: rawEmail, password } = req.body;
        console.log('🔐 Login attempt:', rawEmail);
        console.log('📦 Request body:', JSON.stringify({ email: rawEmail, password: password ? '***' : undefined }));
        if (!rawEmail || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }
        const email = String(rawEmail).trim().toLowerCase();
        const isAdminLogin = email === ADMIN_EMAIL;
        const { data, error } = await supabase_1.supabasePublic.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            console.log('❌ Login error:', error.message);
            if (isAdminLogin && password === ADMIN_PASSWORD) {
                console.log('🔄 Admin login failed, attempting to auto-create admin account...');
                try {
                    const { data: signUpData, error: signUpError } = await supabase_1.supabasePublic.auth.signUp({
                        email: ADMIN_EMAIL_RAW,
                        password: ADMIN_PASSWORD,
                        options: {
                            data: { username: 'admin' },
                        },
                    });
                    if (signUpError) {
                        if (signUpError.message?.toLowerCase().includes('already registered') ||
                            signUpError.message?.toLowerCase().includes('already exists') ||
                            signUpError.message?.toLowerCase().includes('user already registered')) {
                            console.log('⚠️ Admin user already exists in auth, password might be wrong or user needs to be created in users table');
                            console.log('🔄 Retrying login with exact credentials...');
                            const { data: retryData, error: retryError } = await supabase_1.supabasePublic.auth.signInWithPassword({
                                email: ADMIN_EMAIL_RAW,
                                password: ADMIN_PASSWORD,
                            });
                            if (!retryError && retryData) {
                                console.log('✅ Admin login successful on retry');
                                const { error: upsertError } = await supabase_1.supabasePublic
                                    .from(supabase_1.TABLES.USERS)
                                    .upsert({
                                    id: retryData.user.id,
                                    email: ADMIN_EMAIL_RAW,
                                    username: 'admin',
                                    role: 'admin',
                                    notification_settings: { priceDrops: true, newProducts: true, weeklySummary: true },
                                    privacy_settings: { shareData: false, analytics: true },
                                    preferences: { currency: 'USD', language: 'en' },
                                    seen_price_drop_ids: [],
                                }, { onConflict: 'id' });
                                if (upsertError) {
                                    console.error('⚠️ Failed to upsert admin user:', upsertError);
                                }
                                await supabase_1.supabasePublic.from(supabase_1.TABLES.USERS).update({ last_login: new Date().toISOString() }).eq('id', retryData.user.id);
                                const { data: userData } = await supabase_1.supabasePublic
                                    .from(supabase_1.TABLES.USERS)
                                    .select('*')
                                    .eq('id', retryData.user.id)
                                    .single();
                                return res.json({
                                    success: true,
                                    data: {
                                        user: { uid: retryData.user.id, email: retryData.user.email, username: userData?.username || 'admin' },
                                        token: retryData.session.access_token,
                                        refreshToken: retryData.session.refresh_token,
                                    },
                                    message: 'Login successful',
                                });
                            }
                        }
                        console.error('❌ Failed to create/admin admin account:', signUpError.message);
                    }
                    else if (signUpData.user) {
                        console.log('✅ Admin account created in auth');
                        const { error: insertError } = await supabase_1.supabasePublic.from(supabase_1.TABLES.USERS).insert({
                            id: signUpData.user.id,
                            email: ADMIN_EMAIL_RAW,
                            username: 'admin',
                            role: 'admin',
                            notification_settings: { priceDrops: true, newProducts: true, weeklySummary: true },
                            privacy_settings: { shareData: false, analytics: true },
                            preferences: { currency: 'USD', language: 'en' },
                            seen_price_drop_ids: [],
                        });
                        if (insertError) {
                            console.error('❌ Failed to insert admin user:', insertError);
                        }
                        else {
                            console.log('✅ Admin user record created');
                            const { data: retryData, error: retryError } = await supabase_1.supabasePublic.auth.signInWithPassword({
                                email: ADMIN_EMAIL_RAW,
                                password: ADMIN_PASSWORD,
                            });
                            if (!retryError && retryData) {
                                console.log('✅ Admin login successful after account creation');
                                await supabase_1.supabasePublic.from(supabase_1.TABLES.USERS).update({ last_login: new Date().toISOString() }).eq('id', retryData.user.id);
                                return res.json({
                                    success: true,
                                    data: {
                                        user: { uid: retryData.user.id, email: retryData.user.email, username: 'admin' },
                                        token: retryData.session.access_token,
                                        refreshToken: retryData.session.refresh_token,
                                    },
                                    message: 'Login successful',
                                });
                            }
                        }
                    }
                }
                catch (fallbackError) {
                    console.error('❌ Fallback admin creation failed:', fallbackError?.message || fallbackError);
                }
            }
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }
        const { data: userData, error: userError } = await supabase_1.supabasePublic
            .from(supabase_1.TABLES.USERS)
            .select('*')
            .eq('id', data.user.id)
            .single();
        if (userError && userError.code !== 'PGRST116') {
            console.log('⚠️ User not found in users table, creating record...');
            const { error: insertError } = await supabase_1.supabasePublic.from(supabase_1.TABLES.USERS).insert({
                id: data.user.id,
                email: data.user.email,
                username: data.user.email.split('@')[0],
                role: data.user.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user',
                notification_settings: { priceDrops: true, newProducts: true, weeklySummary: true },
                privacy_settings: { shareData: false, analytics: true },
                preferences: { currency: 'USD', language: 'en' },
                seen_price_drop_ids: [],
            });
            if (insertError) {
                console.error('❌ Failed to create user record:', insertError);
                (0, supabase_1.handleSupabaseError)(insertError, 'insert user');
            }
            else {
                console.log('✅ User record created');
                const { data: newUserData } = await supabase_1.supabasePublic
                    .from(supabase_1.TABLES.USERS)
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                const finalUserData = newUserData || { username: data.user.email.split('@')[0], role: 'user' };
                await supabase_1.supabasePublic.from(supabase_1.TABLES.USERS).update({ last_login: new Date().toISOString() }).eq('id', data.user.id);
                console.log('✅ User logged in successfully:', data.user.id);
                return res.json({
                    success: true,
                    data: {
                        user: { uid: data.user.id, email: data.user.email, username: finalUserData.username },
                        token: data.session.access_token,
                        refreshToken: data.session.refresh_token,
                    },
                    message: 'Login successful',
                });
            }
        }
        if (userData && userData.role === 'banned') {
            console.log('❌ Banned user attempted login:', email);
            return res.status(403).json({ success: false, message: 'Account has been suspended' });
        }
        if (data.user.email?.toLowerCase() === ADMIN_EMAIL && userData && userData.role !== 'admin') {
            console.log('🔧 Updating admin user role to admin');
            await supabase_1.supabasePublic.from(supabase_1.TABLES.USERS).update({ role: 'admin' }).eq('id', data.user.id);
            userData.role = 'admin';
        }
        await supabase_1.supabasePublic.from(supabase_1.TABLES.USERS).update({ last_login: new Date().toISOString() }).eq('id', data.user.id);
        console.log('✅ User logged in successfully:', data.user.id, 'Role:', userData?.role || 'user');
        return res.json({
            success: true,
            data: {
                user: { uid: data.user.id, email: data.user.email, username: userData?.username || data.user.email.split('@')[0] },
                token: data.session.access_token,
                refreshToken: data.session.refresh_token,
            },
            message: 'Login successful',
        });
    }
    catch (error) {
        console.error('❌ Login error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: errorMessage });
    }
});
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        if (!supabase_1.supabasePublic) {
            throw new Error('Supabase public client is not configured');
        }
        const redirectUrl = `${frontendBaseUrl.replace(/\/$/, '')}/reset-password`;
        const { error } = await supabase_1.supabasePublic.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
        });
        if (error) {
            console.error('Forgot password error:', error.message);
        }
        return res.json({
            success: true,
            message: 'If an account exists for that email, a reset link has been sent.',
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Forgot password failure:', message);
        return res.status(500).json({ success: false, message: 'Unable to process request at this time.' });
    }
});
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Missing refreshToken' });
        }
        const { data, error } = await supabase_1.supabasePublic.auth.refreshSession({ refresh_token: refreshToken });
        if (error || !data?.session) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }
        return res.json({
            success: true,
            data: {
                token: data.session.access_token,
                refreshToken: data.session.refresh_token,
                user: {
                    uid: data.user?.id,
                    email: data.user?.email,
                }
            }
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({ success: false, message });
    }
});
router.get('/me', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
    try {
        const token = auth.replace('Bearer ', '');
        const { data: { user }, error } = await supabase_1.supabasePublic.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        const { data: userData, error: userError } = await supabase_1.supabasePublic
            .from(supabase_1.TABLES.USERS)
            .select('*')
            .eq('id', user.id)
            .single();
        if (userError) {
            if (userError.code === 'PGRST116') {
                console.log('User not found in users table, creating basic record for:', user.id);
                const { data: newUser, error: createError } = await supabase_1.supabasePublic
                    .from(supabase_1.TABLES.USERS)
                    .insert({
                    id: user.id,
                    email: user.email,
                    username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                    role: 'user'
                })
                    .select()
                    .single();
                if (createError) {
                    console.error('Failed to create user record:', createError);
                    console.error('User data:', { id: user.id, email: user.email });
                    console.log('Falling back to auth user data');
                    return res.json({
                        success: true,
                        user: {
                            id: user.id,
                            email: user.email,
                            username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                            role: 'user',
                            created_at: user.created_at,
                            updated_at: user.updated_at
                        }
                    });
                }
                return res.json({
                    success: true,
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        username: newUser.username,
                        role: newUser.role,
                        created_at: newUser.created_at,
                        updated_at: newUser.updated_at
                    }
                });
            }
            else {
                (0, supabase_1.handleSupabaseError)(userError, 'fetch user');
            }
        }
        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userData.role === 'banned') {
            return res.status(403).json({ success: false, message: 'Account has been suspended' });
        }
        return res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: userData.username,
                notificationSettings: userData.notification_settings,
                privacySettings: userData.privacy_settings,
                preferences: userData.preferences,
            },
        });
    }
    catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});
router.post('/change-password', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current and new password required' });
    }
    try {
        const token = auth.replace('Bearer ', '');
        const { data: { user }, error } = await supabase_1.supabasePublic.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        const { error: signInError } = await supabase_1.supabasePublic.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        });
        if (signInError) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
        const { error: updateError } = await supabase_1.supabasePublic.auth.updateUser({ password: newPassword });
        if (updateError) {
            return res.status(400).json({ success: false, message: updateError.message });
        }
        return res.json({ success: true, message: 'Password changed successfully' });
    }
    catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token or error changing password' });
    }
});
router.post('/preferences', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
    const { notificationSettings, privacySettings, preferences } = req.body;
    if (!notificationSettings && !privacySettings && !preferences) {
        return res.status(400).json({ success: false, message: 'Missing preferences' });
    }
    try {
        const token = auth.replace('Bearer ', '');
        const { data: { user }, error } = await supabase_1.supabasePublic.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        const { data: userData, error: userError } = await supabase_1.supabasePublic
            .from(supabase_1.TABLES.USERS)
            .select('*')
            .eq('id', user.id)
            .single();
        if (userError || !userData) {
            (0, supabase_1.handleSupabaseError)(userError, 'fetch user');
        }
        if (userData.role === 'banned') {
            return res.status(403).json({ success: false, message: 'Account has been suspended' });
        }
        const update = {};
        if (notificationSettings)
            update.notification_settings = notificationSettings;
        if (privacySettings)
            update.privacy_settings = privacySettings;
        if (preferences)
            update.preferences = preferences;
        await supabase_1.supabasePublic.from(supabase_1.TABLES.USERS).update(update).eq('id', user.id);
        return res.json({ success: true, message: 'Preferences updated' });
    }
    catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token or error updating preferences' });
    }
});
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        if (req.user?.isAdmin) {
            const { data: users, error: usersError } = await supabase_1.supabase
                .from(supabase_1.TABLES.USERS)
                .select('id, email, username, role, created_at, last_login');
            if (usersError) {
                (0, supabase_1.handleSupabaseError)(usersError, 'fetch users');
            }
            return res.json({ success: true, users: users || [] });
        }
        const { data: userRecord, error: singleError } = await supabase_1.supabase
            .from(supabase_1.TABLES.USERS)
            .select('id, email, username, role, created_at, last_login')
            .eq('id', req.user.uid)
            .maybeSingle();
        if (singleError && singleError.code !== 'PGRST116') {
            (0, supabase_1.handleSupabaseError)(singleError, 'fetch user');
        }
        return res.json({
            success: true,
            users: userRecord ? [userRecord] : [],
        });
    }
    catch (e) {
        console.error('Failed to fetch users list:', e);
        return res.status(500).json({ success: false, message: 'Failed to load users' });
    }
});
router.get('/admin/analytics', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user?.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }
        const { data: users, error: usersError } = await supabase_1.supabase.from(supabase_1.TABLES.USERS).select('*');
        const { data: products, error: productsError } = await supabase_1.supabase.from(supabase_1.TABLES.PRODUCTS).select('*');
        const { data: alerts, error: alertsError } = await supabase_1.supabase.from(supabase_1.TABLES.ALERTS).select('*');
        if (usersError || productsError || alertsError) {
            (0, supabase_1.handleSupabaseError)(usersError || productsError || alertsError, 'fetch analytics');
        }
        const recentProducts = [...products].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
        const recentUsers = [...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
        const recentAlerts = [...alerts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
        return res.json({
            success: true,
            data: {
                totalUsers: users.length,
                totalProducts: products.length,
                totalAlerts: alerts.length,
                recentProducts,
                recentUsers,
                recentAlerts,
            },
        });
    }
    catch (e) {
        console.error('Failed to fetch admin analytics:', e);
        return res.status(500).json({ success: false, message: 'Failed to load analytics' });
    }
});
router.post('/mark-price-drop-seen', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
    try {
        const token = auth.replace('Bearer ', '');
        const { data: { user }, error } = await supabase_1.supabasePublic.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        const { productId } = req.body || {};
        if (!productId || typeof productId !== 'string') {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }
        const { data: userData, error: userError } = await supabase_1.supabasePublic
            .from(supabase_1.TABLES.USERS)
            .select('seen_price_drop_ids')
            .eq('id', user.id)
            .single();
        if (userError) {
            if (userError.code === 'PGRST116') {
                console.log('User not found in users table for mark-price-drop-seen, creating basic record');
                const { data: newUser, error: createError } = await supabase_1.supabasePublic
                    .from(supabase_1.TABLES.USERS)
                    .insert({
                    id: user.id,
                    email: user.email,
                    username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                    role: 'user',
                    seen_price_drop_ids: [productId]
                })
                    .select()
                    .single();
                if (createError) {
                    console.error('Failed to create user record for mark-price-drop-seen:', createError);
                    return res.status(500).json({ success: false, message: 'Failed to create user record' });
                }
                return res.json({ success: true, message: 'Price drop marked as seen' });
            }
            else {
                return res.status(500).json({ success: false, message: 'Failed to fetch user' });
            }
        }
        if (!userData)
            return res.status(404).json({ success: false, message: 'User not found' });
        const seenPriceDropIds = userData.seen_price_drop_ids || [];
        if (!seenPriceDropIds.includes(productId)) {
            seenPriceDropIds.push(productId);
            const { error: updErr } = await supabase_1.supabasePublic
                .from(supabase_1.TABLES.USERS)
                .update({ seen_price_drop_ids: seenPriceDropIds })
                .eq('id', user.id);
            if (updErr)
                return res.status(500).json({ success: false, message: 'Failed to update user' });
        }
        return res.json({ success: true, message: 'Price drop marked as seen' });
    }
    catch (error) {
        console.error('Error marking price drop as seen:', error);
        return res.status(500).json({ success: false, message: 'Failed to mark price drop as seen' });
    }
});
router.get('/seen-price-drops', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
    try {
        const token = auth.replace('Bearer ', '');
        const { data: { user }, error } = await supabase_1.supabasePublic.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        const { data: userData, error: userError } = await supabase_1.supabasePublic
            .from(supabase_1.TABLES.USERS)
            .select('seen_price_drop_ids')
            .eq('id', user.id)
            .single();
        if (userError) {
            if (userError.code === 'PGRST116') {
                console.log('User not found in users table for seen-price-drops, returning empty array');
                return res.json({
                    success: true,
                    data: [],
                });
            }
            else {
                (0, supabase_1.handleSupabaseError)(userError, 'fetch user');
            }
        }
        return res.json({
            success: true,
            data: userData?.seen_price_drop_ids || [],
        });
    }
    catch (error) {
        console.error('Error fetching seen price drops:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch seen price drops' });
    }
});
router.post('/:userId/ban', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user?.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        const { data: targetUser, error: targetError } = await supabase_1.supabase
            .from(supabase_1.TABLES.USERS)
            .select('*')
            .eq('id', userId)
            .single();
        if (targetError || !targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userId === req.user.uid) {
            return res.status(403).json({ success: false, message: 'Cannot ban yourself' });
        }
        if (targetUser.role === 'admin') {
            const { data: allUsers, error: usersError } = await supabase_1.supabase.from(supabase_1.TABLES.USERS).select('*').eq('role', 'admin');
            if (usersError || allUsers.length <= 1) {
                return res.status(403).json({ success: false, message: 'Cannot ban the last admin user' });
            }
        }
        await supabase_1.supabase.from(supabase_1.TABLES.USERS).update({ role: 'banned' }).eq('id', userId);
        return res.json({ success: true, message: 'User banned successfully' });
    }
    catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});
router.post('/:userId/unban', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user?.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        const { data: targetUser, error: targetError } = await supabase_1.supabase
            .from(supabase_1.TABLES.USERS)
            .select('*')
            .eq('id', userId)
            .single();
        if (targetError || !targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (targetUser.role !== 'banned') {
            return res.status(400).json({ success: false, message: 'User is not banned' });
        }
        await supabase_1.supabase.from(supabase_1.TABLES.USERS).update({ role: 'user' }).eq('id', userId);
        return res.json({ success: true, message: 'User unbanned successfully' });
    }
    catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});
router.post('/:userId/promote', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user?.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        const { data: targetUser, error: targetError } = await supabase_1.supabase
            .from(supabase_1.TABLES.USERS)
            .select('*')
            .eq('id', userId)
            .single();
        if (targetError || !targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (targetUser.role === 'admin') {
            return res.status(403).json({ success: false, message: 'User is already an admin' });
        }
        await supabase_1.supabase.from(supabase_1.TABLES.USERS).update({ role: 'admin' }).eq('id', userId);
        return res.json({ success: true, message: 'User promoted to admin successfully' });
    }
    catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});
router.post('/:userId/delete', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user?.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        const { data: targetUser, error: targetError } = await supabase_1.supabase
            .from(supabase_1.TABLES.USERS)
            .select('*')
            .eq('id', userId)
            .single();
        if (targetError || !targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userId === req.user?.uid) {
            return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
        }
        if (targetUser.role === 'admin') {
            const { data: allUsers, error: usersError } = await supabase_1.supabase.from(supabase_1.TABLES.USERS).select('*').eq('role', 'admin');
            if (usersError || allUsers.length <= 1) {
                return res.status(403).json({ success: false, message: 'Cannot delete the last admin user' });
            }
        }
        await supabase_1.supabase.auth.admin.deleteUser(userId);
        await supabase_1.supabase.from(supabase_1.TABLES.USERS).delete().eq('id', userId);
        return res.json({ success: true, message: 'User deleted successfully' });
    }
    catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map