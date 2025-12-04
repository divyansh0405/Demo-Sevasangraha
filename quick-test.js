import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function quickTest() {
    const client = new Client({
        host: process.env.AZURE_DB_HOST,
        port: 5432,
        database: 'postgres',
        user: process.env.AZURE_DB_USER,
        password: process.env.AZURE_DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to:', process.env.AZURE_DB_HOST);
        await client.connect();
        console.log('✅ Connected successfully!');

        const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
        console.log('\n📋 Tables found:');
        tables.rows.forEach(row => console.log('  -', row.tablename));

        const users = await client.query('SELECT email, role FROM users LIMIT 5');
        console.log('\n👥 Users in database:');
        users.rows.forEach(row => console.log('  -', row.email, '(' + row.role + ')'));

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Code:', error.code);
    } finally {
        await client.end();
    }
}

quickTest();
