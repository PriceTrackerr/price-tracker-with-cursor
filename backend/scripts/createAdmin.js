const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Path to data file
const dataPath = path.join(__dirname, '../data/data.json');

// Read current data
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Create admin user data
const adminUser = {
  id: "admin-001",
  email: "realpricetracker94@gmail.com",
  password: bcrypt.hashSync("12121212", 10),
  username: "admin",
  role: "admin",
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  seenPriceDropIds: []
};

// Add admin user to users array
data.users.push(adminUser);

// Write back the updated data
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('Admin user created successfully!');
console.log('Email: realpricetracker94@gmail.com');
console.log('Password: 12121212');
console.log('Role: admin');
console.log('Total users now:', data.users.length); 