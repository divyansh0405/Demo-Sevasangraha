const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

async function testCreatePatient() {
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

        // 2. Create Patient
        console.log('Creating patient...');
        const newPatient = {
            patient_id: `PAT-${Date.now()}`,
            first_name: 'Test',
            last_name: 'Patient',
            age: '30',
            gender: 'Male',
            phone: '1234567890',
            email: 'test@patient.com',
            address: '123 Test St',
            emergency_contact_name: 'Emergency Contact',
            emergency_contact_phone: '0987654321',
            medical_history: 'None',
            allergies: 'None',
            current_medications: 'None',
            blood_group: 'O+',
            notes: 'Test patient',
            date_of_entry: new Date().toISOString()
        };

        const createRes = await axios.post(`${API_URL}/patients`, newPatient, { headers });
        console.log('✅ Patient created successfully:', createRes.data);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testCreatePatient();
