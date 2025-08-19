"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const storage_1 = __importDefault(require("../config/storage"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const emailService_1 = __importDefault(require("../services/emailService"));
const auth_1 = require("../middleware/auth");
const emailService = new emailService_1.default();
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Signup attempt for email:', email);
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }
        const userExists = await storage_1.default.getUserByEmail(email);
        if (userExists) {
            console.log('Email already exists:', email);
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }
        const hash = await bcryptjs_1.default.hash(password, 10);
        const userData = {
            email,
            password: hash,
            username: email.split('@')[0],
        };
        const userId = await storage_1.default.addUser(userData);
        const token = jsonwebtoken_1.default.sign({ uid: userId, email }, JWT_SECRET, { expiresIn: '7d' });
        try {
            await emailService.sendWelcomeEmail(email, userData.username);
        }
        catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }
        console.log('User created successfully:', userId);
        return res.json({
            success: true,
            data: {
                user: { uid: userId, ...userData },
                token
            },
            message: 'User registered successfully'
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }
        const user = await storage_1.default.getUserByEmail(email);
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }
        if (user.role === 'banned') {
            console.log('Banned user attempted login:', email);
            return res.status(403).json({ success: false, message: 'Account has been suspended' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            console.log('Invalid password for user:', email);
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }
        await storage_1.default.updateUser(user.id, { lastLogin: new Date().toISOString() });
        const token = jsonwebtoken_1.default.sign({ uid: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        console.log('User logged in successfully:', user.id);
        return res.json({
            success: true,
            data: {
                user: { uid: user.id, email: user.email, username: user.username },
                token
            },
            message: 'Login successful'
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.get('/me', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(auth.replace('Bearer ', ''), JWT_SECRET);
        const user = await storage_1.default.getUserById(decoded.uid);
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        if (user.role === 'banned') {
            return res.status(403).json({ success: false, message: 'Account has been suspended' });
        }
        if (!user.notificationSettings) {
            user.notificationSettings = {
                priceDrops: true,
                newProducts: true,
                weeklySummary: true,
            };
        }
        if (!user.privacySettings) {
            user.privacySettings = {
                shareData: false,
                analytics: true,
            };
        }
        if (!user.preferences) {
            user.preferences = {
                currency: 'USD',
                language: 'en',
            };
        }
        return res.json({ success: true, user: { id: decoded.uid, email: user.email, username: user.username, notificationSettings: user.notificationSettings, privacySettings: user.privacySettings, preferences: user.preferences } });
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
        const decoded = jsonwebtoken_1.default.verify(auth.replace('Bearer ', ''), JWT_SECRET);
        const user = await storage_1.default.getUserById(decoded.uid);
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        if (user.role === 'banned') {
            return res.status(403).json({ success: false, message: 'Account has been suspended' });
        }
        const valid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
        const hash = await bcryptjs_1.default.hash(newPassword, 10);
        await storage_1.default.updateUser(user.id, { password: hash });
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
        const decoded = jsonwebtoken_1.default.verify(auth.replace('Bearer ', ''), JWT_SECRET);
        const user = await storage_1.default.getUserById(decoded.uid);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.role === 'banned') {
            return res.status(403).json({ success: false, message: 'Account has been suspended' });
        }
        const update = {};
        if (notificationSettings)
            update.notificationSettings = notificationSettings;
        if (privacySettings)
            update.privacySettings = privacySettings;
        if (preferences)
            update.preferences = preferences;
        await storage_1.default.updateUser(user.id, update);
        return res.json({ success: true, message: 'Preferences updated' });
    }
    catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token or error updating preferences' });
    }
});
router.get('/', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(auth.replace('Bearer ', ''), JWT_SECRET);
        const user = await storage_1.default.getUserById(decoded.uid);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }
        const data = storage_1.default.readData();
        const users = data.users || [];
        const usersToReturn = users.map((u) => ({
            id: u.id,
            email: u.email,
            username: u.username,
            role: u.role || 'user',
            createdAt: u.createdAt,
            lastLogin: u.lastLogin
        }));
        return res.json({ success: true, users: usersToReturn });
    }
    catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});
router.get('/admin/analytics', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(auth.replace('Bearer ', ''), JWT_SECRET);
        const user = await storage_1.default.getUserById(decoded.uid);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }
        const data = storage_1.default.readData();
        const users = data.users || [];
        const products = data.products || [];
        const alerts = data.alerts || [];
        const recentProducts = [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
        const recentUsers = [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
        const recentAlerts = [...alerts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
        return res.json({
            success: true,
            data: {
                totalUsers: users.length,
                totalProducts: products.length,
                totalAlerts: alerts.length,
                recentProducts,
                recentUsers,
                recentAlerts
            }
        });
    }
    catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});
router.post('/mark-price-drop-seen', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }
        const user = await storage_1.default.getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const seenPriceDropIds = user.seenPriceDropIds || [];
        if (!seenPriceDropIds.includes(productId)) {
            seenPriceDropIds.push(productId);
            await storage_1.default.updateUser(userId, { seenPriceDropIds });
        }
        return res.json({ success: true, message: 'Price drop marked as seen' });
    }
    catch (error) {
        console.error('Error marking price drop as seen:', error);
        return res.status(500).json({ success: false, message: 'Failed to mark price drop as seen' });
    }
});
router.get('/seen-price-drops', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        const user = await storage_1.default.getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.json({
            success: true,
            data: user.seenPriceDropIds || []
        });
    }
    catch (error) {
        console.error('Error fetching seen price drops:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch seen price drops' });
    }
});
router.post('/:userId/ban', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(auth.replace('Bearer ', ''), JWT_SECRET);
        const adminUser = await storage_1.default.getUserById(decoded.uid);
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        const user = await storage_1.default.getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userId === adminUser.id) {
            return res.status(403).json({ success: false, message: 'Cannot ban yourself' });
        }
        if (user.role === 'admin') {
            const allUsers = storage_1.default.readData().users || [];
            const adminUsers = allUsers.filter((u) => u.role === 'admin');
            if (adminUsers.length <= 1) {
                return res.status(403).json({ success: false, message: 'Cannot ban the last admin user' });
            }
        }
        await storage_1.default.updateUser(userId, { role: 'banned' });
        return res.json({ success: true, message: 'User banned successfully' });
    }
    catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});
router.post('/:userId/unban', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(auth.replace('Bearer ', ''), JWT_SECRET);
        const adminUser = await storage_1.default.getUserById(decoded.uid);
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        const user = await storage_1.default.getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.role !== 'banned') {
            return res.status(400).json({ success: false, message: 'User is not banned' });
        }
        await storage_1.default.updateUser(userId, { role: 'user' });
        return res.json({ success: true, message: 'User unbanned successfully' });
    }
    catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});
router.post('/:userId/promote', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(auth.replace('Bearer ', ''), JWT_SECRET);
        const adminUser = await storage_1.default.getUserById(decoded.uid);
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        const user = await storage_1.default.getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'User is already an admin' });
        }
        await storage_1.default.updateUser(userId, { role: 'admin' });
        return res.json({ success: true, message: 'User promoted to admin successfully' });
    }
    catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});
router.post('/:userId/delete', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Missing token' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(auth.replace('Bearer ', ''), JWT_SECRET);
        const adminUser = await storage_1.default.getUserById(decoded.uid);
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        const user = await storage_1.default.getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userId === adminUser.id) {
            return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
        }
        if (user.role === 'admin') {
            const allUsers = storage_1.default.readData().users || [];
            const adminUsers = allUsers.filter((u) => u.role === 'admin');
            if (adminUsers.length <= 1) {
                return res.status(403).json({ success: false, message: 'Cannot delete the last admin user' });
            }
        }
        await storage_1.default.deleteUser(userId);
        return res.json({ success: true, message: 'User deleted successfully' });
    }
    catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map