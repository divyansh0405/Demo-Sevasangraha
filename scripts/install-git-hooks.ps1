# Install Git Hooks for Code Guardian
# This script installs the pre-push hook that runs code-guardian validation

Write-Host "🔧 Installing Code Guardian Git Hooks..." -ForegroundColor Cyan
Write-Host ""

# Check if .git directory exists
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: .git directory not found. Are you in a git repository?" -ForegroundColor Red
    exit 1
}

# Create hooks directory if it doesn't exist
$hooksDir = ".git\hooks"
if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
}

# Create pre-push hook
$prePushHook = @"
#!/bin/sh
# Code Guardian Pre-Push Hook
# Runs comprehensive validation before pushing to remote

echo "🛡️  Running Code Guardian validation before push..."
echo ""

# Run the code-guardian PowerShell script
powershell.exe -ExecutionPolicy Bypass -File "./scripts/code-guardian.ps1"

# Capture exit code
RESULT=`$?

if [ `$RESULT -ne 0 ]; then
    echo ""
    echo "❌ Code Guardian validation failed!"
    echo "Please fix the issues above before pushing."
    echo ""
    echo "To bypass this hook (not recommended), use: git push --no-verify"
    exit 1
fi

echo ""
echo "✅ Code Guardian validation passed! Proceeding with push..."
exit 0
"@

$prePushPath = Join-Path $hooksDir "pre-push"

# Write the hook file
Set-Content -Path $prePushPath -Value $prePushHook -Encoding UTF8

# Make it executable (on Windows, this is not strictly necessary but good practice)
Write-Host "✅ Pre-push hook installed at: $prePushPath" -ForegroundColor Green
Write-Host ""
Write-Host "The Code Guardian will now run automatically before every git push." -ForegroundColor Cyan
Write-Host ""
Write-Host "To bypass the hook (not recommended), use:" -ForegroundColor Yellow
Write-Host "  git push --no-verify" -ForegroundColor Gray
Write-Host ""
Write-Host "To manually run validation, use:" -ForegroundColor Yellow
Write-Host "  powershell -File ./scripts/code-guardian.ps1" -ForegroundColor Gray
Write-Host "  or use the slash command: /guardian" -ForegroundColor Gray
Write-Host ""
