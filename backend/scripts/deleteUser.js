require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Delete user from data.json
function deleteUser(email) {
  try {
    const dataPath = path.join(__dirname, '../data/data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log(`🔍 Looking for user: ${email}`);
    console.log(`📊 Current users: ${data.users.length}`);
    
    // Find and remove user
    const userIndex = data.users.findIndex(user => user.email === email);
    
    if (userIndex === -1) {
      console.log(`❌ User ${email} not found`);
      return false;
    }
    
    // Remove user
    const deletedUser = data.users.splice(userIndex, 1)[0];
    console.log(`✅ Deleted user: ${deletedUser.email} (ID: ${deletedUser.id})`);
    
    // Remove user's products
    const userProducts = data.products.filter(product => product.userId === deletedUser.id);
    data.products = data.products.filter(product => product.userId !== deletedUser.id);
    console.log(`🗑️ Removed ${userProducts.length} products for user`);
    
    // Remove user's alerts
    const userAlerts = data.alerts.filter(alert => alert.userId === deletedUser.id);
    data.alerts = data.alerts.filter(alert => alert.userId !== deletedUser.id);
    console.log(`🗑️ Removed ${userAlerts.length} alerts for user`);
    
    // Save updated data
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log(`💾 Updated data.json`);
    console.log(`📊 Remaining users: ${data.users.length}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
    return false;
  }
}

// Main function
function main() {
  const email = 'michaelabrham9@gmail.com';
  
  console.log('🗑️ User Deletion Tool\n');
  
  const success = deleteUser(email);
  
  if (success) {
    console.log('\n✅ User deleted successfully!');
    console.log('📧 You can now sign up again to test the welcome email');
    console.log('🌐 Go to: http://localhost:3000 and create a new account');
  } else {
    console.log('\n❌ Failed to delete user');
  }
}

main(); 