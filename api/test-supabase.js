const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('🧪 Testing Supabase Connection...\n');

  try {
    // Test 1: Check connection
    console.log('1. Testing connection...');
    const { data, error } = await supabase.from('subscription_plans').select('*').limit(1);
    if (error) throw error;
    console.log('✅ Connection successful');

    // Test 2: Check if tables exist
    console.log('\n2. Checking tables...');
    const tables = [
      'users', 'products', 'alerts', 'notifications', 'price_history',
      'payments', 'affiliate_transactions', 'payout_requests', 'subscription_plans'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: exists`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }

    // Test 3: Create a test user
    console.log('\n3. Creating test user...');
    const testUser = {
      email: 'test@example.com',
      password: 'hashedpassword123',
      username: 'testuser',
      role: 'user'
    };

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (userError) {
      console.log(`❌ User creation failed: ${userError.message}`);
    } else {
      console.log('✅ Test user created successfully');
      console.log(`   User ID: ${userData.id}`);
    }

    // Test 4: Create a test product
    console.log('\n4. Creating test product...');
    const testProduct = {
      url: 'https://example.com/product',
      title: 'Test Product',
      price: 99.99,
      currency: 'USD',
      platform: 'amazon',
      user_id: userData?.id || '00000000-0000-0000-0000-000000000000'
    };

    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single();

    if (productError) {
      console.log(`❌ Product creation failed: ${productError.message}`);
    } else {
      console.log('✅ Test product created successfully');
      console.log(`   Product ID: ${productData.id}`);
    }

    // Test 5: Query data
    console.log('\n5. Querying data...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.log(`❌ User query failed: ${usersError.message}`);
    } else {
      console.log(`✅ Found ${users.length} users in database`);
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) {
      console.log(`❌ Product query failed: ${productsError.message}`);
    } else {
      console.log(`✅ Found ${products.length} products in database`);
    }

    console.log('\n🎉 Supabase testing completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSupabase(); 