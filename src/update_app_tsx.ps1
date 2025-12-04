$file = "C:\Users\DELL\hospital-crm-pro-new\src\App.tsx"
$content = Get-Content $file -Raw

# Replace backup refund fetch
$backupOld = @"
      // Get all refunds with error handling
      let refunds: any[] = [];
      try {
        const { data: refundData, error: refundError } = await supabase
          .from('patient_refunds')
          .select(`
            *,
            patient:patients(id, patient_id, first_name, last_name, phone)
          `)
          .eq('hospital_id', '550e8400-e29b-41d4-a716-446655440000')
          .order('created_at', { ascending: false });
        
        if (!refundError && refundData) {
          refunds = refundData;
          logger.log(`✅ Retrieved ${refunds.length} refunds for backup`);
        } else {
          logger.warn('⚠️ Refunds table not accessible, skipping refunds in backup');
          refunds = [];
        }
      } catch (error) {
        logger.warn('⚠️ Error fetching refunds, using empty array:', error);
        refunds = [];
      }
"@

$backupNew = @"
      // Get all refunds with error handling
      let refunds: any[] = [];
      try {
        // Use ExactDateService to get all refunds (wide date range)
        const refundData = await ExactDateService.getPatientRefunds('2000-01-01', '2100-12-31');
        
        if (refundData) {
          refunds = refundData;
          logger.log(`✅ Retrieved ${refunds.length} refunds for backup`);
        } else {
          refunds = [];
        }
      } catch (error) {
        logger.warn('⚠️ Error fetching refunds, using empty array:', error);
        refunds = [];
      }
"@

# Replace export refund fetch
$exportOld = @"
      // Add refunds data to export
      try {
        const { data: refunds } = await supabase
          .from('patient_refunds')
          .select(`
            *,
            patient:patients(id, patient_id, first_name, last_name, phone)
          `)
          .eq('hospital_id', '550e8400-e29b-41d4-a716-446655440000');
          
        exportDataObject.refunds = {
          count: refunds?.length || 0,
          data: refunds || [],
          note: refunds?.length === 0 ? 'No refunds found or table not accessible' : 'All refunds included'
        };
      } catch (error) {
        logger.warn('⚠️ Refunds not available for export:', error);
        exportDataObject.refunds = {
          count: 0,
          data: [],
          note: 'Refunds table not accessible'
        };
      }
"@

$exportNew = @"
      // Add refunds data to export
      try {
        // Use ExactDateService to get all refunds (wide date range)
        const refunds = await ExactDateService.getPatientRefunds('2000-01-01', '2100-12-31');
          
        exportDataObject.refunds = {
          count: refunds?.length || 0,
          data: refunds || [],
          note: refunds?.length === 0 ? 'No refunds found' : 'All refunds included'
        };
      } catch (error) {
        logger.warn('⚠️ Refunds not available for export:', error);
        exportDataObject.refunds = {
          count: 0,
          data: [],
          note: 'Refunds table not accessible'
        };
      }
"@

# Normalize line endings to handle potential mismatches
$content = $content -replace "`r`n", "`n"
$backupOld = $backupOld -replace "`r`n", "`n"
$exportOld = $exportOld -replace "`r`n", "`n"

if ($content.Contains($backupOld)) {
    $content = $content.Replace($backupOld, $backupNew)
    Write-Host "Replaced backup refund fetch"
}
else {
    Write-Host "Backup refund fetch not found"
}

if ($content.Contains($exportOld)) {
    $content = $content.Replace($exportOld, $exportNew)
    Write-Host "Replaced export refund fetch"
}
else {
    Write-Host "Export refund fetch not found"
}

$content | Set-Content $file -NoNewline
Write-Host "File updated"
