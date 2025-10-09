import express, { Request, Response } from 'express';
import { supabase, supabasePublic, TABLES, handleSupabaseError } from '../config/supabase';
import EmailService from '../services/emailService';

const emailService = new EmailService();
const router = express.Router();

interface UserData {
  email: string;
  password: string;
  username?: string;
}

// Signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, username = email.split('@')[0] } = req.body as UserData;
    console.log('Signup attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // Check if user exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from(TABLES.USERS)
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      console.log('Email already exists:', email);
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found
      handleSupabaseError(checkError, 'check user');
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabasePublic.auth.signUp({
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

    // Insert into users table
    const { error: insertError } = await supabase.from(TABLES.USERS).insert({
      id: authData.user!.id,
      email,
      username,
      role: 'user',
      notification_settings: { priceDrops: true, newProducts: true, weeklySummary: true },
      privacy_settings: { shareData: false, analytics: true },
      preferences: { currency: 'USD', language: 'en' },
      seen_price_drop_ids: [],
    });

    if (insertError) {
      handleSupabaseError(insertError, 'insert user');
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(email, username);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    console.log('User created successfully:', authData.user!.id);
    return res.json({
      success: true,
      data: {
        user: { uid: authData.user!.id, email, username },
        token: authData.session?.access_token,
        refreshToken: authData.session?.refresh_token,
      },
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: errorMessage });
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

    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('Login error:', error.message);
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const { data: userData, error: userError } = await supabasePublic
      .from(TABLES.USERS)
      .select('*')
      .eq('id', data.user!.id)
      .single();
    if (userError) {
      handleSupabaseError(userError, 'fetch user');
    }

    if (userData.role === 'banned') {
      console.log('Banned user attempted login:', email);
      return res.status(403).json({ success: false, message: 'Account has been suspended' });
    }

    // Update last login
    await supabasePublic.from(TABLES.USERS).update({ last_login: new Date().toISOString() }).eq('id', data.user!.id);

    console.log('User logged in successfully:', data.user!.id);
    return res.json({
      success: true,
      data: {
        user: { uid: data.user!.id, email: data.user!.email, username: userData.username },
        token: data.session!.access_token,
        refreshToken: data.session!.refresh_token,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: errorMessage });
  }
});

// Refresh access token using Supabase refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Missing refreshToken' });
    }

    const { data, error } = await supabasePublic.auth.refreshSession({ refresh_token: refreshToken });
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, message });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }

  try {
    const token = auth.replace('Bearer ', '');
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { data: userData, error: userError } = await supabasePublic
      .from(TABLES.USERS)
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        // User not found in users table, create a basic record
        console.log('User not found in users table, creating basic record for:', user.id);
        const { data: newUser, error: createError } = await supabasePublic
          .from(TABLES.USERS)
          .insert({
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
            role: 'user'
            // Remove created_at and updated_at as they should be auto-generated
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Failed to create user record:', createError);
          console.error('User data:', { id: user.id, email: user.email });
          
          // Fallback: return user data from auth even if DB insert fails
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
      } else {
        handleSupabaseError(userError, 'fetch user');
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
    const token = auth.replace('Bearer ', '');
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Sign in to verify current password
    const { error: signInError } = await supabasePublic.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });
    if (signInError) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Update password
    const { error: updateError } = await supabasePublic.auth.updateUser({ password: newPassword });
    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

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
    const token = auth.replace('Bearer ', '');
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { data: userData, error: userError } = await supabasePublic
      .from(TABLES.USERS)
      .select('*')
      .eq('id', user.id)
      .single();
    if (userError || !userData) {
      handleSupabaseError(userError, 'fetch user');
    }

    if (userData.role === 'banned') {
      return res.status(403).json({ success: false, message: 'Account has been suspended' });
    }

    const update: any = {};
    if (notificationSettings) update.notification_settings = notificationSettings;
    if (privacySettings) update.privacy_settings = privacySettings;
    if (preferences) update.preferences = preferences;
    await supabasePublic.from(TABLES.USERS).update(update).eq('id', user.id);

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
    const token = auth.replace('Bearer ', '');
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { data: userData, error: userError } = await supabasePublic
      .from(TABLES.USERS)
      .select('*')
      .eq('id', user.id)
      .single();
    if (userError || !userData || userData.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { data: users, error: usersError } = await supabase.from(TABLES.USERS).select('id, email, username, role, created_at, last_login');
    if (usersError) {
      handleSupabaseError(usersError, 'fetch users');
    }

    return res.json({ success: true, users });
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
    const token = auth.replace('Bearer ', '');
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { data: userData, error: userError } = await supabasePublic
      .from(TABLES.USERS)
      .select('*')
      .eq('id', user.id)
      .single();
    if (userError || !userData || userData.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { data: users, error: usersError } = await supabase.from(TABLES.USERS).select('*');
    const { data: products, error: productsError } = await supabase.from(TABLES.PRODUCTS).select('*');
    const { data: alerts, error: alertsError } = await supabase.from(TABLES.ALERTS).select('*');
    if (usersError || productsError || alertsError) {
      handleSupabaseError(usersError || productsError || alertsError, 'fetch analytics');
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
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Mark price drop as seen
router.post('/mark-price-drop-seen', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }

  try {
    const token = auth.replace('Bearer ', '');
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { productId } = req.body || {};
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const { data: userData, error: userError } = await supabasePublic
      .from(TABLES.USERS)
      .select('seen_price_drop_ids')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      if (userError.code === 'PGRST116') {
        // User not found in users table, create basic record first
        console.log('User not found in users table for mark-price-drop-seen, creating basic record');
        const { data: newUser, error: createError } = await supabasePublic
          .from(TABLES.USERS)
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
      } else {
        return res.status(500).json({ success: false, message: 'Failed to fetch user' });
      }
    }
    
    if (!userData) return res.status(404).json({ success: false, message: 'User not found' });

    const seenPriceDropIds = userData.seen_price_drop_ids || [];
    if (!seenPriceDropIds.includes(productId)) {
      seenPriceDropIds.push(productId);
      const { error: updErr } = await supabasePublic
        .from(TABLES.USERS)
        .update({ seen_price_drop_ids: seenPriceDropIds })
        .eq('id', user.id);
      if (updErr) return res.status(500).json({ success: false, message: 'Failed to update user' });
    }

    return res.json({ success: true, message: 'Price drop marked as seen' });
  } catch (error) {
    console.error('Error marking price drop as seen:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark price drop as seen' });
  }
});

// Get user's seen price drop IDs
router.get('/seen-price-drops', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }

  try {
    const token = auth.replace('Bearer ', '');
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { data: userData, error: userError } = await supabasePublic
      .from(TABLES.USERS)
      .select('seen_price_drop_ids')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      if (userError.code === 'PGRST116') {
        // User not found in users table, return empty array
        console.log('User not found in users table for seen-price-drops, returning empty array');
        return res.json({
          success: true,
          data: [],
        });
      } else {
        handleSupabaseError(userError, 'fetch user');
      }
    }

    return res.json({
      success: true,
      data: userData?.seen_price_drop_ids || [],
    });
  } catch (error) {
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
    const token = auth.replace('Bearer ', '');
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { data: adminUser, error: adminError } = await supabasePublic
      .from(TABLES.USERS)
      .select('*')
      .eq('id', user.id)
      .single();
    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const { data: targetUser, error: targetError } = await supabasePublic
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();
    if (targetError || !targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (userId === user.id) {
      return res.status(403).json({ success: false, message: 'Cannot ban yourself' });
    }

    if (targetUser.role === 'admin') {
      const { data: allUsers, error: usersError } = await supabase.from(TABLES.USERS).select('*').eq('role', 'admin');
      if (usersError || allUsers.length <= 1) {
        return res.status(403).json({ success: false, message: 'Cannot ban the last admin user' });
      }
    }

    await supabase.from(TABLES.USERS).update({ role: 'banned' }).eq('id', userId);
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
    const token = auth.replace('Bearer ', '');
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { data: adminUser, error: adminError } = await supabasePublic
      .from(TABLES.USERS)
      .select('*')
      .eq('id', user.id)
      .single();
    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const { data: targetUser, error: targetError } = await supabasePublic
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();
    if (targetError || !targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser.role !== 'banned') {
      return res.status(400).json({ success: false, message: 'User is not banned' });
    }

    await supabase.from(TABLES.USERS).update({ role: 'user' }).eq('id', userId);
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
    const token = auth.replace('Bearer ', '');
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { data: adminUser, error: adminError } = await supabasePublic
      .from(TABLES.USERS)
      .select('*')
      .eq('id', user.id)
      .single();
    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const { data: targetUser, error: targetError } = await supabasePublic
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();
    if (targetError || !targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser.role === 'admin') {
      return res.status(403).json({ success: false, message: 'User is already an admin' });
    }

    await supabase.from(TABLES.USERS).update({ role: 'admin' }).eq('id', userId);
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
    const token = auth.replace('Bearer ', '');
    const { data: { user }, error } = await supabasePublic.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { data: adminUser, error: adminError } = await supabasePublic
      .from(TABLES.USERS)
      .select('*')
      .eq('id', user.id)
      .single();
    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const { data: targetUser, error: targetError } = await supabasePublic
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();
    if (targetError || !targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (userId === user.id) {
      return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
    }

    if (targetUser.role === 'admin') {
      const { data: allUsers, error: usersError } = await supabase.from(TABLES.USERS).select('*').eq('role', 'admin');
      if (usersError || allUsers.length <= 1) {
        return res.status(403).json({ success: false, message: 'Cannot delete the last admin user' });
      }
    }

    await supabase.auth.admin.deleteUser(userId);
    await supabase.from(TABLES.USERS).delete().eq('id', userId);
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

export default router;