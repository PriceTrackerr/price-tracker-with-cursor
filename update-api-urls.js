const fs = require('fs');
const path = require('path');

const files = [
  'web-app/src/pages/Products.tsx',
  'web-app/src/pages/ProductDetails.tsx',
  'web-app/src/pages/History.tsx',
  'web-app/src/components/Layout.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/http:\/\/localhost:3001/g, 'http://localhost:3000');
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});

console.log('All API URLs updated to use localhost:3000'); 