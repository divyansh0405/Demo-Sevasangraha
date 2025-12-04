-- =============================================================================
-- DISABLE RLS COMPLETELY FOR AUDIT_LOGS TABLE
-- =============================================================================
-- This is the nuclear option - completely turns off RLS
-- Use this if the policies are still causing issues
-- =============================================================================

-- 1. Drop ALL existing policies
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow all inserts" ON audit_logs;
DROP POLICY IF EXISTS "Audit logs are immutable" ON audit_logs;
DROP POLICY IF EXISTS "Audit logs cannot be deleted" ON audit_logs;
DROP POLICY IF EXISTS "No updates" ON audit_logs;
DROP POLICY IF EXISTS "No deletes" ON audit_logs;

-- 2. DISABLE RLS completely
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- 3. Grant permissions
GRANT ALL ON audit_logs TO authenticated;
GRANT ALL ON audit_logs TO anon;

-- 4. Verify RLS is disabled
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'audit_logs';

-- Expected result: rls_enabled = false

-- 5. Test insert (should definitely work now)
INSERT INTO audit_logs (
    user_email,
    user_role,
    action_type,
    table_name,
    record_id,
    section_name,
    description
) VALUES (
    'test@no-rls.com',
    'frontdesk',
    'UPDATE',
    'patients',
    gen_random_uuid(),
    'Patient List',
    'Test with RLS completely disabled'
) RETURNING id, user_email, created_at;

-- 6. Verify
SELECT COUNT(*) FROM audit_logs WHERE user_email = 'test@no-rls.com';

-- 7. Clean up
DELETE FROM audit_logs WHERE user_email = 'test@no-rls.com';

-- =============================================================================
-- DONE - RLS is now completely disabled for audit_logs
-- =============================================================================
