import { Request, Response, NextFunction } from 'express';
import { supabasePublic } from '../config/supabase';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'realpricetracker94@gmail.com').toLowerCase();

export interface AuthUserInfo {
  uid: string;
  email: string;
  isAdmin: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUserInfo;
}

export const isAdminEmail = (email?: string | null) =>
  !!email && email.toLowerCase() === ADMIN_EMAIL;

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    console.log('[AUTH] Missing Authorization header');
    return res.status(401).json({ success: false, message: 'Missing token' });
  }

  try {
    const token = auth.replace('Bearer ', '');
    console.log('[AUTH] Validating Supabase token:', token.substring(0, 20) + '...');

    const { data: { user: authUser }, error } = await supabasePublic.auth.getUser(token);
    if (error || !authUser) {
      console.log('[AUTH] Supabase token invalid:', error?.message);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    req.user = {
      uid: authUser.id,
      email: authUser.email || '',
      isAdmin: isAdminEmail(authUser.email || ''),
    };

    console.log('[AUTH] Successfully authenticated user:', authUser.id, 'Admin:', req.user.isAdmin);
    return next();
  } catch (e) {
    console.log('[AUTH] Token verification failed:', e);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};