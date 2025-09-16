const axios = require('axios');

async function testProductTracking() {
  try {
    console.log('🧪 Testing product tracking API...');
    
    // Test data
    const testProduct = {
      url: 'https://www.amazon.com/test-product',
      title: 'Test Product',
      price: 29.99,
      currency: 'USD',
      platform: 'amazon',
      imageUrl: 'https://example.com/image.jpg',
      stockStatus: 'in_stock'
    };
    
    // First, test the health endpoint
    console.log('🏥 Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Health endpoint working:', healthResponse.data);
    
    // Test the track endpoint (this will fail without auth, but we can see the response)
    console.log('📦 Testing track endpoint...');
    try {
      const trackResponse = await axios.post('http://localhost:3001/api/products/track', testProduct);
      console.log('✅ Track endpoint working:', trackResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('🔒 Track endpoint requires authentication (expected):', error.response.status, error.response.data);
      } else {
        console.log('❌ Track endpoint error:', error.message);
      }
    }
    
    console.log('✅ Product tracking API test completed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProductTracking(); 