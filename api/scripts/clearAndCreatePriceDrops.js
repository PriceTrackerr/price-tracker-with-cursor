require('dotenv').config();
const fs = require('fs');
const path = require('path');

function clearAndCreatePriceDrops() {
  try {
    const dataPath = path.join(__dirname, '../data/data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // User ID for michaelabrham8@gmail.com
    const targetUserId = '1753818521609lw3h2';
    
    console.log('🗑️ Clearing All Price Drops...\n');
    
    // Clear all price history from all products
    data.products.forEach(product => {
      if (product.priceHistory) {
        // Keep only the first entry (original price)
        if (product.priceHistory.length > 0) {
          const originalPrice = product.priceHistory[0].price;
          product.priceHistory = [product.priceHistory[0]];
          product.price = originalPrice;
          product.updatedAt = new Date().toISOString();
        }
      }
    });
    
    console.log('✅ Cleared all price drops');
    
    // Get products that belong to the target user
    const userProducts = data.products.filter(product => product.userId === targetUserId);
    
    console.log(`\n👤 Target User: michaelabrham8@gmail.com`);
    console.log(`📦 Found ${userProducts.length} products for user`);
    
    if (userProducts.length === 0) {
      console.log('❌ No products found for this user');
      return;
    }
    
    // Create price drops for user's products (first 10 products)
    const productsToDrop = userProducts.slice(0, 10);
    
    console.log(`\n💰 Creating Price Drops for ${productsToDrop.length} Products...\n`);
    
    productsToDrop.forEach((product, index) => {
      const currentPrice = product.price;
      const newPrice = currentPrice * (0.85 - (index * 0.03)); // 15%, 18%, 21%, 24%, 27%, 30%, 33%, 36%, 39%, 42% drops
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
    
    // Clear all seen price drops for all users
    data.users.forEach(user => {
      if (user.seenPriceDropIds) {
        console.log(`📧 User ${user.email}: Clearing ${user.seenPriceDropIds.length} seen price drops`);
        user.seenPriceDropIds = [];
      }
    });
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    console.log('\n✅ Price drops created successfully!');
    console.log(`📊 Created ${productsToDrop.length} new price drops for user`);
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
    console.error('❌ Error:', error.message);
  }
}

clearAndCreatePriceDrops(); 