const axios = require('axios');

const API_URL = 'http://localhost:3001/api/auth/login';
const email = 'admin@indic.com';
const password = 'Admin@1234';

async function testLogin() {
    console.log(`Attempting login to ${API_URL} with ${email}...`);
    try {
        const response = await axios.post(API_URL, {
            email,
            password
        });

        console.log('Login Successful!');
        console.log('Status:', response.status);
        console.log('User:', response.data.user);
        console.log('Token:', response.data.token ? 'Received' : 'Missing');
    } catch (error) {
        console.error('Login Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received. Is the server running?');
        } else {
            console.error('Error:', error.message);
        }
    }
}

testLogin();
