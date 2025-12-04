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

async function exportSupabaseData() {
    console.log('🚀 Starting Supabase Data Export...\n');

    try {
        // Create export directory
        const exportDir = path.join(__dirname, '..', 'supabase-export');
        await fs.mkdir(exportDir, { recursive: true });
        console.log(`✅ Created export directory: ${exportDir}\n`);

        // List of tables to export
        const tables = [
            'users',
            'patients',
            'doctors',
            'departments',
            'beds',
            'patient_admissions',
            'patient_visits',
            'patient_transactions',
            'appointments',
            'medicines',
            'daily_expenses',
            'discharge_summary',
            'email_logs',
            'sms_logs',
            'audit_logs',
            'custom_services',
            'patient_refunds'
        ];

        const exportedData = {};
        const exportStats = {};

        // Export each table
        for (const table of tables) {
            try {
                console.log(`📥 Exporting ${table}...`);

                let allData = [];
                let from = 0;
                const batchSize = 1000;
                let hasMore = true;

                // Paginate through large tables
                while (hasMore) {
                    const { data, error, count } = await supabase
                        .from(table)
                        .select('*', { count: 'exact' })
                        .range(from, from + batchSize - 1);

                    if (error) {
                        if (error.code === 'PGRST116') {
                            // Table doesn't exist
                            console.log(`⚠️  Table ${table} not found, skipping...`);
                            exportStats[table] = { rows: 0, exists: false };
                            break;
                        }
                        throw error;
                    }

                    if (data && data.length > 0) {
                        allData = allData.concat(data);
                        from += batchSize;

                        if (data.length < batchSize) {
                            hasMore = false;
                        }
                    } else {
                        hasMore = false;
                    }
                }

                // Save to file
                const filename = path.join(exportDir, `${table}.json`);
                await fs.writeFile(filename, JSON.stringify(allData, null, 2));

                exportedData[table] = allData;
                exportStats[table] = { rows: allData.length, exists: true };

                console.log(`✅ Exported ${allData.length} rows from ${table}`);

            } catch (error) {
                console.error(`❌ Error exporting ${table}:`, error.message);
                exportStats[table] = { rows: 0, error: error.message };
            }
        }

        // Export schema information
        console.log('\n📋 Exporting schema information...');
        const schemaInfo = {
            exported_at: new Date().toISOString(),
            supabase_url: supabaseUrl,
            tables: exportStats
        };

        await fs.writeFile(
            path.join(exportDir, '_export_metadata.json'),
            JSON.stringify(schemaInfo, null, 2)
        );

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 EXPORT SUMMARY');
        console.log('='.repeat(60));

        let totalRows = 0;
        Object.entries(exportStats).forEach(([table, stats]) => {
            if (stats.exists !== false) {
                console.log(`  ${table.padEnd(25)} ${stats.rows.toString().padStart(6)} rows`);
                totalRows += stats.rows;
            }
        });

        console.log('='.repeat(60));
        console.log(`  TOTAL:${' '.repeat(19)}${totalRows.toString().padStart(6)} rows`);
        console.log('='.repeat(60));

        console.log(`\n✅ Export completed successfully!`);
        console.log(`📁 Data saved to: ${exportDir}\n`);

        return exportedData;

    } catch (error) {
        console.error('\n❌ Export failed:', error);
        throw error;
    }
}

// Run export
exportSupabaseData()
    .then(() => {
        console.log('✅ All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

export { exportSupabaseData };
