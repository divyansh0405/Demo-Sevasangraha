// Migration orchestration script
// Note: Run individual scripts separately due to module type differences

const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     SUPABASE TO AZURE POSTGRESQL MIGRATION TOOL          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');

    const startTime = Date.now();

    try {
        // Step 1: Export from Supabase
        console.log('📤 STEP 1/3: Exporting data from Supabase...');
        console.log('─'.repeat(60));
        await exportSupabaseData();
        console.log('');

        // Step 2: Clear Azure database
        console.log('🗑️  STEP 2/3: Clearing Azure database...');
        console.log('─'.repeat(60));
        console.log('⚠️  WARNING: Deleting all data in Azure in 3 seconds...');
        console.log('           Press Ctrl+C to cancel!\n');

        await new Promise(resolve => setTimeout(resolve, 3000));
        await clearAzureDatabase();
        console.log('');

        // Step 3: Import to Azure
        console.log('📥 STEP 3/3: Importing data to Azure...');
        console.log('─'.repeat(60));
        await importToAzure();
        console.log('');

        // Success summary
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║                  MIGRATION COMPLETED!                     ║');
        console.log('╚═══════════════════════════════════════════════════════════╝');
        console.log('');
        console.log(`⏱️  Total time: ${duration} seconds`);
        console.log('');
        console.log('✅ Next steps:');
        console.log('   1. Verify data in Azure Portal');
        console.log('   2. Update frontend to use backend API');
        console.log('   3. Test application with Azure database');
        console.log('');

    } catch (error) {
        console.error('\n╔═══════════════════════════════════════════════════════════╗');
        console.error('║                  MIGRATION FAILED!                        ║');
        console.error('╚═══════════════════════════════════════════════════════════╝');
        console.error('\nError:', error.message);
        console.error('\n⚠️  Your Supabase data is safe. You can retry the migration.');
        process.exit(1);
    }
}

// Run migration
runMigration();
