import cron from 'node-cron';
import { getDb } from '../config/database';
import EmailService from './emailService';

const emailService = new EmailService();
const db = getDb();

async function storeDashboardNotification(product: any, alert: any) {
  await db.addNotification({
    productId: product.id,
    productTitle: product.title,
    productUrl: product.url,
    alertId: alert.id,
    previousPrice: alert.currentPrice || 0,
    currentPrice: product.price,
    priceDrop: (alert.currentPrice || 0) - product.price,
    type: 'price_drop',
    isRead: false,
    userId: alert.userId,
  });
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
  const priceDropsByUser: { [email: string]: Array<{
    productTitle: string;
    currentPrice: number;
    previousPrice: number;
    productUrl: string;
    platform: 'amazon' | 'aliexpress' | 'ebay' | 'walmart' | 'shein' | 'bestbuy' | 'target';
    alert: any;
    product: any;
  }> } = {};
  
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
    // --- Price Drop Alert (existing) ---
    if (currentPrice <= targetPrice) {
      // Get previous price from price history
      let previousPrice = currentPrice;
      const history = await db.getPriceHistory(alert.productId);
      previousPrice = history.length > 1 ? history[history.length - 2]?.price || currentPrice : currentPrice;
      console.log(`[DEBUG] Alert ${alert.id}: currentPrice=${currentPrice}, targetPrice=${targetPrice}, previousPrice=${previousPrice}`);
      // Only send notification if price actually dropped
      if (currentPrice < previousPrice) {
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
        // Update alert's currentPrice but keep it active
        await db.updateAlert(alert.id, { currentPrice, triggeredAt: new Date().toISOString() });
        // Add price history entry
        await db.addPriceHistory({
          productId: product.id,
          price: currentPrice,
          currency: product.currency || '$',
        });
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
  // Check for price drops every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    console.log('[CRON] Running scheduled price drop check...');
    await checkPriceAlerts();
    console.log('[CRON] Price drop check complete.');
  });
  console.log('Cron jobs initialized');
}; 