require('dotenv').config();
const fs = require('fs');
const path = require('path');

function createPriceDropsForUser() {
  try {
    const dataPath = path.join(__dirname, '../data/data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // User ID for michaelabrham9@gmail.com
    const targetUserId = '1754345091039hev7r';
    
    console.log('💰 Creating Price Drops for User...\n');
    console.log(`👤 Target User ID: ${targetUserId}`);
    
    // Get products that belong to the target user
    const userProducts = data.products.filter(product => product.userId === targetUserId);
    
    console.log(`📦 Found ${userProducts.length} products for user`);
    
    if (userProducts.length === 0) {
      console.log('❌ No products found for this user');
      console.log('💡 You need to track some products first');
      return;
    }
    
    // Create price drops for user's products
    userProducts.forEach((product, index) => {
      const currentPrice = product.price;
      const newPrice = currentPrice * (0.85 - (index * 0.05)); // 15%, 20%, 25%, etc. drops
      const dropAmount = currentPrice - newPrice;
      const dropPercent = ((dropAmount / currentPrice) * 100).toFixed(1);
      
      // Add new price to history
      if (!product.priceHistory) {
        product.priceHistory = [];
      }
      
      // Add current price as previous entry if no history
      if (product.priceHistory.length === 0) {
        product.priceHistory.push({
          price: currentPrice,
          timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        });
      }
      
      // Add new lower price
      product.priceHistory.push({
        price: newPrice,
        timestamp: new Date().toISOString()
      });
      
      // Update current price
      product.price = newPrice;
      product.updatedAt = new Date().toISOString();
      
      console.log(`📉 Product ${index + 1}: ${product.title}`);
      console.log(`   ${currentPrice} → ${newPrice.toFixed(2)} (-$${dropAmount.toFixed(2)}, -${dropPercent}%)`);
    });
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    console.log('\n✅ Price drops created successfully!');
    console.log(`📊 Created ${userProducts.length} new price drops for user`);
    console.log('🎯 Dashboard should now show these new price drops');
    
    // Show all products with price drops for this user
    const userProductsWithDrops = data.products.filter(product => {
      if (product.userId !== targetUserId) return false;
      if (!product.priceHistory || product.priceHistory.length < 2) return false;
      
      const sortedHistory = product.priceHistory.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const last = sortedHistory[sortedHistory.length - 1];
      const prev = sortedHistory[sortedHistory.length - 2];
      
      return last && prev && last.price < prev.price;
    });
    
    console.log(`\n📦 Total products with price drops for user: ${userProductsWithDrops.length}`);
    
  } catch (error) {
    console.error('❌ Error creating price drops:', error.message);
  }
}

createPriceDropsForUser(); 