import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: './backend/.env' });

async function importSchemasToAzure() {
    console.log('📥 Starting Schema Import to Azure...\n');

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

        // Read schemas file
        const schemaFile = path.join(__dirname, '..', 'schema-export', 'schemas.json');
        const schemas = JSON.parse(await fs.readFile(schemaFile, 'utf-8'));

        let createdCount = 0;
        let skippedCount = 0;

        for (const [tableName, schema] of Object.entries(schemas)) {
            if (!schema.exists || !schema.columns) {
                console.log(`⚠️ Skipping ${tableName} (no schema data)`);
                skippedCount++;
                continue;
            }

            try {
                console.log(`🔨 Creating table ${tableName}...`);

                // Build CREATE TABLE statement
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
                createdCount++;

            } catch (error) {
                console.error(`  ❌ Error creating ${tableName}:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 IMPORT SUMMARY');
        console.log('='.repeat(60));
        console.log(`  ✅ Created: ${createdCount} tables`);
        console.log(`  ⚠️  Skipped: ${skippedCount} tables`);
        console.log('='.repeat(60));

        await client.end();
        console.log('\n✅ Schema import completed!\n');

    } catch (error) {
        console.error('\n❌ Import failed:', error);
        await client.end().catch(() => { });
        throw error;
    }
}

// Run if called directly
importSchemasToAzure()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

export { importSchemasToAzure };
