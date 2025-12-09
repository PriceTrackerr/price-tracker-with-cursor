const fetch = require('node-fetch');

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');

    const response = await fetch('http://localhost:3001/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'realpricetracker94@gmail.com',
        password: 'admin123' // You'll need to provide the correct password
      }),
    });

    const data = await response.json();
    console.log('Login response:', data);

    if (data.success && data.data?.token) {
      console.log('✅ Admin login successful!');
      console.log('Token:', data.data.token.substring(0, 50) + '...');

      // Test the admin endpoints
      const token = data.data.token;

      // Test users endpoint
      const usersResponse = await fetch('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const usersData = await usersResponse.json();
      console.log('Users endpoint response:', usersData);

      // Test products endpoint
      const productsResponse = await fetch('http://localhost:3001/api/products/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const productsData = await productsResponse.json();
      console.log('Products endpoint response:', productsData);

    } else {
      console.log('❌ Admin login failed:', data.message);
    }
  } catch (error) {
    console.error('Error testing admin login:', error);
  }
}

testAdminLogin();
//testing push
