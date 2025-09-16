const fs = require('fs');
const path = require('path');

// Load data
const dataPath = path.join(__dirname, '../data/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🗑️ Clearing all price data...');

// Clear price history array
data.priceHistory = [];
console.log('✅ Cleared price history array');

// Clear seen price drops for all users
data.users.forEach(user => {
  if (user.seenPriceDropIds) {
    user.seenPriceDropIds = [];
    console.log(`📧 User ${user.email}: Cleared seen price drops`);
  }
});

// Save the data
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('✅ All price data cleared successfully!');
console.log('📊 Price history array is now empty');
console.log('📊 All users have 0 seen price drops');
console.log('🎯 Dashboard should now show 0 price drops'); 