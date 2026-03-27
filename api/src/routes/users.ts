import express, { Request, Response } from 'express';
import { supabase, supabasePublic, TABLES, handleSupabaseError } from '../config/supabase';
import EmailService from '../services/emailService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const emailService = new EmailService();
const router = express.Router();

const frontendBaseUrl =
  process.env.APP_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  (process.env.SUPABASE_REDIRECT_TO as string | undefined) ||
  'https://price-tracker-with-cursor-web-app.vercel.app';

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
const ADMIN_EMAIL_RAW = process.env.ADMIN_EMAIL || 'realpricetracker94@gmail.com';
const ADMIN_EMAIL = ADMIN_EMAIL_RAW.toLowerCase();
const ADMIN_PASSWORD = 'admin123';

router.post('/login', async (req: Request, res: Response) => {
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

    // Try to sign in
    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('❌ Login error:', error.message);

      // Fallback: Auto-create admin user if login fails and email matches admin email
      if (isAdminLogin && password === ADMIN_PASSWORD) {
        console.log('🔄 Admin login failed, attempting to auto-create admin account...');

        try {
          // Try to sign up - if user exists, signup will fail, but we'll know the account exists
          const { data: signUpData, error: signUpError } = await supabasePublic.auth.signUp({
            email: ADMIN_EMAIL_RAW,
            password: ADMIN_PASSWORD,
            options: {
              data: { username: 'admin' },
            },
          });

          if (signUpError) {
            // User might already exist - check if it's a "user already exists" error
            if (signUpError.message?.toLowerCase().includes('already registered') ||
              signUpError.message?.toLowerCase().includes('already exists') ||
              signUpError.message?.toLowerCase().includes('user already registered')) {
              console.log('⚠️ Admin user already exists in auth, password might be wrong or user needs to be created in users table');
              // User exists in auth but login failed - might be password issue or missing users table entry
              // Try to find user by attempting to get user from users table first
              // Then try login one more time with the exact credentials
              console.log('🔄 Retrying login with exact credentials...');
              const { data: retryData, error: retryError } = await supabasePublic.auth.signInWithPassword({
                email: ADMIN_EMAIL_RAW,
                password: ADMIN_PASSWORD,
              });

              if (!retryError && retryData) {
                console.log('✅ Admin login successful on retry');
                // Ensure user exists in users table
                const { error: upsertError } = await supabasePublic
                  .from(TABLES.USERS)
                  .upsert({
                    id: retryData.user!.id,
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

                await supabasePublic.from(TABLES.USERS).update({ last_login: new Date().toISOString() }).eq('id', retryData.user!.id);

                const { data: userData } = await supabasePublic
                  .from(TABLES.USERS)
                  .select('*')
                  .eq('id', retryData.user!.id)
                  .single();

                return res.json({
                  success: true,
                  data: {
                    user: { uid: retryData.user!.id, email: retryData.user!.email, username: userData?.username || 'admin' },
                    token: retryData.session!.access_token,
                    refreshToken: retryData.session!.refresh_token,
                  },
                  message: 'Login successful',
                });
              }
            }
            console.error('❌ Failed to create/admin admin account:', signUpError.message);
          } else if (signUpData.user) {
            // New admin account created successfully
            console.log('✅ Admin account created in auth');

            // Create user record
            const { error: insertError } = await supabasePublic.from(TABLES.USERS).insert({
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
            } else {
              console.log('✅ Admin user record created');
              // Try login immediately after signup
              const { data: retryData, error: retryError } = await supabasePublic.auth.signInWithPassword({
                email: ADMIN_EMAIL_RAW,
                password: ADMIN_PASSWORD,
              });

              if (!retryError && retryData) {
                console.log('✅ Admin login successful after account creation');
                await supabasePublic.from(TABLES.USERS).update({ last_login: new Date().toISOString() }).eq('id', retryData.user!.id);

                return res.json({
                  success: true,
                  data: {
                    user: { uid: retryData.user!.id, email: retryData.user!.email, username: 'admin' },
                    token: retryData.session!.access_token,
                    refreshToken: retryData.session!.refresh_token,
                  },
                  message: 'Login successful',
                });
              }
            }
          }
        } catch (fallbackError: any) {
          console.error('❌ Fallback admin creation failed:', fallbackError?.message || fallbackError);
        }
      }

      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    // Login successful - fetch user data
    const { data: userData, error: userError } = await supabasePublic
      .from(TABLES.USERS)
      .select('*')
      .eq('id', data.user!.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      // PGRST116 = no rows found - user might not exist in users table yet
      console.log('⚠️ User not found in users table, creating record...');

      // Auto-create user record if missing
      const { error: insertError } = await supabasePublic.from(TABLES.USERS).insert({
        id: data.user!.id,
        email: data.user!.email!,
        username: data.user!.email!.split('@')[0],
        role: data.user!.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user',
        notification_settings: { priceDrops: true, newProducts: true, weeklySummary: true },
        privacy_settings: { shareData: false, analytics: true },
        preferences: { currency: 'USD', language: 'en' },
        seen_price_drop_ids: [],
      });

      if (insertError) {
        console.error('❌ Failed to create user record:', insertError);
        handleSupabaseError(insertError, 'insert user');
      } else {
        console.log('✅ User record created');
        // Fetch the newly created user
        const { data: newUserData } = await supabasePublic
          .from(TABLES.USERS)
          .select('*')
          .eq('id', data.user!.id)
          .single();

        const finalUserData = newUserData || { username: data.user!.email!.split('@')[0], role: 'user' };

        await supabasePublic.from(TABLES.USERS).update({ last_login: new Date().toISOString() }).eq('id', data.user!.id);

        console.log('✅ User logged in successfully:', data.user!.id);
        return res.json({
          success: true,
          data: {
            user: { uid: data.user!.id, email: data.user!.email, username: finalUserData.username },
            token: data.session!.access_token,
            refreshToken: data.session!.refresh_token,
          },
          message: 'Login successful',
        });
      }
    }

    if (userData && userData.role === 'banned') {
      console.log('❌ Banned user attempted login:', email);
      return res.status(403).json({ success: false, message: 'Account has been suspended' });
    }

    // Ensure admin email has admin role
    if (data.user!.email?.toLowerCase() === ADMIN_EMAIL && userData && userData.role !== 'admin') {
      console.log('🔧 Updating admin user role to admin');
      await supabasePublic.from(TABLES.USERS).update({ role: 'admin' }).eq('id', data.user!.id);
      userData.role = 'admin';
    }

    // Update last login
    await supabasePublic.from(TABLES.USERS).update({ last_login: new Date().toISOString() }).eq('id', data.user!.id);

    console.log('✅ User logged in successfully:', data.user!.id, 'Role:', userData?.role || 'user');
    return res.json({
      success: true,
      data: {
        user: { uid: data.user!.id, email: data.user!.email, username: userData?.username || data.user!.email!.split('@')[0] },
        token: data.session!.access_token,
        refreshToken: data.session!.refresh_token,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: errorMessage });
  }
});

// Forgot password - send reset email via Supabase
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!supabasePublic) {
      throw new Error('Supabase public client is not configured');
    }
    const redirectUrl = `${frontendBaseUrl.replace(/\/$/, '')}/reset-password`;
    const { error } = await supabasePublic.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) {
      // Avoid leaking whether email exists; log internally
      console.error('Forgot password error:', error.message);
    }
    return res.json({
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Forgot password failure:', message);
    return res.status(500).json({ success: false, message: 'Unable to process request at this time.' });
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

    // Use service role to read user data (bypass RLS)
    const { data: userData, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        // User not found in users table, create a basic record
        console.log('User not found in users table, creating basic record for:', user.id);
        // Use service role to create user (bypass RLS)
        const { data: newUser, error: createError } = await supabase
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
        subscription: {
          tier: userData.subscription_tier || 'free',
          status: userData.subscription_status || 'inactive',
          renewsAt: userData.subscription_renews_at,
          endsAt: userData.subscription_ends_at
        }
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
      console.log('❌ [PREFERENCES] Invalid auth token');
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    console.log('✅ [PREFERENCES] Valid auth token for user:', user.email);

    // Use service role to read user data (bypass RLS)
    const { data: userData, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        // User not found in users table, create a basic record
        console.log('⚠️ [PREFERENCES] User not found in users table, creating record for:', user.id);
        // Use service role client to bypass RLS policies
        const { data: newUser, error: createError } = await supabase
          .from(TABLES.USERS)
          .insert({
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
            role: 'user',
            notification_settings: { priceDrops: true, newProducts: true, weeklySummary: true },
            privacy_settings: { shareData: false, analytics: true },
            preferences: { currency: 'USD', language: 'en' },
            seen_price_drop_ids: [],
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ [PREFERENCES] Failed to create user record:', createError);
          return res.status(500).json({ success: false, message: 'Failed to create user record' });
        }

        console.log('✅ [PREFERENCES] User record created successfully');

        // Now update with the provided preferences (use service role for consistency)
        const update: any = {};
        if (notificationSettings) update.notification_settings = notificationSettings;
        if (privacySettings) update.privacy_settings = privacySettings;
        if (preferences) update.preferences = preferences;

        await supabase.from(TABLES.USERS).update(update).eq('id', user.id);
        console.log('✅ [PREFERENCES] Preferences updated for newly created user');

        return res.json({ success: true, message: 'Preferences updated' });
      } else {
        console.error('❌ [PREFERENCES] Database error:', userError);
        handleSupabaseError(userError, 'fetch user');
      }
    }

    if (!userData) {
      console.log('❌ [PREFERENCES] User data is null');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (userData.role === 'banned') {
      console.log('❌ [PREFERENCES] Banned user attempted to update preferences:', user.email);
      return res.status(403).json({ success: false, message: 'Account has been suspended' });
    }

    const update: any = {};
    if (notificationSettings) update.notification_settings = notificationSettings;
    if (privacySettings) update.privacy_settings = privacySettings;
    if (preferences) update.preferences = preferences;

    await supabase.from(TABLES.USERS).update(update).eq('id', user.id);
    console.log('✅ [PREFERENCES] Preferences updated successfully for:', user.email);

    return res.json({ success: true, message: 'Preferences updated' });
  } catch (e) {
    console.error('❌ [PREFERENCES] Unexpected error:', e);
    return res.status(500).json({ success: false, message: 'Error updating preferences' });
  }
});

// List all users (admin only)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.isAdmin) {
      const { data: users, error: usersError } = await supabase
        .from(TABLES.USERS)
        .select('id, email, username, role, created_at, last_login');

      if (usersError) {
        handleSupabaseError(usersError, 'fetch users');
      }

      return res.json({ success: true, users: users || [] });
    }

    const { data: userRecord, error: singleError } = await supabase
      .from(TABLES.USERS)
      .select('id, email, username, role, created_at, last_login')
      .eq('id', req.user!.uid)
      .maybeSingle();

    if (singleError && singleError.code !== 'PGRST116') {
      handleSupabaseError(singleError, 'fetch user');
    }

    return res.json({
      success: true,
      users: userRecord ? [userRecord] : [],
    });
  } catch (e) {
    console.error('Failed to fetch users list:', e);
    return res.status(500).json({ success: false, message: 'Failed to load users' });
  }
});

// Admin analytics endpoint
router.get('/admin/analytics', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { data: users, error: usersError } = await supabase.from(TABLES.USERS).select('*');
    const { data: products, error: productsError } = await supabase.from(TABLES.PRODUCTS).select('*');
    const { data: alerts, error: alertsError } = await supabase.from(TABLES.ALERTS).select('*');
    if (usersError || productsError || alertsError) {
      handleSupabaseError(usersError || productsError || alertsError, 'fetch analytics');
    }

    // Calculate user growth by month (last 6 months)
    const now = new Date();
    const userGrowthData: { month: string; count: number }[] = [];
    const productTrendsData: { month: string; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthDate.toLocaleString('default', { month: 'short', year: '2-digit' });

      const usersInMonth = users.filter((u: any) => {
        const createdAt = new Date(u.created_at);
        return createdAt >= monthDate && createdAt <= monthEnd;
      }).length;

      const productsInMonth = products.filter((p: any) => {
        const createdAt = new Date(p.created_at);
        return createdAt >= monthDate && createdAt <= monthEnd;
      }).length;

      userGrowthData.push({ month: monthName, count: usersInMonth });
      productTrendsData.push({ month: monthName, count: productsInMonth });
    }

    // Calculate platform distribution
    const platformCounts: Record<string, number> = {};
    products.forEach((p: any) => {
      const platform = p.platform || 'Other';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    const totalProducts = products.length;
    const platformDistribution = Object.entries(platformCounts)
      .map(([platform, count]) => ({
        platform,
        count,
        percentage: totalProducts > 0 ? Math.round((count / totalProducts) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate growth percentages (current month vs previous month)
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const usersThisMonth = users.filter((u: any) => new Date(u.created_at) >= currentMonthStart).length;
    const usersLastMonth = users.filter((u: any) => {
      const d = new Date(u.created_at);
      return d >= prevMonthStart && d <= prevMonthEnd;
    }).length;
    const userGrowth = usersLastMonth > 0 ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100) : 100;

    const productsThisMonth = products.filter((p: any) => new Date(p.created_at) >= currentMonthStart).length;
    const productsLastMonth = products.filter((p: any) => {
      const d = new Date(p.created_at);
      return d >= prevMonthStart && d <= prevMonthEnd;
    }).length;
    const productGrowth = productsLastMonth > 0 ? Math.round(((productsThisMonth - productsLastMonth) / productsLastMonth) * 100) : 100;

    const activeAlerts = alerts.filter((a: any) => a.is_active).length;

    // Top products by tracking
    const topProducts = [...products]
      .sort((a, b) => (b.price || 0) - (a.price || 0))
      .slice(0, 5)
      .map((p: any) => ({
        name: p.title?.substring(0, 30) + (p.title?.length > 30 ? '...' : '') || 'Unknown',
        platform: p.platform || 'Unknown',
        price: p.price || 0
      }));

    // Recent activity
    const recentActivity = [
      ...users.slice(-3).map((u: any) => ({
        action: 'New user registered',
        user: u.email || 'Unknown',
        time: formatTimeAgo(new Date(u.created_at)),
        type: 'user'
      })),
      ...products.slice(-2).map((p: any) => ({
        action: 'New product tracked',
        product: p.title?.substring(0, 20) || 'Unknown Product',
        time: formatTimeAgo(new Date(p.created_at)),
        type: 'product'
      }))
    ].sort((a, b) => {
      // Sort by most recent (this is approximate since we use formatted strings)
      return 0;
    }).slice(0, 5);

    const recentProducts = [...products].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
    const recentUsers = [...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
    const recentAlerts = [...alerts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    // Calculate quick stats
    const avgPrice = totalProducts > 0 ? Math.round(products.reduce((sum: number, p: any) => sum + (p.price || 0), 0) / totalProducts) : 0;

    return res.json({
      success: true,
      data: {
        // Summary metrics
        totalUsers: users.length,
        totalProducts: products.length,
        totalAlerts: alerts.length,
        activeAlerts,
        totalRevenue: 0, // Placeholder until LemonSqueezy integration

        // Growth percentages
        userGrowth,
        productGrowth,
        revenueGrowth: 0, // Placeholder
        alertGrowth: 0, // Can be calculated if needed

        // Chart data
        userGrowthData,
        productTrendsData,
        platformDistribution,

        // Lists
        topProducts,
        recentActivity,
        recentProducts,
        recentUsers,
        recentAlerts,

        // Quick stats
        avgPrice,
        priceDropRate: 23, // Can be calculated from price history if needed
      },
    });
  } catch (e) {
    console.error('Failed to fetch admin analytics:', e);
    return res.status(500).json({ success: false, message: 'Failed to load analytics' });
  }
});

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

// Get user's seen price drop IDs

// Admin user management routes
router.post('/:userId/ban', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const { data: targetUser, error: targetError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();
    if (targetError || !targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (userId === req.user!.uid) {
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

router.post('/:userId/unban', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const { data: targetUser, error: targetError } = await supabase
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

router.post('/:userId/promote', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const { data: targetUser, error: targetError } = await supabase
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

router.post('/:userId/delete', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const { data: targetUser, error: targetError } = await supabase
      .from(TABLES.USERS)
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

// Get seen price drops
router.get('/seen-price-drops', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    console.log('[USERS] Fetching seen price drops for user:', req.user?.email);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { data: user, error } = await supabase
      .from(TABLES.USERS)
      .select('seen_price_drop_ids')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[USERS] Error fetching seen  price drops:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch seen price drops' });
    }

    const rawSeenIds = user?.seen_price_drop_ids || [];

    // Filter out orphaned IDs: only keep IDs that correspond to existing products
    if (rawSeenIds.length > 0) {
      const { data: existingProducts, error: productsError } = await supabase
        .from(TABLES.PRODUCTS)
        .select('id')
        .in('id', rawSeenIds);

      if (productsError) {
        console.warn('[USERS] Error checking product existence:', productsError);
        // Return rawSeenIds if we can't check
        return res.json({ success: true, data: rawSeenIds });
      }

      const existingProductIds = existingProducts.map((p: { id: string }) => p.id);
      const validSeenIds = rawSeenIds.filter((id: string) => existingProductIds.includes(id));

      // If orphaned IDs were found, clean them from the database
      if (validSeenIds.length !== rawSeenIds.length) {
        console.log(`[USERS] Found ${rawSeenIds.length - validSeenIds.length} orphaned price drop IDs - cleaning...`);
        await supabase
          .from(TABLES.USERS)
          .update({ seen_price_drop_ids: validSeenIds })
          .eq('id', userId);
      }

      console.log(`[USERS] Seen price drops (after cleanup): ${validSeenIds.length} valid IDs`);
      return res.json({ success: true, data: validSeenIds });
    }

    console.log('[USERS] No seen price drops');
    return res.json({ success: true, data: [] });
  } catch (error) {
    console.error('[USERS] Error in seen-price-drops endpoint:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Mark price drop as seen
router.post('/mark-price-drop-seen', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const { productId } = req.body;
    console.log('[USERS] Marking price drop as seen for user:', req.user?.email, ', productId:', productId);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Get current seen price drops (use service role to bypass RLS)
    const { data: user, error: fetchError } = await supabase
      .from(TABLES.USERS)
      .select('seen_price_drop_ids')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      console.error('[USERS] Error fetching user:', fetchError);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentSeenIds = user?.seen_price_drop_ids || [];

    // Add productId if not already present
    if (!currentSeenIds.includes(productId)) {
      const updatedSeenIds = [...currentSeenIds, productId];

      const { error: updateError } = await supabase
        .from(TABLES.USERS)
        .update({ seen_price_drop_ids: updatedSeenIds })
        .eq('id', userId);

      if (updateError) {
        console.error('[USERS] Error updating seen price drops:', updateError);
        return res.status(500).json({ success: false, message: 'Failed to update seen price drops' });
      }

      console.log('[USERS] Successfully marked price drop as seen. Updated array:', updatedSeenIds);
    } else {
      console.log('[USERS] Price drop already marked as seen');
    }

    return res.json({ success: true, message: 'Price drop marked as seen' });
  } catch (error) {
    console.error('[USERS] Error in mark-price-drop-seen endpoint:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;