"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../config/supabase");
const emailService_1 = __importDefault(require("../services/emailService"));
const emailService = new emailService_1.default();
const router = express_1.default.Router();
const db = (0, database_1.getDb)();
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        if (req.user?.isAdmin) {
            const { data: allAlerts, error: alertsError } = await supabase_1.supabase
                .from(supabase_1.TABLES.ALERTS)
                .select('*')
                .order('created_at', { ascending: false });
            if (alertsError) {
                console.error('Error fetching all alerts:', alertsError);
            }
            else {
                return res.json({ success: true, data: allAlerts || [] });
            }
        }
        const alerts = await db.getAlerts(userId);
        return res.json({ success: true, data: alerts });
    }
    catch (error) {
        console.error('Error fetching alerts:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
    }
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId, targetPrice, email, notifyOnRestock } = req.body;
        const userId = req.user?.uid;
        if (!productId || !targetPrice) {
            return res.status(400).json({ success: false, message: 'Product ID and target price are required' });
        }
        const product = await db.getProductById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        if (product.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const newAlert = {
            productId,
            productTitle: product.title || 'Unknown Product',
            targetPrice: typeof targetPrice === 'string' ? parseFloat(targetPrice) : targetPrice,
            currentPrice: product.price || 0,
            isActive: true,
            email: email || undefined,
            notifyOnRestock: notifyOnRestock || false,
            userId,
        };
        console.log('🔍 Creating alert with data:', newAlert);
        const alertId = await db.addAlert(newAlert);
        console.log('✅ Alert created successfully with ID:', alertId);
        return res.json({ success: true, data: { id: alertId, ...newAlert }, message: 'Alert created successfully' });
    }
    catch (error) {
        console.error('🚨 Error creating alert:', error);
        let errorMessage = 'Failed to create alert';
        if (error instanceof Error) {
            errorMessage = `Failed to create alert: ${error.message}`;
        }
        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/:id/toggle', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Alert ID is required' });
        }
        const alert = await db.getAlertById(id);
        if (!alert) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }
        const requesterId = req.user.uid;
        let isAuthorized = alert.userId === requesterId;
        if (!isAuthorized) {
            const product = await db.getProductById(alert.productId);
            if (product && product.userId === requesterId)
                isAuthorized = true;
        }
        if (!isAuthorized && req.user?.isAdmin) {
            isAuthorized = true;
        }
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await db.updateAlert(id, { isActive: !alert.isActive });
        return res.json({ success: true, data: { ...alert, isActive: !alert.isActive, id } });
    }
    catch (error) {
        console.error('Error toggling alert:', error);
        return res.status(500).json({ success: false, message: 'Failed to toggle alert' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Alert ID is required' });
        }
        const alert = await db.getAlertById(id);
        if (!alert) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }
        if (alert.userId !== req.user.uid) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await db.deleteAlert(id);
        return res.json({ success: true, message: 'Alert deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting alert:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete alert' });
    }
});
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Alert ID is required' });
        }
        const alert = await db.getAlertById(id);
        if (!alert) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }
        if (alert.userId !== req.user.uid) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        return res.json({ success: true, data: { ...alert, id } });
    }
    catch (error) {
        console.error('Error fetching alert:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch alert' });
    }
});
router.post('/trigger-check', auth_1.authMiddleware, async (req, res) => {
    try {
        const cronJobs = await Promise.resolve().then(() => __importStar(require('../services/cronJobs')));
        const checkPriceAlerts = cronJobs.checkPriceAlerts;
        console.log('🔔 Manual price drop check triggered');
        await updatePriceHistoryForAllProducts();
        try {
            await checkPriceAlerts();
            res.json({ success: true, message: 'Price drop check completed' });
        }
        catch (innerErr) {
            console.error('Error during price alert check:', innerErr);
            res.json({ success: true, message: 'Price drop check dispatched' });
        }
    }
    catch (error) {
        console.error('Error triggering price check:', error);
        res.status(500).json({ success: false, message: 'Failed to trigger price check' });
    }
});
async function updatePriceHistoryForAllProducts() {
    try {
        console.log('📊 Updating price history for all products...');
        const allProducts = await db.getProducts();
        for (const product of allProducts) {
            const history = await db.getPriceHistory(product.id);
            const latestEntry = history[history.length - 1];
            if (!latestEntry || latestEntry.price !== product.price) {
                console.log(`📈 Price changed for ${product.title}: ${latestEntry?.price || 'N/A'} → ${product.price}`);
                await db.addPriceHistory({
                    productId: product.id,
                    price: product.price,
                    currency: product.currency || 'USD'
                });
            }
        }
        console.log('✅ Price history updated for all products');
    }
    catch (error) {
        console.error('❌ Error updating price history:', error);
    }
}
router.post('/update-price-history/:productId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user?.uid;
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }
        const product = await db.getProductById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        if (product.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const history = await db.getPriceHistory(productId);
        const latestEntry = history[history.length - 1];
        if (!latestEntry || latestEntry.price !== product.price) {
            console.log(`📈 Price changed for ${product.title}: ${latestEntry?.price || 'N/A'} → ${product.price}`);
            await db.addPriceHistory({
                productId: productId,
                price: product.price,
                currency: product.currency || 'USD'
            });
            res.json({
                success: true,
                message: 'Price history updated',
                data: {
                    previousPrice: latestEntry?.price || null,
                    currentPrice: product.price,
                    priceChange: latestEntry ? product.price - latestEntry.price : 0
                }
            });
        }
        else {
            res.json({
                success: true,
                message: 'No price change detected',
                data: {
                    currentPrice: product.price,
                    priceChange: 0
                }
            });
        }
    }
    catch (error) {
        console.error('Error updating price history:', error);
        res.status(500).json({ success: false, message: 'Failed to update price history' });
    }
});
router.post('/check-price-drops', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const alerts = await db.getAlerts(userId);
        const notifications = [];
        for (const alert of alerts) {
            const product = await db.getProductById(alert.productId);
            if (!product)
                continue;
            const currentPrice = product.price || 0;
            const targetPrice = alert.targetPrice;
            if (alert.currentPrice !== currentPrice) {
                console.log(`[DEBUG] Updating alert ${alert.id} current price from ${alert.currentPrice} to ${currentPrice}`);
                await db.updateAlert(alert.id, { currentPrice });
            }
            if (currentPrice <= targetPrice) {
                const history = await db.getPriceHistory(alert.productId);
                const previousPrice = history[1]?.price || currentPrice;
                if (currentPrice < previousPrice) {
                    if (alert.email) {
                        await emailService.sendPriceDropAlert(alert.email, product.title, currentPrice, previousPrice, product.url, product.platform);
                    }
                    const notificationData = {
                        userId: userId,
                        alertId: alert.id,
                        productId: alert.productId,
                        productTitle: product.title,
                        previousPrice,
                        currentPrice,
                        priceDrop: previousPrice - currentPrice,
                        timestamp: new Date(),
                        type: 'price_drop',
                        isRead: false
                    };
                    await db.addNotification(notificationData);
                    notifications.push(notificationData);
                }
            }
        }
        res.json({
            success: true,
            data: notifications,
            message: `Processed ${alerts.length} alerts, found ${notifications.length} price drops`
        });
        return;
    }
    catch (error) {
        console.error('Error checking price drops:', error);
        res.status(500).json({ success: false, message: 'Failed to check price drops' });
        return;
    }
});
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { targetPrice, email } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Alert ID is required' });
        }
        if (targetPrice === undefined && email === undefined) {
            return res.status(400).json({ success: false, message: 'Nothing to update' });
        }
        const alert = await db.getAlertById(id);
        if (!alert) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }
        if (alert.userId !== req.user.uid) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        const updateData = {};
        if (targetPrice !== undefined)
            updateData.targetPrice = typeof targetPrice === 'string' ? parseFloat(targetPrice) : targetPrice;
        if (email !== undefined)
            updateData.email = email;
        await db.updateAlert(id, updateData);
        return res.json({ success: true, message: 'Alert updated successfully' });
    }
    catch (error) {
        console.error('Error updating alert:', error);
        return res.status(500).json({ success: false, message: 'Failed to update alert' });
    }
});
exports.default = router;
//# sourceMappingURL=alerts.js.map