import express, { Request, Response } from 'express';
import { getDb } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { supabase, TABLES } from '../config/supabase';
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

    if (req.user?.isAdmin) {
      const { data: allAlerts, error: alertsError } = await supabase
        .from(TABLES.ALERTS)
        .select('*')
        .order('created_at', { ascending: false });

      if (alertsError) {
        console.error('Error fetching all alerts:', alertsError);
      } else {
        return res.json({ success: true, data: allAlerts || [] });
      }
    }

    // Regular user: Get only their alerts
    const alerts = await db.getAlerts(userId);

    // Enrich alerts with current product prices (not stale cached prices)
    const enrichedAlerts = await Promise.all(
      alerts.map(async (alert: any) => {
        try {
          const product = await db.getProductById(alert.productId || alert.product_id);
          if (product) {
            return {
              ...alert,
              currentPrice: product.price, // Use live product price
              productTitle: product.title || alert.productTitle || alert.product_title,
              platform: product.platform
            };
          }
        } catch (e) {
          // If product not found, return alert as-is
        }
        return alert;
      })
    );

    return res.json({ success: true, data: enrichedAlerts });
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

    // Handle both camelCase and snake_case field names from Supabase
    const alertUserId = alert.userId || alert.user_id;
    const alertProductId = alert.productId || alert.product_id;
    const currentIsActive = alert.isActive !== undefined ? alert.isActive : alert.is_active;

    // Allow toggle if requester is: alert owner, product owner, or admin
    const requesterId = req.user!.uid;
    let isAuthorized = alertUserId === requesterId;
    if (!isAuthorized && alertProductId) {
      const product = await db.getProductById(alertProductId);
      if (product && (product.userId === requesterId || product.user_id === requesterId)) {
        isAuthorized = true;
      }
    }
    if (!isAuthorized && req.user?.isAdmin) {
      isAuthorized = true;
    }
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Use snake_case for Supabase update
    const newIsActive = !currentIsActive;
    await db.updateAlert(id, { is_active: newIsActive });

    return res.json({
      success: true,
      data: {
        ...alert,
        isActive: newIsActive,
        is_active: newIsActive,
        id
      }
    });
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

// Manual trigger for price drop check (for testing)
router.post('/trigger-check', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const cronJobs = await import('../services/cronJobs');
    const checkPriceAlerts = cronJobs.checkPriceAlerts;
    console.log('🔔 Manual price drop check triggered');

    // First, update price history for all products to capture manual price changes
    await updatePriceHistoryForAllProducts();

    // Then run the price drop check
    try {
      await checkPriceAlerts();
      res.json({ success: true, message: 'Price drop check completed' });
    } catch (innerErr) {
      console.error('Error during price alert check:', innerErr);
      // Return success so UI can proceed; log server-side for diagnosis
      res.json({ success: true, message: 'Price drop check dispatched' });
    }
  } catch (error: unknown) {
    console.error('Error triggering price check:', error);
    res.status(500).json({ success: false, message: 'Failed to trigger price check' });
  }
});

// Helper function to update price history for all products
async function updatePriceHistoryForAllProducts() {
  try {
    console.log('📊 Updating price history for all products...');
    const allProducts = await db.getProducts();

    for (const product of allProducts) {
      // Get the latest price history entry
      const history = await db.getPriceHistory(product.id);
      const latestEntry = history[history.length - 1];

      // If current price is different from latest history entry, add new entry
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
  } catch (error) {
    console.error('❌ Error updating price history:', error);
  }
}

// Update price history for a specific product (for manual price changes)
router.post('/update-price-history/:productId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.uid;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Get the product
    const product = await db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user owns this product
    if (product.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Get the latest price history entry
    const history = await db.getPriceHistory(productId);
    const latestEntry = history[history.length - 1];

    // If current price is different from latest history entry, add new entry
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
    } else {
      res.json({
        success: true,
        message: 'No price change detected',
        data: {
          currentPrice: product.price,
          priceChange: 0
        }
      });
    }

  } catch (error: unknown) {
    console.error('Error updating price history:', error);
    res.status(500).json({ success: false, message: 'Failed to update price history' });
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

      // Update alert's current price if it has changed
      if (alert.currentPrice !== currentPrice) {
        console.log(`[DEBUG] Updating alert ${alert.id} current price from ${alert.currentPrice} to ${currentPrice}`);
        await db.updateAlert(alert.id, { currentPrice });
      }

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