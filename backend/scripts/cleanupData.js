const fs = require('fs');
const path = require('path');

// Path to data file
const dataPath = path.join(__dirname, '../data/data.json');

// Read current data
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Find the target user
const targetUser = data.users.find(user => user.email === 'michaelabrham8@gmail.com');

if (!targetUser) {
  console.error('Target user michaelabrham8@gmail.com not found!');
  process.exit(1);
}

console.log('Found target user:', targetUser.email);

// Keep only the target user
data.users = [targetUser];

// Keep only products belonging to the target user
data.products = data.products.filter(product => product.userId === targetUser.id);

// Keep only alerts belonging to the target user
data.alerts = data.alerts.filter(alert => alert.userId === targetUser.id);

// Keep only notifications belonging to the target user
if (data.notifications) {
  data.notifications = data.notifications.filter(notification => notification.userId === targetUser.id);
}

// Keep only payments belonging to the target user (if any)
if (data.payments) {
  data.payments = data.payments.filter(payment => payment.userId === targetUser.id);
}

// Keep only affiliate transactions belonging to the target user (if any)
if (data.affiliateTransactions) {
  data.affiliateTransactions = data.affiliateTransactions.filter(transaction => transaction.userId === targetUser.id);
}

// Keep only payout requests belonging to the target user (if any)
if (data.payoutRequests) {
  data.payoutRequests = data.payoutRequests.filter(request => request.userId === targetUser.id);
}

// Write back the cleaned data
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('Data cleanup completed!');
console.log('Users kept:', data.users.length);
console.log('Products kept:', data.products.length);
console.log('Alerts kept:', data.alerts.length);
console.log('Notifications kept:', data.notifications ? data.notifications.length : 0);
console.log('Payments kept:', data.payments ? data.payments.length : 0);
console.log('Affiliate transactions kept:', data.affiliateTransactions ? data.affiliateTransactions.length : 0);
console.log('Payout requests kept:', data.payoutRequests ? data.payoutRequests.length : 0); 