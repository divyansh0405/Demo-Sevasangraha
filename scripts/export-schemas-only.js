import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Tables used by the frontend (found by analyzing the codebase)
const FRONTEND_TABLES = [
    'patients',
    'patient_transactions',
    'patient_admissions',
    'patient_visits',
    'patient_refunds',
    'doctors',
    'departments',
    'beds',
    'daily_expenses',
    'medicines',
    'custom_services',
    'future_appointments',
    'audit_logs',
    'email_logs',
    'sms_logs',
    'hospitals',
    'discharge_summary',
    'users'
];

async function exportSchemas() {
    console.log('📋 Starting Schema Export from Supabase...\n');

    try {
        const schemas = {};

        for (const tableName of FRONTEND_TABLES) {
            console.log(`📥 Analyzing ${tableName}...`);

            try {
                // Get one row to analyze structure
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (error) {
                    if (error.code === 'PGRST116') {
                        console.log(`  ⚠️  Table ${tableName} does not exist, skipping...`);
                        continue;
                    }
                    throw error;
                }

                if (!data || data.length === 0) {
                    console.log(`  ℹ️  Table ${tableName} exists but is empty`);
                    schemas[tableName] = { exists: true, empty: true, columns: {} };
                    continue;
                }

                // Analyze column types from the sample row
                const sampleRow = data[0];
                const columns = {};

                Object.entries(sampleRow).forEach(([key, value]) => {
                    let type = 'TEXT';

                    if (value === null) {
                        type = 'TEXT';
                    } else if (typeof value === 'number') {
                        type = Number.isInteger(value) ? 'INTEGER' : 'NUMERIC';
                    } else if (typeof value === 'boolean') {
                        type = 'BOOLEAN';
                    } else if (typeof value === 'object' && !Array.isArray(value)) {
                        type = 'JSONB';
                    } else if (Array.isArray(value)) {
                        type = 'JSONB';
                    } else if (typeof value === 'string') {
                        // Check if it's a timestamp
                        if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                            type = 'TIMESTAMP WITH TIME ZONE';
                        } else if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
                            type = 'DATE';
                        } else if (value.length > 255) {
                            type = 'TEXT';
                        } else {
                            type = 'VARCHAR(255)';
                        }
                    }

                    columns[key] = type;
                });

                schemas[tableName] = {
                    exists: true,
                    empty: false,
                    columns
                };

                console.log(`  ✅ Schema captured (${Object.keys(columns).length} columns)`);

            } catch (error) {
                console.error(`  ❌ Error analyzing ${tableName}:`, error.message);
                schemas[tableName] = { exists: false, error: error.message };
            }
        }

        // Save schemas to file
        const exportDir = path.join(__dirname, '..', 'schema-export');
        await fs.mkdir(exportDir, { recursive: true });

        const schemaFile = path.join(exportDir, 'schemas.json');
        await fs.writeFile(schemaFile, JSON.stringify(schemas, null, 2));

        console.log('\n' + '='.repeat(60));
        console.log('📊 SCHEMA EXPORT SUMMARY');
        console.log('='.repeat(60));

        let successCount = 0;
        Object.entries(schemas).forEach(([table, info]) => {
            if (info.exists) {
                const status = info.empty ? '(empty)' : `(${Object.keys(info.columns || {}).length} cols)`;
                console.log(`  ✅ ${table.padEnd(25)} ${status}`);
                successCount++;
            }
        });

        console.log('='.repeat(60));
        console.log(`  Total schemas: ${successCount}/${FRONTEND_TABLES.length}`);
        console.log('='.repeat(60));

        console.log(`\n✅ Schemas saved to: ${schemaFile}\n`);

        return schemas;

    } catch (error) {
        console.error('\n❌ Schema export failed:', error);
        throw error;
    }
}

// Run export
exportSchemas()
    .then(() => {
        console.log('✅ Schema export completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

export { exportSchemas };
