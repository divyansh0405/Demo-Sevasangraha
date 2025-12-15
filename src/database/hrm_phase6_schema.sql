-- =====================================================
-- PHASE 6: EXITS & REPORTS SCHEMA
-- =====================================================

-- 1. EXIT MANAGEMENT
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_exits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    
    type VARCHAR(50) NOT NULL, -- Resignation, Termination, Retirement, Death
    reason TEXT,
    resignation_date DATE NOT NULL,
    last_working_day DATE,
    
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected, Completed
    
    exit_interview_notes TEXT,
    feedback_rating INT,
    
    approved_by UUID REFERENCES employee_master(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exit_checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    exit_id UUID NOT NULL REFERENCES employee_exits(id),
    
    department VARCHAR(50) NOT NULL, -- IT, Finance, Admin, HR
    task_name VARCHAR(200) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Cleared, Not Applicable
    
    cleared_by UUID REFERENCES employee_master(id),
    cleared_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS POLICIES
-- =====================================================
ALTER TABLE employee_exits ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_checklist ENABLE ROW LEVEL SECURITY;

-- Exit Policies
-- Employees can view their own exit requests
CREATE POLICY "View own exit" ON employee_exits FOR SELECT USING (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));
-- Employees can create their own resignation
CREATE POLICY "Create own resignation" ON employee_exits FOR INSERT WITH CHECK (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));
-- Only Admin/HR can update status
CREATE POLICY "Manage exits" ON employee_exits FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));

-- Checklist Policies
-- Viewable by Admin/HR and the employee
CREATE POLICY "View checklist" ON exit_checklist FOR SELECT USING (
    EXISTS (SELECT 1 FROM employee_exits WHERE id = exit_checklist.exit_id AND employee_id::text = auth.uid()::text)
    OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager')
);
-- Manageable by Admin/HR
CREATE POLICY "Manage checklist" ON exit_checklist FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));
