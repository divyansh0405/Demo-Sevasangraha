# Audit Log Debugging Guide

## Step 1: Check Console Logs

After editing a patient, you should see these logs in the browser console:

### Expected Logs:
```
📋 Starting audit log creation...
📋 User object: { ... }
📋 Patient ID: ...
📋 Old patient data: { ... }
📋 New patient data: { ... }
📋 Audit context: { ... }
🔍 logPatientEdit called with: ...
📊 Audit log - Field changes calculated: { ... }
📊 Audit log - Params: { ... }
✅ Audit log created successfully with ID: ...
```

### If You See Errors:
- ❌ Audit log creation failed: [error]
- ❌ Supabase error details: [details]

## Step 2: Check Database Directly

Run these queries in Supabase SQL Editor:

### Query 1: Check if table exists
```sql
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
) AS table_exists;
```

### Query 2: Count audit logs
```sql
SELECT COUNT(*) as total_audit_logs FROM audit_logs;
```

### Query 3: View recent audit logs
```sql
SELECT
    id,
    user_email,
    user_role,
    action_type,
    section_name,
    table_name,
    description,
    created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Query 4: Check RLS policies
```sql
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'audit_logs';
```

### Query 5: Test manual insert
```sql
INSERT INTO audit_logs (
    user_email,
    user_role,
    user_name,
    action_type,
    table_name,
    record_id,
    section_name,
    description
) VALUES (
    'test@hospital.com',
    'frontdesk',
    'Test User',
    'UPDATE',
    'patients',
    gen_random_uuid(),
    'Patient List',
    'Test audit log entry'
) RETURNING id, user_email, created_at;
```

### Query 6: Check user roles
```sql
SELECT id, email, role FROM users WHERE email IN ('frontdesk@indic.com', 'admin@indic.com', 'meenal@indic.com');
```

## Step 3: Common Issues

### Issue 1: Table doesn't exist
**Solution**: Run `CREATE_AUDIT_LOGS_TABLE.sql` in Supabase SQL Editor

### Issue 2: RLS blocking inserts
**Check**: The policy "System can insert audit logs" should exist with `FOR INSERT` and `WITH CHECK (true)`

### Issue 3: User not authenticated
**Check**: Make sure you're logged in and the user object is not null

### Issue 4: Supabase connection error
**Check**: Verify `.env` file has correct Supabase credentials

## Step 4: Emergency Manual Test

If nothing works, try this manual test in browser console:

```javascript
// Test 1: Check Supabase connection
const { data: testData, error: testError } = await supabase.from('audit_logs').select('count');
console.log('Supabase connection test:', { testData, testError });

// Test 2: Try manual insert
const { data: insertData, error: insertError } = await supabase
  .from('audit_logs')
  .insert({
    user_email: 'test@test.com',
    user_role: 'test',
    action_type: 'UPDATE',
    table_name: 'patients',
    record_id: '00000000-0000-0000-0000-000000000000',
    section_name: 'Test',
    description: 'Manual test'
  })
  .select();
console.log('Manual insert test:', { insertData, insertError });
```

## What to Report

Please provide:
1. ✅ Console logs when editing a patient
2. ✅ Results from Query 1-6 above
3. ✅ Any error messages
4. ✅ Your current user email (frontdesk@indic.com?)
