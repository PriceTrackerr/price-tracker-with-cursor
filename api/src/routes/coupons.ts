import express, { Request, Response } from 'express';
import freeCouponService from '../services/freeCouponService';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/coupons/find
 * Find free coupons for a store or product
 * Query param: ?query=nike
 */
router.get('/find', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { query } = req.query;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Query parameter is required'
            });
        }

        const coupons = await freeCouponService.findCoupons(query);

        return res.json({
            success: true,
            data: coupons,
            count: coupons.length,
            message: coupons.length > 0
                ? `Found ${coupons.length} coupons`
                : 'No coupons found right now'
        });

    } catch (error) {
        console.error('❌ Error finding coupons:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to find coupons'
        });
    }
});

export default router;
