const axios = require('axios');

async function testSimpleTracking() {
  try {
    console.log('🧪 Testing simple product tracking...');
    
    // Test the health endpoint first
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Backend is running:', healthResponse.data);
    
    // Test the track endpoint with mock data (will fail without auth, but we can see the response)
    const mockProduct = {
      url: 'https://www.amazon.com/test-product',
      title: 'Test Product',
      price: 29.99,
      currency: 'USD',
      platform: 'amazon',
      imageUrl: 'https://example.com/image.jpg',
      stockStatus: 'in_stock'
    };
    
    try {
      const trackResponse = await axios.post('http://localhost:3001/api/products/track', mockProduct);
      console.log('✅ Track endpoint working:', trackResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Track endpoint working (auth required as expected)');
        console.log('📝 Response:', error.response.data);
      } else {
        console.log('❌ Track endpoint error:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleTracking(); 