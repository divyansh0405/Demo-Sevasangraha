$file = "C:\Users\DELL\hospital-crm-pro-new\src\components\EnhancedDashboard.tsx"
$content = Get-Content $file -Raw

# Replace fetchAllRefunds using literal string matching
$oldFunction = '@
  // Helper function to fetch all refunds with pagination
  const fetchAllRefunds = async () => {
    try {
      let allRefunds: any[] = [];
      const pageSize = 1000;
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        console.log(`📄 Fetching refunds page ${page + 1}: rows ${from} to ${to}`);

        const { data, error } = await supabase
          .from('patient_refunds')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) {
          console.warn(`⚠️ Patient refunds table not accessible (page ${page + 1}):`, error.message);
          // If table doesn't exist or has permission issues, return empty array
return [];
}

if (data && data.length > 0) {
    allRefunds = [...allRefunds, ...data];
    console.log(`✅ Fetched ${data.length} refunds in page ${page + 1}, total so far: ${allRefunds.length}`);
          
        if (data.length < pageSize) {
            hasMore = false;
        } else {
            page++;
        }
    } else {
        hasMore = false;
    }
}

console.log(`📊 Total refunds fetched: ${allRefunds.length}`);
    return allRefunds;
} catch (error) {
    console.warn('⚠️ Refunds query failed, using empty array:', error);
    return [];
}
};
@'

$newFunction = '@
  // Helper function to fetch all refunds using ExactDateService
  const fetchAllRefunds = async () => {
    try {
      // Use ExactDateService to get all refunds (wide date range)
      const allRefunds = await ExactDateService.getPatientRefunds('2000-01-01', '2100-12-31');
      console.log(`📊 Total refunds fetched via API: ${allRefunds.length}`);
      return allRefunds;
    } catch (error) {
      console.warn('⚠️ Refunds query failed, using empty array:', error);
      return [];
    }
  };
@'

# Normalize line endings
$content = $content -replace "`r`n", "`n"
$oldFunction = $oldFunction -replace "`r`n", "`n"

if ($content.Contains($oldFunction)) {
    $content = $content.Replace($oldFunction, $newFunction)
    Write-Host "Replaced fetchAllRefunds"
} else {
    Write-Host "fetchAllRefunds function not found exactly. Checking content..."
    # Debug: print first few chars of oldFunction and content to see mismatch
    # Write-Host "Old Start: " $oldFunction.Substring(0, 50)
}

$content | Set-Content $file -NoNewline
Write-Host "File updated"
