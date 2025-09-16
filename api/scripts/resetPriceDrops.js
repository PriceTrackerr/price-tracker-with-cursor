require('dotenv').config();
const fs = require('fs');
const path = require('path');

function resetPriceDrops() {
  try {
    const dataPath = path.join(__dirname, '../data/data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('🗑️ Resetting Price Drops...\n');
    
    // Clear seen price drops for all users
    data.users.forEach(user => {
      if (user.seenPriceDropIds) {
        console.log(`📧 User ${user.email}: Clearing ${user.seenPriceDropIds.length} seen price drops`);
        user.seenPriceDropIds = [];
      }
    });
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    console.log('\n✅ Price drops reset successfully!');
    console.log('📊 All users now have 0 seen price drops');
    console.log('🎯 Dashboard should now show the actual number of price drops');
    
    // Show current products with price drops
    const productsWithDrops = data.products.filter(product => {
      // Get price history from the separate array
      const productHistory = data.priceHistory.filter(h => h.productId === product.id);
      if (productHistory.length < 2) return false;
      
      const sortedHistory = productHistory.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const last = sortedHistory[sortedHistory.length - 1];
      const prev = sortedHistory[sortedHistory.length - 2];
      
      return last && prev && last.price < prev.price;
    });
    
    console.log(`\n📦 Products with price drops: ${productsWithDrops.length}`);
    productsWithDrops.forEach(product => {
      const productHistory = data.priceHistory.filter(h => h.productId === product.id);
      const sortedHistory = productHistory.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const last = sortedHistory[sortedHistory.length - 1];
      const prev = sortedHistory[sortedHistory.length - 2];
      const dropAmount = prev.price - last.price;
      const dropPercent = ((dropAmount / prev.price) * 100).toFixed(1);
      
      console.log(`  • ${product.title}`);
      console.log(`    ${prev.price} → ${last.price} (-$${dropAmount.toFixed(2)}, -${dropPercent}%)`);
    });
    
  } catch (error) {
    console.error('❌ Error resetting price drops:', error.message);
  }
}

resetPriceDrops(); 