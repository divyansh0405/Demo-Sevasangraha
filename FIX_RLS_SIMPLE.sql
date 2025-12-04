-- =============================================================================
-- SIMPLE RLS FIX - COMPLETELY DISABLE RLS FOR INSERTS
-- =============================================================================
-- This is the simplest possible fix - allows ALL inserts
-- =============================================================================

-- 1. Drop ALL existing policies
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Audit logs are immutable" ON audit_logs;
DROP POLICY IF EXISTS "Audit logs cannot be deleted" ON audit_logs;

-- 2. Keep RLS enabled but create permissive policy
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create the SIMPLEST possible INSERT policy (allows ALL inserts)
CREATE POLICY "Allow all inserts"
    ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- 4. Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
    ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'admin')
        )
    );

-- 5. No updates allowed
CREATE POLICY "No updates"
    ON audit_logs
    FOR UPDATE
    USING (false);

-- 6. No deletes allowed
CREATE POLICY "No deletes"
    ON audit_logs
    FOR DELETE
    USING (false);

-- 7. Verify policies
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'audit_logs'
ORDER BY cmd;

-- 8. Test direct insert (should work now)
INSERT INTO audit_logs (
    user_email,
    user_role,
    action_type,
    table_name,
    record_id,
    section_name,
    description
) VALUES (
    'test@simple-rls.com',
    'frontdesk',
    'UPDATE',
    'patients',
    gen_random_uuid(),
    'Patient List',
    'Test with simplest RLS policy'
) RETURNING id, user_email, created_at;

-- 9. Verify insert worked
SELECT COUNT(*) as test_count FROM audit_logs WHERE user_email = 'test@simple-rls.com';

-- 10. Clean up
DELETE FROM audit_logs WHERE user_email = 'test@simple-rls.com';
