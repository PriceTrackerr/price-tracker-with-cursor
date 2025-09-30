import { Request, Response, NextFunction } from 'express';
import { supabasePublic, TABLES } from '../config/supabase';
import { getDb } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth) {
    console.log('[AUTH] Missing Authorization header');
    return res.status(401).json({ success: false, message: 'Missing token from auth.ts function' });
  }
  try {
    const token = auth.replace('Bearer ', '');
    console.log('[AUTH] Validating Supabase token:', token.substring(0, 20) + '...');

    // Validate access token with Supabase
    const { data: { user: authUser }, error } = await supabasePublic.auth.getUser(token);
    if (error || !authUser) {
      console.log('[AUTH] Supabase token invalid:', error?.message);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Load user from our database
    const db = getDb();
    const user = await db.getUserById(authUser.id);
    if (!user) {
      console.log('[AUTH] User not found for uid:', authUser.id);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if user is banned
    if (user.role === 'banned') {
      console.log('[AUTH] Banned user attempted access:', authUser.id);
      return res.status(403).json({ success: false, message: 'Account has been suspended' });
    }
    
    req.user = { uid: authUser.id, email: authUser.email! };
    console.log('[AUTH] Successfully authenticated user:', authUser.id);
    return next();
  } catch (e) {
    console.log('[AUTH] Token verification failed:', e);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}; 