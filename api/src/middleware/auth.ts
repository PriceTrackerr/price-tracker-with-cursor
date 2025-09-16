import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/storage';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

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
    console.log('[AUTH] Verifying token:', token.substring(0, 20) + '...');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await db.getUserById(decoded.uid);
    if (!user) {
      console.log('[AUTH] User not found for uid:', decoded.uid);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if user is banned
    if (user.role === 'banned') {
      console.log('[AUTH] Banned user attempted access:', decoded.uid);
      return res.status(403).json({ success: false, message: 'Account has been suspended' });
    }
    
    req.user = { uid: decoded.uid, email: decoded.email };
    console.log('[AUTH] Successfully authenticated user:', decoded.uid);
    return next();
  } catch (e) {
    console.log('[AUTH] Token verification failed:', e);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}; 