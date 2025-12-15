-- =====================================================
-- ROLE MANAGEMENT SEED SCRIPT
-- =====================================================

-- 1. Create Employee Roles Table
CREATE TABLE IF NOT EXISTS employee_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    role_code VARCHAR(50) NOT NULL, -- This should match authService roles (e.g., 'hr_manager')
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Seed Standard Roles
-- Note: Replace 'YOUR_HOSPITAL_ID' with the actual UUID if known, or handle dynamically.
-- For this script, we will assume the user will run this in Supabase SQL Editor where they can set the variable or just insert.

-- HR Manager
INSERT INTO employee_roles (hospital_id, role_name, role_code, description, permissions)
SELECT 
    '00000000-0000-0000-0000-000000000000', -- Placeholder Hospital ID
    'HR Manager', 
    'hr_manager', 
    'Full access to HR module', 
    '["hrm.employee.view_all", "hrm.employee.create", "hrm.employee.edit", "hrm.employee.delete", "hrm.payroll.manage", "hrm.attendance.approve", "hrm.leave.approve"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM employee_roles WHERE role_code = 'hr_manager');

-- Team Lead
INSERT INTO employee_roles (hospital_id, role_name, role_code, description, permissions)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    'Team Lead', 
    'team_lead', 
    'Access to own team management', 
    '["hrm.team.view", "hrm.leave.approve_team", "hrm.attendance.view_team"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM employee_roles WHERE role_code = 'team_lead');

-- Employee
INSERT INTO employee_roles (hospital_id, role_name, role_code, description, permissions)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    'Employee', 
    'employee', 
    'Standard employee access', 
    '["hrm.self.view_profile", "hrm.self.view_payslip", "hrm.leave.request"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM employee_roles WHERE role_code = 'employee');

-- Guest
INSERT INTO employee_roles (hospital_id, role_name, role_code, description, permissions)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    'Guest', 
    'guest', 
    'Read-only or limited access', 
    '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM employee_roles WHERE role_code = 'guest');

-- Admin (System Role)
INSERT INTO employee_roles (hospital_id, role_name, role_code, description, permissions)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    'Admin', 
    'admin', 
    'System Administrator', 
    '["full_access"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM employee_roles WHERE role_code = 'admin');
