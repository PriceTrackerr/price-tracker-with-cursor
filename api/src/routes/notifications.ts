import express, { Request, Response } from 'express';
import db from '../config/storage';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all notifications
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const notifications = await db.getNotifications(userId);
    return res.json({ success: true, data: notifications });
  } catch (error: unknown) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Notification ID is required' });
    }
    
    const notification = await db.getNotificationById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    if (notification.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await db.updateNotification(id, { isRead: true });
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: unknown) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

// Add clear notifications endpoint
router.post('/clear', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    await db.clearNotifications(userId);
    return res.json({ success: true });
  } catch (error: unknown) {
    console.error('Error clearing notifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear notifications' });
  }
});

// Mark all notifications as read
router.post('/mark-read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const notifications = await db.getNotifications(userId);
    
    // Mark all unread notifications as read
    for (const notification of notifications) {
      if (!notification.isRead) {
        await db.updateNotification(notification.id, { isRead: true });
      }
    }
    
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: unknown) {
    console.error('Error marking notifications as read:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
});

export default router; 