require('dotenv').config();
const db = require('../dist/config/storage').default;
const EmailService = require('../dist/services/emailService').default;

async function testEmailService() {
  console.log('📧 Testing Email Service...');
  
  try {
    // Get data using the storage methods
    const products = await db.getProducts();
    const users = await db.getUsers();
    const alerts = await db.getAllAlerts();
    const activeAlerts = alerts.filter(alert => alert.isActive);
    
    console.log('📊 Database loaded with:');
    console.log(`   - ${products.length} products`);
    console.log(`   - ${users.length} users`);
    console.log(`   - ${activeAlerts.length} active alerts`);

    if (activeAlerts.length === 0) {
      console.log('❌ No active alerts found. Please create some alerts first.');
      return;
    }

    // Pick a random active alert
    const randomAlert = activeAlerts[Math.floor(Math.random() * activeAlerts.length)];
    const product = await db.getProductById(randomAlert.productId);
    const user = await db.getUserById(randomAlert.userId);

    if (!product || !user) {
      console.log('❌ Could not find product or user for alert:', randomAlert.id);
      return;
    }

    console.log(`\n🎯 Testing with alert: ${randomAlert.id}`);
    console.log(`   - Product: ${product.title}`);
    console.log(`   - User: ${user.email} (${user.username})`);
    console.log(`   - Current Price: $${product.price}`);
    console.log(`   - Target Price: $${randomAlert.targetPrice}`);

    // Simulate a price drop (guaranteed to trigger alert for testing)
    const targetPrice = randomAlert.targetPrice;
    const currentPrice = product.price;
    
    // Ensure the new price is below the target price to trigger the alert
    const newPrice = Math.round((targetPrice * 0.9) * 100) / 100; // 10% below target
    const priceDropPercent = Math.round(((currentPrice - newPrice) / currentPrice) * 100);
    const priceDrop = currentPrice - newPrice;

    console.log(`\n💰 Simulated price drop for ${product.title}:`);
    console.log(`   - User: ${user.email}`);
    console.log(`   - Old Price: $${product.price}`);
    console.log(`   - New Price: $${newPrice}`);
    console.log(`   - Drop: ${priceDropPercent}%`);
    console.log(`   - Alert Target: $${randomAlert.targetPrice}`);

    // Check if alert should be triggered
    if (newPrice <= randomAlert.targetPrice) {
      console.log('🎯 ALERT TRIGGERED for ' + user.email + '!');
      
      try {
        // Send email to the actual user
        const emailResult = await EmailService.sendPriceDropAlert(
          user.email,
          product.title,
          newPrice,
          product.price,
          product.url,
          product.platform
        );
        
        if (emailResult) {
          console.log('✅ Price drop email sent successfully to:', user.email);
        } else {
          console.log('❌ Failed to send price drop email');
        }
      } catch (error) {
        console.log('❌ Error sending email:', error.message);
      }
      
      // Update product price
      await db.updateProduct(product.id, { price: newPrice });
      
      // Add to price history
      await db.addPriceHistory({
        productId: product.id,
        price: newPrice,
        currency: '$'
      });
      
      // Add notification
      await db.addNotification({
        productId: product.id,
        productTitle: product.title,
        productUrl: product.url,
        alertId: randomAlert.id,
        previousPrice: product.price,
        currentPrice: newPrice,
        priceDrop: priceDrop,
        type: 'price_drop',
        userId: user.id
      });
      
      console.log('✅ Product price updated and notification added');
    } else {
      console.log('ℹ️  Price drop not low enough to trigger alert');
    }

    console.log('\n🎉 Test completed!');
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

// Run the test
testEmailService().catch(console.error); 