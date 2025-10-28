const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API endpoints...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('Health endpoint:', healthResponse.data);
    
    // Test login
    const loginResponse = await axios.post('http://localhost:5000/api/citizens/login', {
      email: 'rajesh.kumar@example.com',
      password: 'Password@123'
    });
    console.log('Login response:', loginResponse.data);
    
    // Extract token for authenticated requests
    const token = loginResponse.data.token;
    
    // Test authenticated complaints endpoint
    const complaintsResponse = await axios.get('http://localhost:5000/api/complaints', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Complaints response (first 2):', complaintsResponse.data.slice(0, 2));
    
    // Test complaints analytics
    const analyticsResponse = await axios.get('http://localhost:5000/api/complaints/analytics');
    console.log('Analytics response:', analyticsResponse.data);
    
    // Test complaint groups
    const groupsResponse = await axios.get('http://localhost:5000/api/complaints/groups');
    console.log('Groups response:', groupsResponse.data);
    
    // Test my-complaints endpoint
    const myComplaintsResponse = await axios.get('http://localhost:5000/api/complaints/my-complaints', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('My complaints count:', myComplaintsResponse.data.length);
    
  } catch (error) {
    console.error('API test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testAPI();