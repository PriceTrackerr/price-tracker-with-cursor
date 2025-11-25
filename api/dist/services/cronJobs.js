"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCronJobs = void 0;
exports.checkPriceAlerts = checkPriceAlerts;
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = require("../config/database");
const emailService_1 = __importDefault(require("./emailService"));
const emailService = new emailService_1.default();
const db = (0, database_1.getDb)();
async function storeDashboardNotification(product, alert) {
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
async function sendBrowserNotification(product, alert) {
    const notificationData = {
        type: 'SHOW_PRICE_ALERT',
        productTitle: product.title,
        currentPrice: product.price,
        targetPrice: alert.targetPrice,
        productUrl: product.url,
        alertId: alert.id,
    };
}
async function checkPriceAlerts() {
    const alerts = await db.getAllAlerts();
    console.log(`[DEBUG] Loaded ${alerts.length} alerts`);
    const priceDropsByUser = {};
    for (const alert of alerts) {
        console.log(`[DEBUG] Checking alert ${alert.id} for product ${alert.productId}`);
        const product = await db.getProductById(alert.productId);
        if (!product) {
            console.log(`[DEBUG] Product not found for alert ${alert.id}`);
            continue;
        }
        const currentPrice = product.price || 0;
        const targetPrice = alert.targetPrice;
        console.log(`[DEBUG] Alert ${alert.id}: currentPrice=${currentPrice}, targetPrice=${targetPrice}, alert.currentPrice=${alert.currentPrice}`);
        if (alert.currentPrice !== currentPrice) {
            console.log(`[DEBUG] Updating alert ${alert.id} current price from ${alert.currentPrice} to ${currentPrice}`);
            await db.updateAlert(alert.id, { currentPrice });
        }
        if (currentPrice <= targetPrice) {
            let previousPrice = currentPrice;
            const history = await db.getPriceHistory(alert.productId);
            previousPrice = history.length > 1 ? history[history.length - 2]?.price || currentPrice : currentPrice;
            console.log(`[DEBUG] Alert ${alert.id}: currentPrice=${currentPrice}, targetPrice=${targetPrice}, previousPrice=${previousPrice}`);
            const isNewTrigger = alert.currentPrice > targetPrice && currentPrice <= targetPrice;
            const isPriceDrop = currentPrice < previousPrice;
            console.log(`[DEBUG] Alert ${alert.id}: isNewTrigger=${isNewTrigger}, isPriceDrop=${isPriceDrop}`);
            if (isNewTrigger || isPriceDrop) {
                console.log(`[DEBUG] Price drop detected for alert ${alert.id} (product ${product.title})`);
                let recipientEmail = alert.email;
                if (!recipientEmail && alert.userId) {
                    const user = await db.getUserById(alert.userId);
                    if (user && user.email && user.role !== 'banned')
                        recipientEmail = user.email;
                }
                if (recipientEmail) {
                    if (!priceDropsByUser[recipientEmail]) {
                        priceDropsByUser[recipientEmail] = [];
                    }
                    priceDropsByUser[recipientEmail].push({
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
                let notificationEmail = recipientEmail;
                if (!notificationEmail && alert.userId) {
                    const user = await db.getUserById(alert.userId);
                    if (user && user.email && user.role !== 'banned')
                        notificationEmail = user.email;
                }
                if (notificationEmail) {
                    await storeDashboardNotification({ ...product, email: notificationEmail }, alert);
                }
                await sendBrowserNotification(product, alert);
                await db.updateAlert(alert.id, { currentPrice, triggeredAt: new Date().toISOString() });
                await db.addPriceHistory({
                    productId: product.id,
                    price: currentPrice,
                    currency: product.currency || '$',
                });
            }
            else {
                console.log(`[DEBUG] No price drop for alert ${alert.id}: currentPrice (${currentPrice}) >= previousPrice (${previousPrice})`);
            }
        }
        else {
            console.log(`[DEBUG] No price drop for alert ${alert.id}: currentPrice (${currentPrice}) > targetPrice (${targetPrice})`);
        }
        if ((alert.restockAlert) && product.stockStatus === 'in_stock' && product.previousStockStatus === 'out_of_stock') {
            let shouldSendRestockAlert = false;
            if (alert.email) {
                shouldSendRestockAlert = true;
            }
            else if (alert.userId) {
                const user = await db.getUserById(alert.userId);
                if (user && user.role !== 'banned') {
                    shouldSendRestockAlert = true;
                }
            }
            if (shouldSendRestockAlert) {
                if (alert.email) {
                    await emailService.sendRestockAlert(alert.email, product.title, product.url, product.platform);
                }
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
        if (product.stockStatus !== product.previousStockStatus) {
            await db.updateProduct(product.id, { previousStockStatus: product.stockStatus || 'unknown' });
        }
    }
    for (const [userEmail, priceDrops] of Object.entries(priceDropsByUser)) {
        if (priceDrops.length > 0) {
            console.log(`[ALERT] Sending consolidated email to ${userEmail} with ${priceDrops.length} price drops`);
            const emailResult = await emailService.sendConsolidatedPriceDropAlert(userEmail, priceDrops.map(drop => ({
                productTitle: drop.productTitle,
                currentPrice: drop.currentPrice,
                previousPrice: drop.previousPrice,
                productUrl: drop.productUrl,
                platform: drop.platform
            })));
            console.log(`[ALERT] Consolidated email send result:`, emailResult ? 'SUCCESS' : 'FAILED');
            if (!emailResult) {
                console.error(`[ALERT] Consolidated email failed to send for ${userEmail}`);
            }
        }
    }
}
const initializeCronJobs = () => {
    node_cron_1.default.schedule('*/30 * * * *', async () => {
        console.log('[CRON] Running scheduled price drop check...');
        await checkPriceAlerts();
        console.log('[CRON] Price drop check complete.');
    });
    console.log('Cron jobs initialized (checking every 30 minutes)');
};
exports.initializeCronJobs = initializeCronJobs;
//# sourceMappingURL=cronJobs.js.map