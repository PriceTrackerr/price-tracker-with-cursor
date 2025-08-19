const fs = require('fs');
const path = require('path');

// Read the data file
const dataFile = path.join(__dirname, 'data', 'data.json');
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

console.log('=== Data File Analysis ===');
console.log(`Total products: ${data.products.length}`);
console.log(`Total users: ${data.users.length}`);

// Check for products with userId 1753818521609lw3h2
const userProducts = data.products.filter(p => p.userId === '1753818521609lw3h2');
console.log(`\nProducts for user 1753818521609lw3h2: ${userProducts.length}`);

if (userProducts.length > 0) {
  console.log('\nFirst few products:');
  userProducts.slice(0, 3).forEach((p, i) => {
    console.log(`${i + 1}. ${p.title} - $${p.price} (${p.platform})`);
  });
}

// Check if user exists
const user = data.users.find(u => u.id === '1753818521609lw3h2');
if (user) {
  console.log(`\nUser found: ${user.username} (${user.email})`);
} else {
  console.log('\n❌ User 1753818521609lw3h2 NOT FOUND in users array!');
}

// Check for any products without matching users
const orphanedProducts = data.products.filter(p => {
  return !data.users.find(u => u.id === p.userId);
});

if (orphanedProducts.length > 0) {
  console.log(`\n⚠️  Found ${orphanedProducts.length} products with no matching user:`);
  orphanedProducts.slice(0, 5).forEach((p, i) => {
    console.log(`${i + 1}. ${p.title} - userId: ${p.userId}`);
  });
} else {
  console.log('\n✅ All products have matching users');
} 