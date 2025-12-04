# Code Guardian - Pre-Deployment Validation Script
# Comprehensive code quality, security, and type safety validation

Write-Host "CODE GUARDIAN - Pre-Deployment Validation" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$script:errors = 0
$script:warnings = 0
$script:criticalIssues = @()
$script:warningIssues = @()

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "[$Title]" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    $script:errors++
    $script:criticalIssues += $Message
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
    $script:warnings++
    $script:warningIssues += $Message
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

# 1. TypeScript Type Checking
Write-Section "TypeScript Type Checking"
try {
    $tscOutput = npm run build:typecheck 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "TypeScript compilation successful - No type errors found"
    } else {
        Write-Error "TypeScript compilation failed with errors"
        Write-Host $tscOutput -ForegroundColor Red
    }
} catch {
    Write-Warning "TypeScript check skipped - build:typecheck script not found"
}

# 2. ESLint Code Quality
Write-Section "ESLint Code Quality Check"
try {
    $lintOutput = npm run lint 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "ESLint validation passed - No linting errors"
    } else {
        Write-Error "ESLint found code quality issues"
        Write-Host $lintOutput -ForegroundColor Red
    }
} catch {
    Write-Warning "ESLint check skipped - lint script not found"
}

# 3. Security Scan - Hardcoded Secrets
Write-Section "Security Scan - Hardcoded Secrets"
$secretPatterns = @(
    'password\s*=\s*[' + "'" + '"]',
    'api[_-]?key\s*=\s*[' + "'" + '"]',
    'secret\s*=\s*[' + "'" + '"]',
    'token\s*=\s*[' + "'" + '"]',
    'private[_-]?key\s*=\s*[' + "'" + '"]'
)

$foundSecrets = $false
foreach ($pattern in $secretPatterns) {
    $matches = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue |
                Select-String -Pattern $pattern -CaseSensitive:$false

    if ($matches) {
        $foundSecrets = $true
        foreach ($match in $matches) {
            Write-Error "Potential hardcoded secret found: $($match.Path):$($match.LineNumber)"
        }
    }
}

if (-not $foundSecrets) {
    Write-Success "No hardcoded secrets detected"
}

# 4. Security Scan - Dangerous Functions
Write-Section "Security Scan - Dangerous Functions"
$dangerousPatterns = @(
    "eval\(",
    "innerHTML\s*=",
    "dangerouslySetInnerHTML",
    "document\.write\("
)

$foundDangerous = $false
foreach ($pattern in $dangerousPatterns) {
    $matches = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue |
                Select-String -Pattern $pattern -CaseSensitive:$false

    if ($matches) {
        $foundDangerous = $true
        foreach ($match in $matches) {
            Write-Warning "Potentially dangerous function found: $($match.Path):$($match.LineNumber) - $($match.Line.Trim())"
        }
    }
}

if (-not $foundDangerous) {
    Write-Success "No dangerous function usage detected"
}

# 5. Console Statements Check
Write-Section "Production Code Quality - Console Statements"
$consoleMatches = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue |
                  Select-String -Pattern "console\.(log|debug|warn|error|info)" -CaseSensitive:$false

if ($consoleMatches) {
    $count = ($consoleMatches | Measure-Object).Count
    Write-Warning "Found $count console statement(s) in production code"
    Write-Info "Consider using a proper logging service for production"

    # Show first 5 matches
    $consoleMatches | Select-Object -First 5 | ForEach-Object {
        Write-Host "  Location: $($_.Path):$($_.LineNumber)" -ForegroundColor Gray
    }
} else {
    Write-Success "No console statements found in production code"
}

# 6. TODO/FIXME Comments
Write-Section "Code Maintenance - TODO/FIXME Comments"
$todoMatches = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue |
               Select-String -Pattern "TODO|FIXME|HACK|XXX" -CaseSensitive:$false

if ($todoMatches) {
    $count = ($todoMatches | Measure-Object).Count
    Write-Info "Found $count TODO/FIXME comment(s)"

    # Show first 5 matches
    $todoMatches | Select-Object -First 5 | ForEach-Object {
        Write-Host "  Note: $($_.Path):$($_.LineNumber) - $($_.Line.Trim())" -ForegroundColor Gray
    }
} else {
    Write-Success "No TODO/FIXME comments found"
}

# 7. Test Suite Execution (if exists)
Write-Section "Test Suite Execution"
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.scripts.test) {
    Write-Info "Running test suite..."
    try {
        $testOutput = npm test -- --passWithNoTests 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "All tests passed"
        } else {
            Write-Error "Some tests failed"
            Write-Host $testOutput -ForegroundColor Red
        }
    } catch {
        Write-Warning "Test execution encountered an error"
    }
} else {
    Write-Info "No test script found in package.json - skipping test execution"
}

# 8. Dependency Audit
Write-Section "Dependency Security Audit"
try {
    Write-Info "Running npm audit..."
    $auditOutput = npm audit --json 2>&1 | ConvertFrom-Json

    if ($auditOutput.metadata.vulnerabilities.critical -gt 0) {
        Write-Error "Found $($auditOutput.metadata.vulnerabilities.critical) critical vulnerabilities"
    } elseif ($auditOutput.metadata.vulnerabilities.high -gt 0) {
        Write-Warning "Found $($auditOutput.metadata.vulnerabilities.high) high vulnerabilities"
    } else {
        Write-Success "No critical or high vulnerabilities found"
    }
} catch {
    Write-Info "Dependency audit completed (run npm audit for details)"
}

# Final Summary
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "CODE GUARDIAN SUMMARY" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Critical Errors: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host "Warnings: $warnings" -ForegroundColor $(if ($warnings -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

if ($errors -gt 0) {
    Write-Host "[FAILED] VALIDATION FAILED - Critical issues must be resolved before deployment" -ForegroundColor Red
    Write-Host ""
    Write-Host "Critical Issues:" -ForegroundColor Red
    foreach ($issue in $script:criticalIssues) {
        Write-Host "  - $issue" -ForegroundColor Red
    }
    exit 1
} elseif ($warnings -gt 0) {
    Write-Host "[PASS] VALIDATION PASSED WITH WARNINGS - Review recommended before deployment" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Warnings:" -ForegroundColor Yellow
    foreach ($warning in $script:warningIssues) {
        Write-Host "  - $warning" -ForegroundColor Yellow
    }
    exit 0
} else {
    Write-Host "[PASS] VALIDATION PASSED - Code is ready for deployment!" -ForegroundColor Green
    exit 0
}
