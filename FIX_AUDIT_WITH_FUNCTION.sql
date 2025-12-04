-- =============================================================================
-- ALTERNATIVE FIX: Use Database Function to Bypass RLS
-- =============================================================================
-- This creates a database function that bypasses RLS using SECURITY DEFINER
-- This is a more robust solution that always works
-- =============================================================================

-- 1. Create or replace the audit log function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_audit_log(
    p_user_id UUID,
    p_user_email TEXT,
    p_user_role TEXT,
    p_user_name TEXT,
    p_action_type TEXT,
    p_table_name TEXT,
    p_record_id UUID,
    p_section_name TEXT,
    p_field_changes JSONB,
    p_old_values JSONB,
    p_new_values JSONB,
    p_description TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to bypass RLS
AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    -- Insert audit log (this bypasses RLS because of SECURITY DEFINER)
    INSERT INTO audit_logs (
        user_id,
        user_email,
        user_role,
        user_name,
        action_type,
        table_name,
        record_id,
        section_name,
        field_changes,
        old_values,
        new_values,
        description,
        ip_address,
        user_agent,
        hospital_id,
        created_at
    ) VALUES (
        p_user_id,
        p_user_email,
        p_user_role,
        p_user_name,
        p_action_type,
        p_table_name,
        p_record_id,
        p_section_name,
        p_field_changes,
        p_old_values,
        p_new_values,
        p_description,
        p_ip_address,
        p_user_agent,
        p_hospital_id,
        NOW()
    ) RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION create_audit_log TO anon;

-- 3. Verify function was created
SELECT
    proname as function_name,
    prosecdef as is_security_definer,
    proargtypes as argument_types
FROM pg_proc
WHERE proname = 'create_audit_log';

-- =============================================================================
-- TEST THE FUNCTION
-- =============================================================================

-- Test 1: Call the function directly
SELECT create_audit_log(
    NULL,                           -- user_id (can be NULL)
    'test@function.com',           -- user_email
    'frontdesk',                   -- user_role
    'Function Test User',          -- user_name
    'UPDATE',                      -- action_type
    'patients',                    -- table_name
    gen_random_uuid(),             -- record_id
    'Patient List',                -- section_name
    '{"phone": {"old": "123", "new": "456"}}'::jsonb,  -- field_changes
    '{"phone": "123"}'::jsonb,     -- old_values
    '{"phone": "456"}'::jsonb,     -- new_values
    'Test from database function', -- description
    '127.0.0.1',                   -- ip_address
    'Test Browser',                -- user_agent
    '550e8400-e29b-41d4-a716-446655440000'::uuid  -- hospital_id
) as created_audit_id;

-- Test 2: Verify the audit log was created
SELECT
    id,
    user_email,
    user_role,
    action_type,
    section_name,
    description,
    field_changes,
    created_at
FROM audit_logs
WHERE user_email = 'test@function.com'
ORDER BY created_at DESC
LIMIT 1;

-- Clean up test data
DELETE FROM audit_logs WHERE user_email = 'test@function.com';

-- =============================================================================
-- DONE!
-- =============================================================================
-- Now you can call this function from your app and it will bypass RLS
-- =============================================================================
