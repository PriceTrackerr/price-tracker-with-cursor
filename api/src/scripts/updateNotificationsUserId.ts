import dotenv from 'dotenv';
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

import fs from 'fs';
import path from 'path';

const dataPath = path.join(__dirname, '../../data/data.json');

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
  notifications: Notification[];
}

async function updateNotificationsUserId() {
  try {
    // Read current data
    const data: Data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('Updating notifications user ID...');
    console.log('Current user ID in notifications:', data.notifications[0]?.userId);
    
    // Update all notifications to use the current user ID
    // The current user ID from the token is: 1753818521609lw3h2
    const currentUserId = '1753818521609lw3h2';
    
    data.notifications.forEach((notification, index) => {
      notification.userId = currentUserId;
      console.log(`Updated notification ${index + 1}: ${notification.productTitle}`);
    });
    
    // Write updated data
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    console.log(`\n✅ Updated ${data.notifications.length} notifications to use user ID: ${currentUserId}`);
    console.log('Notifications should now appear for the current user.');
    
  } catch (error) {
    console.error('Error updating notifications:', error);
  }
}

updateNotificationsUserId(); 