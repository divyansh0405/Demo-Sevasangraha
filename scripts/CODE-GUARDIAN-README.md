# 🛡️ Code Guardian - Pre-Deployment Validation System

Code Guardian is a comprehensive code quality, security, and type safety validation system that ensures your code meets the highest standards before deployment.

## Overview

Code Guardian performs multi-dimensional validation including:
- ✅ TypeScript type checking
- ✅ ESLint code quality analysis
- ✅ Security vulnerability scanning
- ✅ Hardcoded secrets detection
- ✅ Dangerous function usage detection
- ✅ Console statement detection
- ✅ TODO/FIXME comment tracking
- ✅ Test suite execution
- ✅ Dependency security audit

## Installation

### 1. Agent Installation (Already Done)
The Code Guardian agent is already installed at:
- `.claude/agents/code-guardian.md` - Agent definition
- `.claude/commands/guardian.md` - Slash command

### 2. Git Hook Installation (Optional)
To automatically run Code Guardian before every git push:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/install-git-hooks.ps1
```

This creates a pre-push hook that validates your code before pushing to remote.

## Usage

### Method 1: Using Claude Code Slash Command (Recommended)
The easiest way to invoke Code Guardian through Claude:

```
/guardian
```

This will launch the Code Guardian agent which performs comprehensive validation.

### Method 2: Using the Task Tool
In Claude Code, you can invoke the agent directly:

```
Use the code-guardian agent to validate the codebase
```

Claude will automatically invoke the Code Guardian agent for comprehensive validation.

### Method 3: Manual Script Execution
Run the validation script directly:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/code-guardian.ps1
```

### Method 4: Automatic Git Hook
If you installed the git hook, Code Guardian runs automatically before every `git push`:

```bash
git push origin main
# Code Guardian will run automatically and block push if validation fails
```

To bypass the hook (not recommended):
```bash
git push --no-verify
```

## What Gets Validated

### 1. TypeScript Type Safety
- Runs `npm run build:typecheck` or `tsc --noEmit`
- Ensures zero TypeScript compilation errors
- Validates type definitions and imports

### 2. Code Quality (ESLint)
- Runs `npm run lint`
- Checks code style and best practices
- Identifies potential bugs and anti-patterns

### 3. Security Scanning
Scans for:
- Hardcoded passwords, API keys, secrets, tokens
- Dangerous functions: `eval()`, `innerHTML`, `dangerouslySetInnerHTML`
- Exposed credentials in source code
- Common security vulnerabilities

### 4. Production Code Quality
- Detects `console.log`, `console.debug`, etc. statements
- Identifies `debugger` statements
- Finds TODO, FIXME, HACK, XXX comments

### 5. Test Suite
- Runs `npm test` if test script exists
- Verifies all tests pass
- Reports test coverage

### 6. Dependency Security
- Runs `npm audit`
- Identifies vulnerabilities in dependencies
- Reports critical and high-severity issues

## Exit Codes

- **Exit 0**: ✅ Validation passed (may have warnings)
- **Exit 1**: ❌ Validation failed (critical errors found)

## When to Use Code Guardian

### Automatic Usage (via git hook):
- Before every `git push` to remote

### Manual/Claude Usage:
- ✅ Before starting development server (`npm run dev`)
- ✅ Before building for production (`npm run build`)
- ✅ Before creating pull requests
- ✅ After implementing new features
- ✅ After making significant code changes
- ✅ Before deployments
- ✅ During code reviews

## Configuration

### Customizing Validation
Edit `scripts/code-guardian.ps1` to:
- Add custom validation checks
- Modify security patterns
- Adjust severity thresholds
- Add project-specific rules

### Customizing Agent Behavior
Edit `.claude/agents/code-guardian.md` to:
- Change agent description
- Modify validation workflow
- Update security checks
- Adjust reporting format

## Integration with Development Workflow

### Before Running Dev Server
```
User: "Can you run npm run dev?"
Claude: "I'll use the code-guardian agent first to validate the codebase before starting the development server."
```

### Before Git Push
```
User: "I'm ready to push my changes"
Claude: "Before we proceed with the git push, let me invoke the code-guardian agent to perform a comprehensive validation."
```

### After Implementing Features
```
User: "I've finished implementing the authentication module"
Claude: "Great work! Let me run the code-guardian agent to validate your implementation for security vulnerabilities, type safety, and code quality."
```

## Validation Report Format

Code Guardian provides detailed reports with:
- **Executive Summary**: Pass/fail status
- **Categorized Issues**: Critical errors, warnings, informational
- **File Locations**: Exact file paths and line numbers
- **Remediation Steps**: Specific fixes for each issue
- **Priority Ranking**: Issues sorted by severity

## Example Output

```
🛡️  CODE GUARDIAN - Pre-Deployment Validation
================================================

[TypeScript Type Checking]
----------------------------------------
✅ TypeScript compilation successful - No type errors found

[ESLint Code Quality Check]
----------------------------------------
✅ ESLint validation passed - No linting errors

[Security Scan - Hardcoded Secrets]
----------------------------------------
✅ No hardcoded secrets detected

[Security Scan - Dangerous Functions]
----------------------------------------
⚠️  Potentially dangerous function found: src/utils/parser.ts:45

[Production Code Quality - Console Statements]
----------------------------------------
⚠️  Found 3 console statement(s) in production code

================================================
🛡️  CODE GUARDIAN SUMMARY
================================================

Critical Errors: 0
Warnings: 2

⚠️  VALIDATION PASSED WITH WARNINGS - Review recommended before deployment
```

## Troubleshooting

### "build:typecheck script not found"
Add to `package.json`:
```json
"scripts": {
  "build:typecheck": "tsc --noEmit"
}
```

### "lint script not found"
Add to `package.json`:
```json
"scripts": {
  "lint": "eslint . --ext .ts,.tsx,.js,.jsx"
}
```

### PowerShell Execution Policy Error
Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Best Practices

1. **Run Before Every Commit**: Use the git hook to ensure validation
2. **Fix Critical Errors First**: Don't bypass validation for critical errors
3. **Address Warnings**: Review and address warnings when possible
4. **Keep Dependencies Updated**: Regularly run `npm audit fix`
5. **Remove Console Statements**: Use proper logging in production
6. **Document TODOs**: Link TODO comments to issue tracking

## Support

For issues or questions:
- Check the validation output for specific errors
- Review the script at `scripts/code-guardian.ps1`
- Consult the agent definition at `.claude/agents/code-guardian.md`

---

**Your code guardian is now active and protecting your deployments!** 🛡️
