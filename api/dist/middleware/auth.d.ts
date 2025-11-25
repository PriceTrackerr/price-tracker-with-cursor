import { Request, Response, NextFunction } from 'express';
export interface AuthUserInfo {
    uid: string;
    email: string;
    isAdmin: boolean;
}
export interface AuthRequest extends Request {
    user?: AuthUserInfo;
}
export declare const isAdminEmail: (email?: string | null) => boolean;
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.d.ts.map