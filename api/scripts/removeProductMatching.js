const fs = require('fs');
const path = require('path');

// Read the data file
const dataPath = path.join(__dirname, '../data/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Remove matchedProducts and alsoFoundOn from all products
data.products = data.products.map(product => {
  const { matchedProducts, alsoFoundOn, ...cleanProduct } = product;
  return cleanProduct;
});

// Write the cleaned data back
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('✅ Removed all product matching data from data.json');
console.log(`📊 Cleaned ${data.products.length} products`); 