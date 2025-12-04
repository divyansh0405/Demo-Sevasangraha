require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkPatients() {
    try {
        // Check all patients
        const allResult = await pool.query('SELECT id, first_name, last_name, is_active, created_at FROM patients ORDER BY created_at DESC LIMIT 10');
        console.log('=== ALL PATIENTS (no filter) ===');
        console.log('Total found:', allResult.rows.length);
        allResult.rows.forEach(p => console.log(`- ${p.first_name} ${p.last_name} | is_active: ${p.is_active} | created_at: ${p.created_at}`));

        // Check active patients only
        const activeResult = await pool.query('SELECT id, first_name, last_name, is_active, created_at FROM patients WHERE is_active = true ORDER BY created_at DESC LIMIT 10');
        console.log('\n=== ACTIVE PATIENTS (is_active = true) ===');
        console.log('Total found:', activeResult.rows.length);
        activeResult.rows.forEach(p => console.log(`- ${p.first_name} ${p.last_name} | is_active: ${p.is_active}`));

        // Check null is_active
        const nullResult = await pool.query('SELECT id, first_name, last_name, is_active FROM patients WHERE is_active IS NULL LIMIT 10');
        console.log('\n=== PATIENTS WITH NULL is_active ===');
        console.log('Total found:', nullResult.rows.length);
        nullResult.rows.forEach(p => console.log(`- ${p.first_name} ${p.last_name} | is_active: ${p.is_active}`));

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkPatients();
