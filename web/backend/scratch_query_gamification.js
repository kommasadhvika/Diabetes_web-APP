async function queryGamification() {
  try {
    console.log('Logging in to get authentication token...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'kondasivaramajeswanth@gmail.com',
        password: 'Password123!'
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.success) {
      throw new Error(loginData.message || 'Login failed');
    }
    const token = loginData.token;
    console.log('Token retrieved successfully.');

    console.log('Calling /api/gamification/status...');
    const gamificationRes = await fetch('http://localhost:5000/api/gamification/status', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const gamificationData = await gamificationRes.json();
    console.log('Gamification Status Payload:');
    console.log(JSON.stringify(gamificationData, null, 2));

    console.log('\nCalling /api/reports...');
    const reportsRes = await fetch('http://localhost:5000/api/reports', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const reportsData = await reportsRes.json();
    console.log('Reports Payload:');
    console.log(JSON.stringify(reportsData, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('API Query failed:', err.message);
    process.exit(1);
  }
}

queryGamification();
