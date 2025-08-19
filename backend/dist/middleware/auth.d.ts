import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email: string;
    };
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.d.ts.map