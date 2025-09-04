const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing Real Price Tracker API...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);

    // Test 2: Storage Test
    console.log('\n2. Testing Storage Connection...');
    const storageResponse = await axios.get(`${BASE_URL}/test-storage`);
    console.log('✅ Storage Test:', storageResponse.data);

    // Test 3: Create Test User
    console.log('\n3. Testing User Creation...');
    const userData = {
      email: 'test@example.com',
      password: 'testpassword123',
      username: 'testuser'
    };

    try {
      const userResponse = await axios.post(`${BASE_URL}/api/users/register`, userData);
      console.log('✅ User Created:', userResponse.data);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ User already exists (expected)');
      } else {
        console.log('❌ User Creation Error:', error.response?.data || error.message);
      }
    }

    // Test 4: Create Test Product
    console.log('\n4. Testing Product Creation...');
    const productData = {
      url: 'https://www.amazon.com/dp/B08N5WRWNW',
      title: 'Test Product - Echo Dot',
      price: 49.99,
      currency: 'USD',
      platform: 'amazon'
    };

    try {
      const productResponse = await axios.post(`${BASE_URL}/api/products`, productData);
      console.log('✅ Product Created:', productResponse.data);
    } catch (error) {
      console.log('❌ Product Creation Error:', error.response?.data || error.message);
    }

    // Test 5: Get Products
    console.log('\n5. Testing Product Retrieval...');
    try {
      const productsResponse = await axios.get(`${BASE_URL}/api/products`);
      console.log(`✅ Found ${productsResponse.data.length} products`);
    } catch (error) {
      console.log('❌ Product Retrieval Error:', error.response?.data || error.message);
    }

    // Test 6: Get Users
    console.log('\n6. Testing User Retrieval...');
    try {
      const usersResponse = await axios.get(`${BASE_URL}/api/users`);
      console.log(`✅ Found ${usersResponse.data.length} users`);
    } catch (error) {
      console.log('❌ User Retrieval Error:', error.response?.data || error.message);
    }

    console.log('\n🎉 API Testing Completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running: npm run dev');
    }
  }
}

// Test Supabase directly
async function testSupabaseDirect() {
  console.log('\n🔍 Testing Supabase Direct Connection...\n');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config();

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test connection
    const { data, error } = await supabase.from('subscription_plans').select('*');
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
    } else {
      console.log(`✅ Supabase connected! Found ${data.length} subscription plans`);
    }

  } catch (error) {
    console.log('❌ Supabase test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testAPI();
  await testSupabaseDirect();
}

runAllTests(); 