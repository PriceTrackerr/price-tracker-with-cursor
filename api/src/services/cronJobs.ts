import cron from 'node-cron';
import { getDb } from '../config/database';
import EmailService from './emailService';

const emailService = new EmailService();
const db = getDb();

async function storeDashboardNotification(product: any, alert: any) {
  try {
    // Use camelCase fields - storage layer maps to snake_case
    await db.addNotification({
      productId: product.id,
      userId: alert.userId,
      title: `Price Alert: ${product.title}`,
      message: `Price dropped to $${product.price} (target was $${alert.targetPrice})`,
      type: 'price_drop',
      isRead: false
    });
  } catch (error: any) {
    // Don't fail the whole alert check if notification fails
    console.log('[CRON] Warning: Could not store dashboard notification:', error.message);
  }
}

async function sendBrowserNotification(product: any, alert: any) {
  // Send message to extension for browser notification
  // Note: This would require the extension to be listening for messages
  // For now, we'll log the notification data
  const notificationData = {
    type: 'SHOW_PRICE_ALERT',
    productTitle: product.title,
    currentPrice: product.price,
    targetPrice: alert.targetPrice,
    productUrl: product.url,
    alertId: alert.id,
  };
  // console.log('[BROWSER NOTIFY] Notification data:', notificationData);
  // TODO: Implement actual extension messaging if needed
}

export async function checkPriceAlerts() {
  const alerts = await db.getAllAlerts();
  console.log(`[DEBUG] Loaded ${alerts.length} alerts`);

  // Group price drops by user email for consolidated emails
  const priceDropsByUser: {
    [email: string]: Array<{
      productTitle: string;
      currentPrice: number;
      previousPrice: number;
      productUrl: string;
      platform: 'amazon' | 'aliexpress' | 'ebay' | 'walmart' | 'shein' | 'bestbuy' | 'target';
      alert: any;
      product: any;
    }>
  } = {};

  for (const alert of alerts) {
    console.log(`[DEBUG] Checking alert ${alert.id} for product ${alert.productId}`);
    // Get product details
    const product = await db.getProductById(alert.productId);
    if (!product) {
      console.log(`[DEBUG] Product not found for alert ${alert.id}`);
      continue;
    }
    const currentPrice = product.price || 0;
    const targetPrice = alert.targetPrice;

    console.log(`[DEBUG] Alert ${alert.id}: currentPrice=${currentPrice}, targetPrice=${targetPrice}`);

    // --- Price Drop Alert ---
    // Check if current price is at or below target
    if (currentPrice <= targetPrice) {
      // Get previous price from price history
      let previousPrice = currentPrice;
      const history = await db.getPriceHistory(alert.productId);
      previousPrice = history.length > 1 ? history[history.length - 2]?.price || currentPrice : currentPrice;
      console.log(`[DEBUG] Alert ${alert.id}: currentPrice=${currentPrice}, targetPrice=${targetPrice}, previousPrice=${previousPrice}`);

      // Trigger alert if price is at/below target and it hasn't been triggered recently (within 24 hours)
      const lastTriggered = alert.triggeredAt ? new Date(alert.triggeredAt).getTime() : 0;
      const hoursSinceTriggered = (Date.now() - lastTriggered) / (1000 * 60 * 60);
      const canTrigger = hoursSinceTriggered > 24; // Only trigger once per 24 hours
      const isPriceDrop = currentPrice < previousPrice;

      console.log(`[DEBUG] Alert ${alert.id}: canTrigger=${canTrigger}, isPriceDrop=${isPriceDrop}, hoursSinceTriggered=${hoursSinceTriggered.toFixed(1)}`);

      // Send notification if price is at/below target and (hasn't triggered recently OR price actually dropped)
      if (canTrigger || isPriceDrop) {
        console.log(`[DEBUG] Price drop detected for alert ${alert.id} (product ${product.title})`);
        // Send email: use alert.email if present, otherwise fetch user by alert.userId
        let recipientEmail = alert.email;
        if (!recipientEmail && alert.userId) {
          const user = await db.getUserById(alert.userId);
          if (user && user.email && user.role !== 'banned') recipientEmail = user.email;
        }
        if (recipientEmail) {
          // Add to consolidated email list
          if (!priceDropsByUser[recipientEmail]) {
            priceDropsByUser[recipientEmail] = [];
          }
          priceDropsByUser[recipientEmail]!.push({
            productTitle: product.title,
            currentPrice,
            previousPrice,
            productUrl: product.url,
            platform: product.platform,
            alert,
            product
          });
          console.log(`[ALERT] Added price drop for ${product.title} to consolidated email for ${recipientEmail}`);
        }
        // Add notification
        let notificationEmail = recipientEmail;
        if (!notificationEmail && alert.userId) {
          const user = await db.getUserById(alert.userId);
          if (user && user.email && user.role !== 'banned') notificationEmail = user.email;
        }
        if (notificationEmail) {
          await storeDashboardNotification({ ...product, email: notificationEmail }, alert);
        }
        await sendBrowserNotification(product, alert);

        // Try to mark alert as triggered (may fail if schema doesn't have these columns)
        try {
          await db.updateAlert(alert.id, { triggered_at: new Date().toISOString() });
        } catch (e: any) {
          console.log('[CRON] Warning: Could not update alert triggered_at:', e.message);
        }

        // Add price history entry
        try {
          await db.addPriceHistory({
            productId: product.id,
            price: currentPrice,
            currency: product.currency || '$',
          });
        } catch (e: any) {
          console.log('[CRON] Warning: Could not add price history:', e.message);
        }
      } else {
        console.log(`[DEBUG] No price drop for alert ${alert.id}: currentPrice (${currentPrice}) >= previousPrice (${previousPrice})`);
      }
    } else {
      console.log(`[DEBUG] No price drop for alert ${alert.id}: currentPrice (${currentPrice}) > targetPrice (${targetPrice})`);
    }
    // --- Restock Alert (new) ---
    if ((alert.restockAlert) && product.stockStatus === 'in_stock' && product.previousStockStatus === 'out_of_stock') {
      // Check if user is banned before sending restock alert
      let shouldSendRestockAlert = false;
      if (alert.email) {
        shouldSendRestockAlert = true;
      } else if (alert.userId) {
        const user = await db.getUserById(alert.userId);
        if (user && user.role !== 'banned') {
          shouldSendRestockAlert = true;
        }
      }

      if (shouldSendRestockAlert) {
        if (alert.email) {
          await emailService.sendRestockAlert(
            alert.email,
            product.title,
            product.url,
            product.platform
          );
        }
        // Store dashboard notification
        await db.addNotification({
          productId: product.id,
          productTitle: product.title,
          productUrl: product.url,
          alertId: alert.id,
          previousPrice: 0,
          currentPrice: product.price || 0,
          priceDrop: 0,
          type: 'restock',
          isRead: false,
          userId: alert.userId,
        });
      }
    }
    // --- Update previousStockStatus for next check ---
    if (product.stockStatus !== product.previousStockStatus) {
      await db.updateProduct(product.id, { previousStockStatus: product.stockStatus || 'unknown' });
    }
  }

  // Send consolidated emails for each user
  for (const [userEmail, priceDrops] of Object.entries(priceDropsByUser)) {
    if (priceDrops.length > 0) {
      console.log(`[ALERT] Sending consolidated email to ${userEmail} with ${priceDrops.length} price drops`);
      const emailResult = await emailService.sendConsolidatedPriceDropAlert(
        userEmail,
        priceDrops.map(drop => ({
          productTitle: drop.productTitle,
          currentPrice: drop.currentPrice,
          previousPrice: drop.previousPrice,
          productUrl: drop.productUrl,
          platform: drop.platform
        }))
      );
      console.log(`[ALERT] Consolidated email send result:`, emailResult ? 'SUCCESS' : 'FAILED');
      if (!emailResult) {
        console.error(`[ALERT] Consolidated email failed to send for ${userEmail}`);
      }
    }
  }
}

export const initializeCronJobs = () => {
  // Check for price drops every 12 hours to avoid rate limiting (runs at 00:00 and 12:00)
  cron.schedule('0 */12 * * *', async () => {
    console.log('[CRON] Running scheduled price drop check...');
    await checkPriceAlerts();
    console.log('[CRON] Price drop check complete.');
  });
  console.log('✅ Cron jobs initialized (checking prices every 12 hours at 00:00 and 12:00)');
}; 