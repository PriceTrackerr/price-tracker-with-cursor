"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const storage_1 = __importDefault(require("../config/storage"));
const auth_1 = require("../middleware/auth");
const emailService_1 = __importDefault(require("../services/emailService"));
const emailService = new emailService_1.default();
const router = express_1.default.Router();
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        const alerts = await storage_1.default.getAlerts(userId);
        return res.json({ success: true, data: alerts });
    }
    catch (error) {
        console.error('Error fetching alerts:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
    }
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId, targetPrice, email } = req.body;
        const userId = req.user?.uid;
        if (!productId || !targetPrice) {
            return res.status(400).json({ success: false, message: 'Product ID and target price are required' });
        }
        const product = await storage_1.default.getProductById(productId);
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
            userId,
        };
        const alertId = await storage_1.default.addAlert(newAlert);
        return res.json({ success: true, data: { id: alertId, ...newAlert }, message: 'Alert created successfully' });
    }
    catch (error) {
        console.error('Error creating alert:', error);
        return res.status(500).json({ success: false, message: 'Failed to create alert' });
    }
});
router.put('/:id/toggle', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Alert ID is required' });
        }
        const alert = await storage_1.default.getAlertById(id);
        if (!alert) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }
        if (alert.userId !== req.user.uid) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await storage_1.default.updateAlert(id, { isActive: !alert.isActive });
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
        const alert = await storage_1.default.getAlertById(id);
        if (!alert) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }
        if (alert.userId !== req.user.uid) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await storage_1.default.deleteAlert(id);
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
        const alert = await storage_1.default.getAlertById(id);
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
router.post('/check-price-drops', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const alerts = await storage_1.default.getAlerts(userId);
        const notifications = [];
        for (const alert of alerts) {
            const product = await storage_1.default.getProductById(alert.productId);
            if (!product)
                continue;
            const currentPrice = product.price || 0;
            const targetPrice = alert.targetPrice;
            if (currentPrice <= targetPrice) {
                const history = await storage_1.default.getPriceHistory(alert.productId);
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
                    await storage_1.default.addNotification(notificationData);
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
        const alert = await storage_1.default.getAlertById(id);
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
        await storage_1.default.updateAlert(id, updateData);
        return res.json({ success: true, message: 'Alert updated successfully' });
    }
    catch (error) {
        console.error('Error updating alert:', error);
        return res.status(500).json({ success: false, message: 'Failed to update alert' });
    }
});
exports.default = router;
//# sourceMappingURL=alerts.js.map