import dotenv from 'dotenv';
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

import EmailService from '../services/emailService';

const emailService = new EmailService();

(async () => {
  console.log('GMAIL_USER:', process.env.GMAIL_USER);
  console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '***' : '(empty)');
  const result = await emailService.sendPriceDropAlert(
    'mikeabrsh21@gmail.com', // <-- Replace with your real email address
    'Test Product',
    10.99,
    15.99,
    'https://example.com/product',
    'amazon'
  );
  console.log('Test email send result:', result);
})(); 