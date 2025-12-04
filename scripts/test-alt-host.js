import pkg from 'pg';
const { Client } = pkg;

async function testConnection() {
    const config = {
        host: 'sevasangraha.postgres.database.azure.com',
        port: 5432,
        database: 'postgres',
        user: 'divyansh04',
        password: 'Rawal@00',
        ssl: { rejectUnauthorized: false }
    };

    console.log(`Testing connection to ${config.host}...`);
    const client = new Client(config);
    try {
        await client.connect();
        console.log('✅ Connected successfully!');
        await client.end();
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    }
}

testConnection();
