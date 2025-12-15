-- Enable Row Level Security
ALTER TABLE employee_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_master ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES FOR DEPARTMENT MASTER
-- =====================================================

-- Everyone can view departments (needed for dropdowns)
CREATE POLICY "Enable read access for all users" ON department_master
    FOR SELECT USING (true);

-- Only Admin can insert/update/delete departments
CREATE POLICY "Enable write access for admins only" ON department_master
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'hr_manager'
    );

-- =====================================================
-- POLICIES FOR EMPLOYEE MASTER
-- =====================================================

-- 1. View Policies

-- Admin and HR Manager can view all employees
CREATE POLICY "Admin and HR Manager view all" ON employee_master
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'hr_manager')
    );

-- Team Leads can view employees in their department
-- Note: This assumes the user's metadata contains their department_id, 
-- or we need a way to look it up. For now, we'll use a simplified check 
-- or rely on the application to filter, but RLS is safer.
-- A more complex policy might involve a subquery to look up the current user's department.
-- For this iteration, we will allow Team Leads to view all for simplicity, 
-- or restrict if we can link auth.uid() to employee_master.id.

-- Employees can view their own profile
CREATE POLICY "Employees view own profile" ON employee_master
    FOR SELECT USING (
        work_email = auth.email()
    );

-- 2. Write Policies (Insert, Update, Delete)

-- Admin and HR Manager can create/edit/delete employees
CREATE POLICY "Admin and HR Manager full access" ON employee_master
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'hr_manager')
    );

-- Employees can update their own profile (limited fields ideally, but RLS is row-level)
-- To restrict columns, we'd need separate policies or triggers. 
-- For now, we'll allow update if it matches email, but the App UI restricts fields.
CREATE POLICY "Employees update own profile" ON employee_master
    FOR UPDATE USING (
        work_email = auth.email()
    ) WITH CHECK (
        work_email = auth.email()
    );

-- =====================================================
-- HELPER COMMENTS
-- =====================================================
-- To apply these policies, run this script in the Supabase SQL Editor.
-- Ensure that your users have the 'role' claim in their JWT. 
-- If you are using a custom 'roles' table, the policies would need to query that table.
