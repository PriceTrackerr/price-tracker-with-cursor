"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const db = (0, database_1.getDb)();
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        const notifications = await db.getNotifications(userId);
        return res.json({ success: true, data: notifications });
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
});
router.put('/:id/read', auth_1.authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Notification ID is required' });
        }
        const notification = await db.getNotificationById(id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        if (notification.userId !== req.user.uid) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await db.updateNotification(id, { isRead: true });
        return res.json({ success: true, message: 'Notification marked as read' });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
});
router.post('/clear', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        await db.clearNotifications(userId);
        return res.json({ success: true });
    }
    catch (error) {
        console.error('Error clearing notifications:', error);
        return res.status(500).json({ success: false, message: 'Failed to clear notifications' });
    }
});
router.post('/mark-read', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        const notifications = await db.getNotifications(userId);
        for (const notification of notifications) {
            if (!notification.isRead) {
                await db.updateNotification(notification.id, { isRead: true });
            }
        }
        return res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Error marking notifications as read:', error);
        return res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map