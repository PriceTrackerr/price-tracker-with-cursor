require('dotenv').config();
const fs = require('fs');
const path = require('path');

function createProductsForUser() {
  try {
    const dataPath = path.join(__dirname, '../data/data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // User ID for michaelabrham9@gmail.com
    const targetUserId = '1754345091039hev7r';
    
    console.log('📦 Creating Products for User...\n');
    console.log(`👤 Target User ID: ${targetUserId}`);
    
    // Sample products to create
    const sampleProducts = [
      {
        id: `product_${Date.now()}_1`,
        url: "https://www.amazon.com/dp/B0CHX1W1XY",
        title: "Apple iPhone 15 Pro Max",
        price: 1199.99,
        currency: "USD",
        platform: "amazon",
        imageUrl: "https://images-na.ssl-images-amazon.com/images/I/71T5JXIHbBL._AC_SL1500_.jpg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: targetUserId,
        stockStatus: "in_stock",
        discountInfo: "Save $200",
        priceHistory: [
          {
            price: 1199.99,
            timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          }
        ]
      },
      {
        id: `product_${Date.now()}_2`,
        url: "https://www.amazon.com/dp/B0CSJQ8X8K",
        title: "Samsung Galaxy S24 Ultra",
        price: 1299.99,
        currency: "USD",
        platform: "amazon",
        imageUrl: "https://images-na.ssl-images-amazon.com/images/I/71T5JXIHbBL._AC_SL1500_.jpg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: targetUserId,
        stockStatus: "in_stock",
        discountInfo: "Save $150",
        priceHistory: [
          {
            price: 1299.99,
            timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          }
        ]
      },
      {
        id: `product_${Date.now()}_3`,
        url: "https://www.amazon.com/dp/B0B3C57K1T",
        title: "MacBook Pro M3",
        price: 1999.99,
        currency: "USD",
        platform: "amazon",
        imageUrl: "https://images-na.ssl-images-amazon.com/images/I/71T5JXIHbBL._AC_SL1500_.jpg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: targetUserId,
        stockStatus: "in_stock",
        discountInfo: "Save $300",
        priceHistory: [
          {
            price: 1999.99,
            timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          }
        ]
      },
      {
        id: `product_${Date.now()}_4`,
        url: "https://www.amazon.com/dp/B09Y2MYL5C",
        title: "Sony WH-1000XM5 Headphones",
        price: 399.99,
        currency: "USD",
        platform: "amazon",
        imageUrl: "https://images-na.ssl-images-amazon.com/images/I/71T5JXIHbBL._AC_SL1500_.jpg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: targetUserId,
        stockStatus: "in_stock",
        discountInfo: "Save $100",
        priceHistory: [
          {
            price: 399.99,
            timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          }
        ]
      },
      {
        id: `product_${Date.now()}_5`,
        url: "https://www.amazon.com/dp/B08N5WRWNW",
        title: "DJI Mini 3 Pro Drone",
        price: 759.99,
        currency: "USD",
        platform: "amazon",
        imageUrl: "https://images-na.ssl-images-amazon.com/images/I/71T5JXIHbBL._AC_SL1500_.jpg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: targetUserId,
        stockStatus: "in_stock",
        discountInfo: "Save $50",
        priceHistory: [
          {
            price: 759.99,
            timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          }
        ]
      }
    ];
    
    // Add products to the data
    data.products.push(...sampleProducts);
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    console.log('✅ Created 5 sample products for user:');
    sampleProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} - $${product.price}`);
    });
    
    console.log('\n📊 Now you can create price drops for these products');
    console.log('🎯 Run: node scripts/createPriceDropsForUser.js');
    
  } catch (error) {
    console.error('❌ Error creating products:', error.message);
  }
}

createProductsForUser(); 