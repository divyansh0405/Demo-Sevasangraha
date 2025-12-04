const { Client } = require('pg');
require('dotenv').config();

async function testAzureConnection() {
    console.log('🔍 Testing Azure PostgreSQL Connection...\n');

    const config = {
        host: process.env.AZURE_DB_HOST,
        port: process.env.AZURE_DB_PORT,
        database: process.env.AZURE_DB_NAME,
        user: process.env.AZURE_DB_USER,
        password: process.env.AZURE_DB_PASSWORD,
        ssl: {
            rejectUnauthorized: false
        }
    };

    console.log('Configuration:');
    console.log(`  Host: ${config.host}`);
    console.log(`  Port: ${config.port}`);
    console.log(`  Database: ${config.database}`);
    console.log(`  User: ${config.user}`);
    console.log(`  SSL: Enabled\n`);

    const client = new Client(config);

    try {
        console.log('Attempting to connect...');
        await client.connect();
        console.log('✅ Successfully connected to Azure PostgreSQL!\n');

        // Test query
        console.log('Running test query...');
        const result = await client.query('SELECT version(), current_database();');
        console.log('✅ Query successful!');
        console.log(`  PostgreSQL Version: ${result.rows[0].version}`);
        console.log(`  Current Database: ${result.rows[0].current_database}\n`);

        // Check for tables
        console.log('Checking for tables...');
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name 
      LIMIT 10;
    `);

        if (tablesResult.rows.length > 0) {
            console.log('✅ Found tables:');
            tablesResult.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        } else {
            console.log('⚠️  No tables found in the database');
        }

        await client.end();
        console.log('\n✅ Connection test completed successfully!');

    } catch (error) {
        console.error('\n❌ Connection failed!');
        console.error('Error:', error.message);

        if (error.code) {
            console.error('Error Code:', error.code);
        }

        // Common error hints
        if (error.message.includes('authentication')) {
            console.error('\n💡 Hint: Check your username and password');
        } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
            console.error('\n💡 Hint: Check firewall rules in Azure Portal');
        } else if (error.message.includes('getaddrinfo')) {
            console.error('\n💡 Hint: Check if the hostname is correct');
        }

        await client.end().catch(() => { });
        process.exit(1);
    }
}

testAzureConnection();
