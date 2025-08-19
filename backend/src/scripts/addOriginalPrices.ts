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

async function addOriginalPrices() {
  try {
    // Read current data
    const data: Data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Original prices for the first 3 products
    const originalPrices = {
      "1": 899.99, // iPhone 15 Pro
      "2": 799.99, // Samsung Galaxy S24
      "3": 1099.99 // MacBook Air M2
    };
    
    console.log('Adding original prices to price history...');
    
    Object.keys(originalPrices).forEach((productId) => {
      const product = data.products.find(p => p.id === productId);
      if (product) {
        // Add original price as the first entry in price history
        const originalEntry = {
          price: originalPrices[productId as keyof typeof originalPrices],
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        };
        
        // Insert at the beginning of priceHistory array
        product.priceHistory.unshift(originalEntry);
        
        console.log(`${product.title}: Added original price $${originalPrices[productId as keyof typeof originalPrices]}`);
      }
    });
    
    // Write updated data
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    console.log('\n✅ Original prices added successfully!');
    console.log('Now the dashboard should detect price drops correctly.');
    
  } catch (error) {
    console.error('Error adding original prices:', error);
  }
}

addOriginalPrices(); 