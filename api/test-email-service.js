const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testEmail() {
    console.log('--- STARTING EMAIL TEST ---');
    try {
        // Register ts-node to handle TS imports
        require('ts-node').register({
            project: path.join(__dirname, 'tsconfig.json'),
            transpileOnly: true
        });

        const EmailService = require('./src/services/emailService').default;

        console.log('GMAIL_USER:', process.env.GMAIL_USER ? 'Set' : 'Not Set');
        console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Not Set');

        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.error('❌ Missing email credentials in .env');
            return;
        }

        const emailService = new EmailService();
        console.log('Attempting to send email...');
        const success = await emailService.sendEmail({
            to: process.env.GMAIL_USER,
            subject: 'Test Email from Price Tracker',
            html: '<p>This is a test email.</p>'
        });

        if (success) {
            console.log('✅ Email sent successfully!');
        } else {
            console.error('❌ Failed to send email (returned false).');
        }
    } catch (error) {
        console.error('❌ Exception during test:', error);
    }
    console.log('--- END EMAIL TEST ---');
}

testEmail();
