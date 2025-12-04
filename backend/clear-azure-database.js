import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

async function clearAzureDatabase() {
    console.log('🗑️  Starting Azure Database Cleanup...\n');

    const config = {
        host: process.env.AZURE_DB_HOST,
        port: process.env.AZURE_DB_PORT,
        database: process.env.AZURE_DB_NAME,
        user: process.env.AZURE_DB_USER,
        password: process.env.AZURE_DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    };

    console.log(`Connecting to: ${config.host}/${config.database}\n`);

    const client = new Client(config);

    try {
        await client.connect();
        console.log('✅ Connected to Azure PostgreSQL\n');

        // Get all tables in public schema
        const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

        if (tablesResult.rows.length === 0) {
            console.log('ℹ️  No tables found. Database is already empty.\n');
            await client.end();
            return;
        }

        console.log('📋 Found tables to delete:');
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.tablename}`);
        });
        console.log('');

        // Drop all tables
        console.log('🗑️  Dropping all tables...');
        for (const row of tablesResult.rows) {
            try {
                await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE;`);
                console.log(`  ✅ Dropped ${row.tablename}`);
            } catch (error) {
                console.error(`  ❌ Error dropping ${row.tablename}:`, error.message);
            }
        }

        // Verify all tables are gone
        const verifyResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);

        console.log('\n' + '='.repeat(60));
        if (verifyResult.rows[0].count === '0') {
            console.log('✅ SUCCESS: Azure database is now empty');
        } else {
            console.log(`⚠️  WARNING: ${verifyResult.rows[0].count} tables still exist`);
        }
        console.log('='.repeat(60) + '\n');

        await client.end();
        console.log('✅ Database cleanup completed!\n');

    } catch (error) {
        console.error('\n❌ Cleanup failed:', error);
        await client.end().catch(() => { });
        throw error;
    }
}

// Run if called directly
console.log('⚠️  WARNING: This will DELETE ALL DATA in Azure database!');
console.log('Press Ctrl+C now to cancel...\n');

setTimeout(() => {
    clearAzureDatabase()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}, 3000);

export { clearAzureDatabase };
