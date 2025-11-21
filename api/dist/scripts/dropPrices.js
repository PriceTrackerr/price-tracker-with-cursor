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
async function dropPrices() {
    try {
        const data = JSON.parse(fs_1.default.readFileSync(dataPath, 'utf8'));
        const productsToUpdate = data.products.slice(0, 3);
        console.log('Dropping prices for 3 products...');
        productsToUpdate.forEach((product, index) => {
            const originalPrice = product.price;
            const newPrice = originalPrice * 0.85;
            product.price = newPrice;
            const historyEntry = {
                price: newPrice,
                timestamp: new Date().toISOString()
            };
            if (!product.priceHistory) {
                product.priceHistory = [];
            }
            product.priceHistory.push(historyEntry);
            console.log(`${index + 1}. ${product.title}`);
            console.log(`   Original: $${originalPrice.toFixed(2)} → New: $${newPrice.toFixed(2)} (${((newPrice - originalPrice) / originalPrice * 100).toFixed(1)}% drop)`);
        });
        fs_1.default.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        console.log('\n✅ Prices dropped successfully!');
        console.log('Check the dashboard and price history page to see the price drops.');
    }
    catch (error) {
        console.error('Error dropping prices:', error);
    }
}
dropPrices();
//# sourceMappingURL=dropPrices.js.map