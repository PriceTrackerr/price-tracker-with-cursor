require('dotenv').config();

console.log('🔍 Checking Environment Variables...\n');

console.log('GMAIL_USER:', process.env.GMAIL_USER ? `✅ "${process.env.GMAIL_USER}"` : '❌ Not set');
console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Set (hidden)' : '❌ Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');
console.log('PORT:', process.env.PORT || '3000 (default)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development (default)');

console.log('\n📁 Current directory:', process.cwd());
console.log('📄 .env file exists:', require('fs').existsSync('.env') ? '✅ Yes' : '❌ No');

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.log('\n❌ Email configuration is missing!');
  console.log('Please check your .env file in the backend directory.');
} else {
  console.log('\n✅ Email configuration looks good!');
} 