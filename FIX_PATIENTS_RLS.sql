-- =============================================================================
-- FIX PATIENTS TABLE RLS FOR ALL HOSPITALS
-- =============================================================================
-- Run this SQL in EACH hospital's Supabase database:
-- 1. Bhilwara database
-- 2. Madhuban database
-- 3. Valant Shobhagpura database (for consistency)
-- =============================================================================

-- 1. Drop ALL existing RLS policies on patients table
DROP POLICY IF EXISTS "Users can view patients" ON patients;
DROP POLICY IF EXISTS "Users can insert patients" ON patients;
DROP POLICY IF EXISTS "Users can update patients" ON patients;
DROP POLICY IF EXISTS "Users can delete patients" ON patients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON patients;
DROP POLICY IF EXISTS "Authenticated users can view patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON patients;
DROP POLICY IF EXISTS "Service role can do anything" ON patients;

-- 2. DISABLE RLS completely on patients table
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- 3. Grant full permissions to authenticated and anon roles
GRANT ALL ON patients TO authenticated;
GRANT ALL ON patients TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. Verify RLS is disabled
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'patients';

-- Expected result: rls_enabled = false

-- 5. Test query (should work now)
SELECT COUNT(*) FROM patients;

-- 6. Check if patients table exists and has correct structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'patients'
ORDER BY ordinal_position;

-- =============================================================================
-- DONE - RLS is now completely disabled for patients table
-- =============================================================================

-- INSTRUCTIONS:
-- 1. Open Supabase SQL Editor for Bhilwara hospital
-- 2. Copy and paste this entire script
-- 3. Run it
-- 4. Repeat for Madhuban hospital
-- 5. (Optional) Repeat for Valant Shobhagpura for consistency
-- =============================================================================
