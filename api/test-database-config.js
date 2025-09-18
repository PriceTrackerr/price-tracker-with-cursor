// Test script to verify database configuration
require('dotenv').config();

console.log('🔍 Database Configuration Test');
console.log('================================');

// Check environment variables
console.log('Environment Variables:');
console.log('- USE_SUPABASE:', process.env.USE_SUPABASE);
console.log('- USE_LOCAL_DB:', process.env.USE_LOCAL_DB);
console.log('- VERCEL:', process.env.VERCEL);
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set');
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');

console.log('\n🔧 Testing Database Configuration:');

try {
  const { getDb } = require('./dist/config/database');
  const db = getDb();
  
  console.log('✅ Database configuration loaded successfully');
  console.log('- Database type:', db.constructor.name);
  
  // Test a simple operation
  if (typeof db.getProducts === 'function') {
    console.log('✅ Database has getProducts method');
    
    // Try to get products (this will test the actual connection)
    db.getProducts().then(products => {
      console.log(`✅ Database connection successful - found ${products.length} products`);
      process.exit(0);
    }).catch(error => {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    });
  } else {
    console.log('❌ Database does not have expected methods');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Failed to load database configuration:', error.message);
  process.exit(1);
}
