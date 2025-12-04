# Supabase to Azure Migration Script
# Run this script to migrate all data from Supabase to Azure PostgreSQL

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     SUPABASE TO AZURE POSTGRESQL MIGRATION TOOL" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# Step 1: Export from Supabase
Write-Host "STEP 1/3: Exporting data from Supabase..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------"
node scripts/export-supabase-complete.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Export failed! Stopping migration." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Clear Azure database
Write-Host "STEP 2/3: Clearing Azure database..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------"
Write-Host "WARNING: This will delete all data in Azure!" -ForegroundColor Red
Write-Host "Press Ctrl+C in the next 3 seconds to cancel..." -ForegroundColor Red
Start-Sleep -Seconds 3

node scripts/clear-azure-database.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Clear failed! Your Supabase export is safe." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Import to Azure
Write-Host "STEP 3/3: Importing data to Azure..." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------------"
node scripts/import-to-azure.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Import failed! Check the error above." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Success summary
$duration = ((Get-Date) - $startTime).TotalSeconds
Write-Host "================================================================" -ForegroundColor Green
Write-Host "                  MIGRATION COMPLETED!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Total time: $([math]::Round($duration, 2)) seconds" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "   1. Verify data in Azure Portal"
Write-Host "   2. Update frontend to use backend API"
Write-Host "   3. Test application with Azure database"
Write-Host ""
