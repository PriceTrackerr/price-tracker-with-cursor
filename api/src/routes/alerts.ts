import express, { Request, Response } from 'express';
import { getDb } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import EmailService from '../services/emailService';

const emailService = new EmailService();

const router = express.Router();
const db = getDb();

interface Alert {
  productId: string;
  productTitle: string;
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  email?: string;
  notifyOnRestock?: boolean;
  createdAt: string;
  userId: string;
}

// Get all alerts
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const alerts = await db.getAlerts(userId);
    return res.json({ success: true, data: alerts });
  } catch (error: unknown) {
    console.error('Error fetching alerts:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
  }
});

// Create new alert
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
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
  } catch (error: unknown) {
    console.error('🚨 Error creating alert:', error);
    
    // Provide more detailed error information
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

// Toggle alert status
router.put('/:id/toggle', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Alert ID is required' });
    }
    
    const alert = await db.getAlertById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    
    if (alert.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await db.updateAlert(id, { isActive: !alert.isActive });
    return res.json({ success: true, data: { ...alert, isActive: !alert.isActive, id } });
  } catch (error: unknown) {
    console.error('Error toggling alert:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle alert' });
  }
});

// Delete alert
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Alert ID is required' });
    }
    
    const alert = await db.getAlertById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    
    if (alert.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await db.deleteAlert(id);
    return res.json({ success: true, message: 'Alert deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting alert:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete alert' });
  }
});

// Get alert by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Alert ID is required' });
    }
    
    const alert = await db.getAlertById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    
    if (alert.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    return res.json({ success: true, data: { ...alert, id } });
  } catch (error: unknown) {
    console.error('Error fetching alert:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch alert' });
  }
});

// Check price drops and send notifications
router.post('/check-price-drops', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    // Get all active alerts for the user
    const alerts = await db.getAlerts(userId);
    const notifications = [];
    for (const alert of alerts) {
      // Get product details
      const product = await db.getProductById(alert.productId);
      if (!product) continue;
      const currentPrice = product.price || 0;
      const targetPrice = alert.targetPrice;
      // Check if price has dropped below target
      if (currentPrice <= targetPrice) {
        // Get previous price from price history
        const history = await db.getPriceHistory(alert.productId);
        const previousPrice = history[1]?.price || currentPrice;
        // Only send notification if price actually dropped
        if (currentPrice < previousPrice) {
          // Send email notification
          if (alert.email) {
            await emailService.sendPriceDropAlert(
              alert.email,
              product.title,
              currentPrice,
              previousPrice,
              product.url,
              product.platform
            );
          }
          // Create notification record
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
          // Deactivate alert if it's a one-time alert
          // await db.collection('alerts').doc(alert.id).update({ isActive: false });
        }
      }
    }
    res.json({
      success: true,
      data: notifications,
      message: `Processed ${alerts.length} alerts, found ${notifications.length} price drops`
    });
    return;
  } catch (error) {
    console.error('Error checking price drops:', error);
    res.status(500).json({ success: false, message: 'Failed to check price drops' });
    return;
  }
  // Fallback (should never hit)
  // res.status(500).json({ success: false, message: 'Unknown error' });
});

// Edit alert
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
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
    
    if (alert.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const updateData: any = {};
    if (targetPrice !== undefined) updateData.targetPrice = typeof targetPrice === 'string' ? parseFloat(targetPrice) : targetPrice;
    if (email !== undefined) updateData.email = email;
    await db.updateAlert(id, updateData);
    return res.json({ success: true, message: 'Alert updated successfully' });
  } catch (error) {
    console.error('Error updating alert:', error);
    return res.status(500).json({ success: false, message: 'Failed to update alert' });
  }
});

export default router; 