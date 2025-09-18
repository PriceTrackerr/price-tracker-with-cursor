import express, { Request, Response } from 'express';
import { getDb } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import EmailService from '../services/emailService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const emailService = new EmailService();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const db = getDb();

// Signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log('Signup attempt for email:', email);
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    
    // Check if user already exists
    const userExists = await db.getUserByEmail(email);
    if (userExists) {
      console.log('Email already exists:', email);
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    
    // Hash password
    const hash = await bcrypt.hash(password, 10);
    
    // Create user data
    const userData = {
      email,
      password: hash,
      username: email.split('@')[0], // Simple username from email
    };
    
    const userId = await db.addUser(userData);
    const token = jwt.sign({ uid: userId, email }, JWT_SECRET, { expiresIn: '7d' });

    // Send welcome email (don't block on email failure)
    try {
      await emailService.sendWelcomeEmail(email, userData.username);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
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
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    
    const user = await db.getUserByEmail(email);
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    
    // Check if user is banned
    if (user.role === 'banned') {
      console.log('Banned user attempted login:', email);
      return res.status(403).json({ success: false, message: 'Account has been suspended' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    
    // Update last login
    await db.updateUser(user.id, { lastLogin: new Date().toISOString() });
    
    // Generate token
    const token = jwt.sign({ uid: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('User logged in successfully:', user.id);
    return res.json({
      success: true,
      data: {
        user: { uid: user.id, email: user.email, username: user.username },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any;
    const user = await db.getUserById(decoded.uid);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Check if user is banned
    if (user.role === 'banned') {
      return res.status(403).json({ success: false, message: 'Account has been suspended' });
    }
    
    // Add default notificationSettings if missing
    if (!user.notificationSettings) {
      user.notificationSettings = {
        priceDrops: true,
        newProducts: true,
        weeklySummary: true,
      };
    }
    // Add default privacySettings if missing
    if (!user.privacySettings) {
      user.privacySettings = {
        shareData: false,
        analytics: true,
      };
    }
    // Add default preferences if missing
    if (!user.preferences) {
      user.preferences = {
        currency: 'USD',
        language: 'en',
      };
    }
    return res.json({ success: true, user: { id: decoded.uid, email: user.email, username: user.username, notificationSettings: user.notificationSettings, privacySettings: user.privacySettings, preferences: user.preferences } });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Change password
router.post('/change-password', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password required' });
  }
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any;
    const user = await db.getUserById(decoded.uid);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Check if user is banned
    if (user.role === 'banned') {
      return res.status(403).json({ success: false, message: 'Account has been suspended' });
    }
    
    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    // Hash new password
    const hash = await bcrypt.hash(newPassword, 10);
    await db.updateUser(user.id, { password: hash });
    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token or error changing password' });
  }
});

// Update notification, privacy, and preferences
router.post('/preferences', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }
  const { notificationSettings, privacySettings, preferences } = req.body;
  if (!notificationSettings && !privacySettings && !preferences) {
    return res.status(400).json({ success: false, message: 'Missing preferences' });
  }
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any;
    const user = await db.getUserById(decoded.uid);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if user is banned
    if (user.role === 'banned') {
      return res.status(403).json({ success: false, message: 'Account has been suspended' });
    }
    
    const update: any = {};
    if (notificationSettings) update.notificationSettings = notificationSettings;
    if (privacySettings) update.privacySettings = privacySettings;
    if (preferences) update.preferences = preferences;
    await db.updateUser(user.id, update);
    return res.json({ success: true, message: 'Preferences updated' });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token or error updating preferences' });
  }
});

// List all users (admin only)
router.get('/', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any;
    const user = await db.getUserById(decoded.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }
    // Get all users
    const data = (db as any).readData();
    const users = data.users || [];
    // Remove sensitive info
    const usersToReturn = users.map((u: any) => ({ 
      id: u.id, 
      email: u.email, 
      username: u.username, 
      role: u.role || 'user', 
      createdAt: u.createdAt, 
      lastLogin: u.lastLogin 
    }));
    return res.json({ success: true, users: usersToReturn });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Admin analytics endpoint
router.get('/admin/analytics', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any;
    const user = await db.getUserById(decoded.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }
    // Gather stats
    const data = (db as any).readData();
    const users = data.users || [];
    const products = data.products || [];
    const alerts = data.alerts || [];
    // Sort for recent activity
    const recentProducts = [...products].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
    const recentUsers = [...users].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
    const recentAlerts = [...alerts].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
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
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Mark price drop as seen
router.post('/mark-price-drop-seen', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }
    
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Add product ID to seen price drops if not already there
    const seenPriceDropIds = user.seenPriceDropIds || [];
    if (!seenPriceDropIds.includes(productId)) {
      seenPriceDropIds.push(productId);
      await db.updateUser(userId, { seenPriceDropIds });
    }
    
    return res.json({ success: true, message: 'Price drop marked as seen' });
  } catch (error: unknown) {
    console.error('Error marking price drop as seen:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark price drop as seen' });
  }
});

// Get user's seen price drop IDs
router.get('/seen-price-drops', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const user = await db.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    return res.json({ 
      success: true, 
      data: user.seenPriceDropIds || [] 
    });
  } catch (error: unknown) {
    console.error('Error fetching seen price drops:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch seen price drops' });
  }
});

// Admin user management routes
router.post('/:userId/ban', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any;
    const adminUser = await db.getUserById(decoded.uid);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }
    
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent banning yourself
    if (userId === adminUser.id) {
      return res.status(403).json({ success: false, message: 'Cannot ban yourself' });
    }
    
    // If trying to ban an admin, check if they're the last admin
    if (user.role === 'admin') {
      const allUsers = (db as any).readData().users || [];
      const adminUsers = allUsers.filter((u: any) => u.role === 'admin');
      if (adminUsers.length <= 1) {
        return res.status(403).json({ success: false, message: 'Cannot ban the last admin user' });
      }
    }
    
    await db.updateUser(userId, { role: 'banned' });
    return res.json({ success: true, message: 'User banned successfully' });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

router.post('/:userId/unban', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any;
    const adminUser = await db.getUserById(decoded.uid);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }
    
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.role !== 'banned') {
      return res.status(400).json({ success: false, message: 'User is not banned' });
    }
    
    await db.updateUser(userId, { role: 'user' });
    return res.json({ success: true, message: 'User unbanned successfully' });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

router.post('/:userId/promote', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any;
    const adminUser = await db.getUserById(decoded.uid);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }
    
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'User is already an admin' });
    }
    
    await db.updateUser(userId, { role: 'admin' });
    return res.json({ success: true, message: 'User promoted to admin successfully' });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

router.post('/:userId/delete', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as any;
    const adminUser = await db.getUserById(decoded.uid);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }
    
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent deleting yourself
    if (userId === adminUser.id) {
      return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
    }
    
    // If trying to delete an admin, check if they're the last admin
    if (user.role === 'admin') {
      const allUsers = (db as any).readData().users || [];
      const adminUsers = allUsers.filter((u: any) => u.role === 'admin');
      if (adminUsers.length <= 1) {
        return res.status(403).json({ success: false, message: 'Cannot delete the last admin user' });
      }
    }
    
    await db.deleteUser(userId);
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

export default router; 