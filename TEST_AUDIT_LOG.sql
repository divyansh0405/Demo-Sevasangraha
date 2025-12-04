-- =============================================================================
-- TEST AUDIT LOG SYSTEM
-- =============================================================================
-- Run these queries in your Supabase SQL Editor to diagnose audit log issues
-- =============================================================================

-- 1. Check if audit_logs table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
) AS table_exists;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;

-- 3. Check if there are any audit logs
SELECT COUNT(*) as total_audit_logs FROM audit_logs;

-- 4. View all audit logs (if any exist)
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

-- 5. Check RLS policies on audit_logs
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'audit_logs';

-- 6. Check if RLS is enabled
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'audit_logs';

-- 7. Test INSERT permission (this should work for authenticated users)
-- Try to insert a test audit log
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

-- 8. Check if the test insert worked
SELECT * FROM audit_logs WHERE user_email = 'test@hospital.com';

-- 9. Clean up test data
DELETE FROM audit_logs WHERE user_email = 'test@hospital.com';

-- =============================================================================
-- TROUBLESHOOTING STEPS
-- =============================================================================

-- If table doesn't exist:
-- - Run CREATE_AUDIT_LOGS_TABLE.sql first

-- If RLS is blocking inserts:
-- - Check that "System can insert audit logs" policy exists
-- - Verify you're authenticated in Supabase

-- If SELECT returns no data for admin:
-- - Check that "Admins can view all audit logs" policy exists
-- - Verify your user has role = 'ADMIN' or 'admin'

-- Check your user's role:
SELECT id, email, role FROM users WHERE email = 'admin@valant.com';
SELECT id, email, role FROM users WHERE email = 'meenal@valant.com';

-- =============================================================================
