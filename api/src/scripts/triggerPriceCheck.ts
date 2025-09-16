import dotenv from 'dotenv';
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });
import { checkPriceAlerts } from '../services/cronJobs';

(async () => {
  console.log('Triggering price/stock alert check...');
  await checkPriceAlerts();
  console.log('Check complete.');
})(); 