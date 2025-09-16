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

interface Notification {
  id: string;
  userId: string;
  alertId: string;
  productId: string;
  productTitle: string;
  previousPrice: number;
  currentPrice: number;
  priceDrop: number;
  timestamp: string;
  type: string;
  isRead: boolean;
  productUrl?: string;
}

interface Data {
  products: Product[];
  notifications: Notification[];
}

async function addPriceDropNotifications() {
  try {
    // Read current data
    const data: Data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('Adding price drop notifications...');
    
    // Check for products with price drops
    const productsWithDrops = data.products.filter(product => {
      if (!product.priceHistory || product.priceHistory.length < 2) return false;
      
      const sortedHistory = product.priceHistory.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const last = sortedHistory[sortedHistory.length - 1];
      const prev = sortedHistory[sortedHistory.length - 2];
      
      return last && prev && last.price < prev.price;
    });
    
    productsWithDrops.forEach((product, index) => {
      const sortedHistory = product.priceHistory.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const last = sortedHistory[sortedHistory.length - 1];
      const prev = sortedHistory[sortedHistory.length - 2];
      
      if (!last || !prev) return;
      
      const priceDrop = prev.price - last.price;
      const dropPercentage = (priceDrop / prev.price) * 100;
      
      // Create notification
      const notification: Notification = {
        id: `price-drop-${product.id}-${Date.now()}`,
        userId: 'demo-user-1', // Using demo user
        alertId: `alert-${product.id}`,
        productId: product.id,
        productTitle: product.title,
        previousPrice: prev.price,
        currentPrice: last.price,
        priceDrop: priceDrop,
        timestamp: new Date().toISOString(),
        type: 'price_drop',
        isRead: false,
        productUrl: ''
      };
      
      data.notifications.push(notification);
      
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   Price dropped from $${prev.price.toFixed(2)} to $${last.price.toFixed(2)} (${dropPercentage.toFixed(1)}% drop)`);
    });
    
    // Write updated data
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    console.log(`\n✅ Added ${productsWithDrops.length} price drop notifications!`);
    console.log('Check the notification bell to see the alerts.');
    
  } catch (error) {
    console.error('Error adding price drop notifications:', error);
  }
}

addPriceDropNotifications(); 