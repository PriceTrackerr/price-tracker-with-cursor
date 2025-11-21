require('dotenv').config();

// Simple test to check environment variables
console.log('🔍 Checking Email Configuration...\n');

console.log('Environment Variables:');
console.log('GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Not set');
console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.log('\n❌ Email configuration incomplete!');
  console.log('\n📧 To set up email delivery:');
  console.log('1. Make sure your .env file has:');
  console.log('   GMAIL_USER=your-email@gmail.com');
  console.log('   GMAIL_APP_PASSWORD=your-16-character-app-password');
  console.log('   JWT_SECRET=your-secret-key');
  console.log('\n2. Follow the setup instructions in EMAIL_SETUP.md');
} else {
  console.log('\n✅ Email configuration looks good!');
  console.log('📧 Try creating a new account in the web app to test email delivery');
  console.log('🌐 Go to: http://localhost:3000 and sign up with a real email');
} 