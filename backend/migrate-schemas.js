import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function completeAzureMigration() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║         AZURE SCHEMA-ONLY MIGRATION TOOL                 ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');

    const config = {
        host: process.env.AZURE_DB_HOST,
        port: process.env.AZURE_DB_PORT,
        database: process.env.AZURE_DB_NAME,
        user: process.env.AZURE_DB_USER,
        password: process.env.AZURE_DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 60000 // 60 seconds
    };

    console.log(`🔗 Connecting to: ${config.host}/${config.database}\n`);

    const client = new Client(config);

    try {
        await client.connect();
        console.log('✅ Connected to Azure PostgreSQL\n');

        // STEP 1: Clear existing tables
        console.log('🗑️  STEP 1: Clearing existing Azure tables...');
        console.log('─'.repeat(60));

        const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

        if (tablesResult.rows.length > 0) {
            console.log(`Found ${tablesResult.rows.length} tables to drop:`);
            for (const row of tablesResult.rows) {
                console.log(`  - ${row.tablename}`);
            }

            for (const row of tablesResult.rows) {
                try {
                    await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE;`);
                    console.log(`  ✅ Dropped ${row.tablename}`);
                } catch (error) {
                    console.error(`  ❌ Error dropping ${row.tablename}:`, error.message);
                }
            }
        } else {
            console.log('ℹ️  No existing tables found');
        }

        console.log('\n✅ Azure database cleared\n');

        // STEP 2: Import schemas
        console.log('📥 STEP 2: Creating empty tables from Supabase schemas...');
        console.log('─'.repeat(60));

        const schemaFile = path.join(__dirname, '..', 'schema-export', 'schemas.json');
        const schemas = JSON.parse(await fs.readFile(schemaFile, 'utf-8'));

        let createdCount = 0;
        let skippedCount = 0;

        for (const [tableName, schema] of Object.entries(schemas)) {
            if (!schema.exists || (!schema.columns && !schema.empty)) {
                console.log(`⚠️  Skipping ${tableName} (no schema data)`);
                skippedCount++;
                continue;
            }

            try {
                console.log(`🔨 Creating table ${tableName}...`);

                // For empty tables without column data, create a basic structure
                if (schema.empty && (!schema.columns || Object.keys(schema.columns).length === 0)) {
                    const createTableSQL = `
            CREATE TABLE IF NOT EXISTS "${tableName}" (
              id SERIAL PRIMARY KEY,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `;
                    await client.query(createTableSQL);
                    console.log(`  ✅ Table ${tableName} created (minimal structure)`);
                } else {
                    // Build CREATE TABLE statement from schema
                    const columnDefs = Object.entries(schema.columns).map(([colName, colType]) => {
                        return `  "${colName}" ${colType}`;
                    });

                    const createTableSQL = `
            CREATE TABLE IF NOT EXISTS "${tableName}" (
              ${columnDefs.join(',\n')}
            );
          `;

                    await client.query(createTableSQL);
                    console.log(`  ✅ Table ${tableName} created (${Object.keys(schema.columns).length} columns)`);
                }

                createdCount++;

            } catch (error) {
                console.error(`  ❌ Error creating ${tableName}:`, error.message);
                skippedCount++;
            }
        }

        console.log('');
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║                   MIGRATION SUMMARY                       ║');
        console.log('╚═══════════════════════════════════════════════════════════╝');
        console.log('');
        console.log(`  ✅ Tables created: ${createdCount}`);
        console.log(`  ⚠️  Tables skipped: ${skippedCount}`);
        console.log('');
        console.log('  📋 All tables are EMPTY (schema-only migration)');
        console.log('');

        // Verify
        const finalTablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

        console.log('  📊 Final table list in Azure:');
        finalTablesResult.rows.forEach(row => {
            console.log(`     - ${row.tablename}`);
        });

        await client.end();
        console.log('');
        console.log('✅ Schema migration completed successfully!');
        console.log('');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        await client.end().catch(() => { });
        process.exit(1);
    }
}

// Run migration
completeAzureMigration();
