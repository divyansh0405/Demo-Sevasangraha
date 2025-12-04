const { Client } = require('pg');
require('dotenv').config();

async function checkTables() {
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

        const tablesToCheck = ['patients', 'patient_admissions', 'patient_transactions', 'users'];

        for (const table of tablesToCheck) {
            const res = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                );
            `, [table]);

            const exists = res.rows[0].exists;
            console.log(`Table '${table}': ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
        }

        await client.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTables();
