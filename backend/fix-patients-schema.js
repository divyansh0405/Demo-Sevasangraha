const { Client } = require('pg');
require('dotenv').config();

async function fixPatientsSchema() {
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

        console.log('Adding missing columns to patients table...');

        await client.query(`
            ALTER TABLE patients 
            ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS address TEXT,
            ADD COLUMN IF NOT EXISTS date_of_entry TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
        `);

        console.log('✅ patients table updated successfully');

        await client.end();
    } catch (error) {
        console.error('Error fixing patients schema:', error);
        process.exit(1);
    }
}

fixPatientsSchema();
