require('dotenv').config();
const fs = require('fs');
const path = require('path');

function createPriceDrops() {
  try {
    const dataPath = path.join(__dirname, '../data/data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('💰 Creating Price Drops for Testing...\n');
    
    // Get products that don't have price drops yet
    const productsWithoutDrops = data.products.filter(product => {
      if (!product.priceHistory || product.priceHistory.length < 2) return true;
      
      const sortedHistory = product.priceHistory.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const last = sortedHistory[sortedHistory.length - 1];
      const prev = sortedHistory[sortedHistory.length - 2];
      
      // Return true if no price drop (current price >= previous price)
      return !(last && prev && last.price < prev.price);
    });
    
    console.log(`📦 Found ${productsWithoutDrops.length} products without price drops`);
    
    // Create price drops for the first 5 products
    const productsToDrop = productsWithoutDrops.slice(0, 5);
    
    productsToDrop.forEach((product, index) => {
      const currentPrice = product.price;
      const newPrice = currentPrice * (0.85 - (index * 0.05)); // 15%, 20%, 25%, 30%, 35% drops
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
    console.log(`📊 Created ${productsToDrop.length} new price drops`);
    console.log('🎯 Dashboard should now show these new price drops');
    
    // Show all products with price drops
    const allProductsWithDrops = data.products.filter(product => {
      if (!product.priceHistory || product.priceHistory.length < 2) return false;
      
      const sortedHistory = product.priceHistory.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const last = sortedHistory[sortedHistory.length - 1];
      const prev = sortedHistory[sortedHistory.length - 2];
      
      return last && prev && last.price < prev.price;
    });
    
    console.log(`\n📦 Total products with price drops: ${allProductsWithDrops.length}`);
    
  } catch (error) {
    console.error('❌ Error creating price drops:', error.message);
  }
}

createPriceDrops(); 