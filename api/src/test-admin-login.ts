import axios from 'axios';

interface LoginResponse {
  token: string;
  message: string;
}

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await axios.post<LoginResponse>('http://localhost:3000/api/admin/login', {
      username: 'admin',
      password: 'admin123'
    });

    console.log('Login successful!');
    console.log('Token:', response.data.token);
    
    // Test leaderboards access
    const leaderboardResponse = await axios.get('http://localhost:3000/api/admin/leaderboards', {
      headers: {
        Authorization: `Bearer ${response.data.token}`
      }
    });

    console.log('\nLeaderboards data:');
    console.log(JSON.stringify(leaderboardResponse.data, null, 2));

  } catch (error: any) {
    console.error('Error during testing:', error.response?.data || error.message);
  }
}

testAdminLogin(); 