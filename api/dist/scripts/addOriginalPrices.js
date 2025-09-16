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
async function addOriginalPrices() {
    try {
        const data = JSON.parse(fs_1.default.readFileSync(dataPath, 'utf8'));
        const originalPrices = {
            "1": 899.99,
            "2": 799.99,
            "3": 1099.99
        };
        console.log('Adding original prices to price history...');
        Object.keys(originalPrices).forEach((productId) => {
            const product = data.products.find(p => p.id === productId);
            if (product) {
                const originalEntry = {
                    price: originalPrices[productId],
                    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                };
                product.priceHistory.unshift(originalEntry);
                console.log(`${product.title}: Added original price $${originalPrices[productId]}`);
            }
        });
        fs_1.default.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        console.log('\n✅ Original prices added successfully!');
        console.log('Now the dashboard should detect price drops correctly.');
    }
    catch (error) {
        console.error('Error adding original prices:', error);
    }
}
addOriginalPrices();
//# sourceMappingURL=addOriginalPrices.js.map