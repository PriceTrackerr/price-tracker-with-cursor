"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const storage_1 = __importDefault(require("../config/storage"));
async function setupTestData() {
    const products = [
        { id: 'knife-test-1', title: 'Kitchen Knife Set with Bag - 6 PCS Chef Knife Set - Cleaver, Boning, Fillet, Santoku, Kitchent Utility Knife, Chef Knife with Full Tang Wooden Handle, Butcher Knife Set for Men, Ideal Gift', currentPrice: 80, previousPrice: 120.00 },
        { id: 'autumn-high-stretch-1', title: 'Autumn and winter high stretch', currentPrice: 25, previousPrice: 35.00 },
        { id: 'restored-dell-1', title: 'Restored Dell OptiPlex Desktop Computer with a Intel Core i5 3.2GHz 6th gen Processor, choose Memory, Hard drive, and LCD Options - Windows 10 PC (Refurbished) - Walmart.com', currentPrice: 200, previousPrice: 280.00 },
        { id: '1753463364603u5x34', title: 'Autumn and winter high stretch knitted yoga headband face wash headband, hair tie outdoor warm headband', currentPrice: 15, previousPrice: 22.00 },
        { id: '1753463521927jjz2a', title: 'Skullcandy Ink\'d 2.0 Earbuds in Black with Inline Mic - New | eBay', currentPrice: 25, previousPrice: 35.00 },
        { id: '17534635522619opf9', title: 'VUSIGN Laptop Lap Desk, Foldable Laptop Table Tray with 4 USB Ports and Cup Holder, Lap Bed Desk Notebook Stand Laptray Portable Standing Table for Bed Couch Floor - Walmart.com', currentPrice: 45, previousPrice: 65.00 }
    ];
    console.log('Setting up test data...');
    for (const product of products) {
        if (storage_1.default.addPriceHistory) {
            await storage_1.default.addPriceHistory({
                productId: product.id,
                price: product.previousPrice,
                currency: '$'
            });
        }
        if (storage_1.default.addPriceHistory) {
            await storage_1.default.addPriceHistory({
                productId: product.id,
                price: product.currentPrice,
                currency: '$'
            });
        }
        const targetPrice = product.currentPrice * 0.9;
        if (storage_1.default.addAlert) {
            await storage_1.default.addAlert({
                productId: product.id,
                productTitle: product.title,
                targetPrice: targetPrice,
                currentPrice: product.currentPrice,
                isActive: true,
                userId: '1753382637431gg38e',
                email: 'michaelabrham8@gmail.com'
            });
        }
        console.log(`Created alert for ${product.title.substring(0, 50)}... - Target: $${targetPrice.toFixed(2)}, Current: $${product.currentPrice}`);
    }
    console.log('Test data setup complete!');
}
setupTestData().catch(console.error);
//# sourceMappingURL=setupTestData.js.map