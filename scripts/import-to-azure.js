import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: './backend/.env' });

async function importToAzure() {
    console.log('📥 Starting Azure Database Import...\n');

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

        // Check if export directory exists
        const exportDir = path.join(__dirname, '..', 'supabase-export');
        try {
            await fs.access(exportDir);
        } catch {
            throw new Error(`Export directory not found: ${exportDir}\nPlease run export-supabase-complete.js first!`);
        }

        // Read metadata
        const metadataPath = path.join(exportDir, '_export_metadata.json');
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

        console.log('📋 Export Metadata:');
        console.log(`  Exported at: ${metadata.exported_at}`);
        console.log(`   Source: ${metadata.supabase_url}\n`);

        // Read all table files
        const files = await fs.readdir(exportDir);
        const dataFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('_'));

        console.log(`Found ${dataFiles.length} tables to import\n`);

        const importStats = {};

        // Import data for each table
        for (const file of dataFiles) {
            const tableName = file.replace('.json', '');

            try {
                console.log(`📥 Importing ${tableName}...`);

                // Read data
                const filePath = path.join(exportDir, file);
                const rawData = await fs.readFile(filePath, 'utf-8');
                const data = JSON.parse(rawData);

                if (!data || data.length === 0) {
                    console.log(`  ⚠️  No data to import for ${tableName}`);
                    importStats[tableName] = { rows: 0, status: 'empty' };
                    continue;
                }

                // Get column names from first row
                const columns = Object.keys(data[0]);
                const columnsList = columns.map(col => `"${col}"`).join(', ');

                // Create table if it doesn't exist (infer schema from data)
                await createTableFromData(client, tableName, data[0]);

                // Insert data in batches
                const batchSize = 100;
                let imported = 0;

                for (let i = 0; i < data.length; i += batchSize) {
                    const batch = data.slice(i, i + batchSize);

                    for (const row of batch) {
                        const values = columns.map(col => row[col]);
                        const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');

                        const query = `INSERT INTO "${tableName}" (${columnsList}) VALUES (${placeholders})`;

                        try {
                            await client.query(query, values);
                            imported++;
                        } catch (error) {
                            // Try without conflicting IDs if unique constraint fails
                            if (error.code === '23505') {
                                console.log(`    ⚠️  Skipping duplicate row in ${tableName}`);
                            } else {
                                throw error;
                            }
                        }
                    }
                }

                importStats[tableName] = { rows: imported, status: 'success' };
                console.log(`  ✅ Imported ${imported} rows into ${tableName}`);

            } catch (error) {
                console.error(`  ❌ Error importing ${tableName}:`, error.message);
                importStats[tableName] = { rows: 0, status: 'error', error: error.message };
            }
        }

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 IMPORT SUMMARY');
        console.log('='.repeat(60));

        let totalRows = 0;
        Object.entries(importStats).forEach(([table, stats]) => {
            const status = stats.status === 'success' ? '✅' :
                stats.status === 'empty' ? '⚠️ ' : '❌';
            console.log(`  ${status} ${table.padEnd(25)} ${stats.rows.toString().padStart(6)} rows`);
            totalRows += stats.rows;
        });

        console.log('='.repeat(60));
        console.log(`  TOTAL:${' '.repeat(19)}${totalRows.toString().padStart(6)} rows`);
        console.log('='.repeat(60));

        await client.end();
        console.log('\n✅ Import completed!\n');

    } catch (error) {
        console.error('\n❌ Import failed:', error);
        await client.end().catch(() => { });
        throw error;
    }
}

async function createTableFromData(client, tableName, sampleRow) {
    // Check if table exists
    const checkResult = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `, [tableName]);

    if (checkResult.rows[0].exists) {
        console.log(`  ℹ️  Table ${tableName} already exists`);
        return;
    }

    console.log(`  🔨 Creating table ${tableName}...`);

    // Infer column types from sample data
    const columns = Object.entries(sampleRow).map(([key, value]) => {
        let type = 'TEXT';

        if (value === null) {
            type = 'TEXT';
        } else if (typeof value === 'number') {
            type = Number.isInteger(value) ? 'INTEGER' : 'NUMERIC';
        } else if (typeof value === 'boolean') {
            type = 'BOOLEAN';
        } else if (typeof value === 'object') {
            type = 'JSONB';
        } else if (typeof value === 'string') {
            // Check if it's a date
            if (value.match(/^\d{4}-\d{2}-\d{2}/) && !isNaN(Date.parse(value))) {
                type = 'TIMESTAMP';
            } else if (value.includes('@')) {
                type = 'VARCHAR(255)';
            } else {
                type = 'TEXT';
            }
        }

        return `"${key}" ${type}`;
    });

    const createQuery = `
    CREATE TABLE IF NOT EXISTS "${tableName}" (
      ${columns.join(',\n      ')}
    );
  `;

    await client.query(createQuery);
    console.log(`  ✅ Table ${tableName} created`);
}

// Run if called directly
importToAzure()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

export { importToAzure };
