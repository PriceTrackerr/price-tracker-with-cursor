"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: require('path').resolve(__dirname, '../../.env') });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dataPath = path_1.default.join(__dirname, '../../data/data.json');
async function addPriceDropNotifications() {
    try {
        const data = JSON.parse(fs_1.default.readFileSync(dataPath, 'utf8'));
        console.log('Adding price drop notifications...');
        const productsWithDrops = data.products.filter(product => {
            if (!product.priceHistory || product.priceHistory.length < 2)
                return false;
            const sortedHistory = product.priceHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            const last = sortedHistory[sortedHistory.length - 1];
            const prev = sortedHistory[sortedHistory.length - 2];
            return last && prev && last.price < prev.price;
        });
        productsWithDrops.forEach((product, index) => {
            const sortedHistory = product.priceHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            const last = sortedHistory[sortedHistory.length - 1];
            const prev = sortedHistory[sortedHistory.length - 2];
            if (!last || !prev)
                return;
            const priceDrop = prev.price - last.price;
            const dropPercentage = (priceDrop / prev.price) * 100;
            const notification = {
                id: `price-drop-${product.id}-${Date.now()}`,
                userId: 'demo-user-1',
                alertId: `alert-${product.id}`,
                productId: product.id,
                productTitle: product.title,
                previousPrice: prev.price,
                currentPrice: last.price,
                priceDrop: priceDrop,
                timestamp: new Date().toISOString(),
                type: 'price_drop',
                isRead: false,
                productUrl: ''
            };
            data.notifications.push(notification);
            console.log(`${index + 1}. ${product.title}`);
            console.log(`   Price dropped from $${prev.price.toFixed(2)} to $${last.price.toFixed(2)} (${dropPercentage.toFixed(1)}% drop)`);
        });
        fs_1.default.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        console.log(`\n✅ Added ${productsWithDrops.length} price drop notifications!`);
        console.log('Check the notification bell to see the alerts.');
    }
    catch (error) {
        console.error('Error adding price drop notifications:', error);
    }
}
addPriceDropNotifications();
//# sourceMappingURL=addPriceDropNotifications.js.map