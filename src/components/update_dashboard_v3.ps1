$file = "C:\Users\DELL\hospital-crm-pro-new\src\components\EnhancedDashboard.tsx"
$content = Get-Content $file

# New function content
$newFunction = @(
    "  // Helper function to fetch all refunds using ExactDateService",
    "  const fetchAllRefunds = async () => {",
    "    try {",
    "      // Use ExactDateService to get all refunds (wide date range)",
    "      const allRefunds = await ExactDateService.getPatientRefunds('2000-01-01', '2100-12-31');",
    "      console.log(``📊 Total refunds fetched via API: ${allRefunds.length}``);",
    "      return allRefunds;",
    "    } catch (error) {",
    "      console.warn('⚠️ Refunds query failed, using empty array:', error);",
    "      return [];",
    "    }",
    "  };"
)

# Replace lines 178-222 (0-indexed: 177-221)
# Note: PowerShell array slicing is inclusive.
# We want to keep 0..176, insert new function, keep 222..end
$newContent = $content[0..176] + $newFunction + $content[222..($content.Length - 1)]

$newContent | Set-Content $file
Write-Host "File updated by line numbers"
