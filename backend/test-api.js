const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

async function testApi() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@hospital.com',
            password: 'admin123'
        });

        const token = loginRes.data.token;
        console.log('✅ Login successful');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Test Dashboard Stats
        console.log('Testing /dashboard/stats...');
        try {
            const statsRes = await axios.get(`${API_URL}/dashboard/stats`, { headers });
            console.log('✅ /dashboard/stats success:', statsRes.data);
        } catch (err) {
            console.error('❌ /dashboard/stats failed:', err.response ? err.response.status : err.message);
            if (err.response) console.error(err.response.data);
        }

        // 3. Test Patients
        console.log('Testing /patients...');
        try {
            const patientsRes = await axios.get(`${API_URL}/patients`, { headers });
            console.log(`✅ /patients success: Found ${patientsRes.data.length} patients`);
        } catch (err) {
            console.error('❌ /patients failed:', err.response ? err.response.status : err.message);
            if (err.response) console.error(err.response.data);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testApi();
