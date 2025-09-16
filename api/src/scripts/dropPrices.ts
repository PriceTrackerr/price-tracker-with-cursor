import dotenv from 'dotenv';
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

import fs from 'fs';
import path from 'path';

const dataPath = path.join(__dirname, '../../data/data.json');

interface Product {
  id: string;
  title: string;
  price: number;
  platform: string;
  priceHistory: Array<{
    price: number;
    timestamp: string;
  }>;
}

interface Data {
  products: Product[];
}

async function dropPrices() {
  try {
    // Read current data
    const data: Data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Get first 3 products
    const productsToUpdate = data.products.slice(0, 3);
    
    console.log('Dropping prices for 3 products...');
    
    productsToUpdate.forEach((product, index) => {
      const originalPrice = product.price;
      const newPrice = originalPrice * 0.85; // Drop by 15%
      
      // Update current price
      product.price = newPrice;
      
      // Add to price history
      const historyEntry = {
        price: newPrice,
        timestamp: new Date().toISOString()
      };
      
      // Initialize priceHistory array if it doesn't exist
      if (!product.priceHistory) {
        product.priceHistory = [];
      }
      
      product.priceHistory.push(historyEntry);
      
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   Original: $${originalPrice.toFixed(2)} → New: $${newPrice.toFixed(2)} (${((newPrice - originalPrice) / originalPrice * 100).toFixed(1)}% drop)`);
    });
    
    // Write updated data
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    console.log('\n✅ Prices dropped successfully!');
    console.log('Check the dashboard and price history page to see the price drops.');
    
  } catch (error) {
    console.error('Error dropping prices:', error);
  }
}

dropPrices(); 