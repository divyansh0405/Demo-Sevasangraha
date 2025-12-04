const { Client } = require('pg');
require('dotenv').config();

async function fixSchema() {
    const config = {
        host: process.env.AZURE_DB_HOST,
        port: process.env.AZURE_DB_PORT,
        database: process.env.AZURE_DB_NAME,
        user: process.env.AZURE_DB_USER,
        password: process.env.AZURE_DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log('Connected to DB');

        // 1. Fix patients table
        console.log('Fixing patients table...');
        await client.query(`
            ALTER TABLE patients 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        `);
        console.log('✅ patients table updated');

        // 2. Fix patient_transactions table
        console.log('Fixing patient_transactions table...');
        await client.query(`
            ALTER TABLE patient_transactions 
            ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
        `);
        console.log('✅ patient_transactions table updated');

        // 3. Fix patient_admissions table
        console.log('Fixing patient_admissions table...');
        // Check if we need to add columns or recreate
        // We'll add columns to be safe
        await client.query(`
            ALTER TABLE patient_admissions 
            ADD COLUMN IF NOT EXISTS patient_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS bed_number VARCHAR(50),
            ADD COLUMN IF NOT EXISTS room_type VARCHAR(50),
            ADD COLUMN IF NOT EXISTS department VARCHAR(100),
            ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10,2),
            ADD COLUMN IF NOT EXISTS admission_date TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS discharge_date TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
            ADD COLUMN IF NOT EXISTS treating_doctor VARCHAR(255),
            ADD COLUMN IF NOT EXISTS history_present_illness TEXT,
            ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        `);
        console.log('✅ patient_admissions table updated');

        await client.end();
        console.log('🎉 Schema fixed successfully!');
    } catch (error) {
        console.error('Error fixing schema:', error);
        process.exit(1);
    }
}

fixSchema();
