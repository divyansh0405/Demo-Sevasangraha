// Quick script to initialize billing tables in Azure PostgreSQL
const axios = require('axios');

async function initBillingTables() {
    try {
        // First login to get token
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:3002/api/auth/login', {
            email: 'admin@indic.com',
            password: 'Admin@1234' // Update if this is not correct
        });

        const token = loginRes.data.token;
        console.log('✅ Login successful');

        // Initialize billing tables
        console.log('Initializing billing tables...');
        const initRes = await axios.post('http://localhost:3002/api/billing/init-tables', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Success:', initRes.data.message);
        console.log('📊 Billing tables (opd_bills, ipd_bills) are now ready!');
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

initBillingTables();
