-- =====================================================
-- PHASE 1: ATTENDANCE & LEAVE MANAGEMENT SCHEMA
-- =====================================================

-- 1. SHIFT MANAGEMENT
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    shift_name VARCHAR(50) NOT NULL, -- e.g., 'Morning', 'Evening', 'Night'
    shift_code VARCHAR(20) NOT NULL, -- e.g., 'S1', 'S2', 'S3'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INT DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    shift_id UUID NOT NULL REFERENCES shift_master(id),
    schedule_date DATE NOT NULL,
    is_off_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    UNIQUE(employee_id, schedule_date)
);

-- 2. ATTENDANCE TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    date DATE NOT NULL,
    
    -- Timings
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    break_start_time TIMESTAMP WITH TIME ZONE,
    break_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Half Day', 'Late', 'On Leave')),
    is_late_entry BOOLEAN DEFAULT FALSE,
    is_early_exit BOOLEAN DEFAULT FALSE,
    
    -- Calculation
    total_work_hours DECIMAL(5, 2) DEFAULT 0,
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    
    -- Meta
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- 3. LEAVE MANAGEMENT
-- =====================================================
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    leave_name VARCHAR(50) NOT NULL, -- e.g., 'Casual Leave', 'Sick Leave'
    leave_code VARCHAR(20) NOT NULL, -- e.g., 'CL', 'SL'
    description TEXT,
    max_days_per_year INT NOT NULL DEFAULT 12,
    carry_forward_allowed BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    leave_type_id UUID NOT NULL REFERENCES leave_types(id),
    year INT NOT NULL,
    
    total_allocated DECIMAL(5, 1) NOT NULL,
    used DECIMAL(5, 1) DEFAULT 0,
    pending DECIMAL(5, 1) DEFAULT 0,
    remaining DECIMAL(5, 1) GENERATED ALWAYS AS (total_allocated - used - pending) STORED,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    leave_type_id UUID NOT NULL REFERENCES leave_types(id),
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(5, 1) NOT NULL,
    reason TEXT NOT NULL,
    
    -- Approval Workflow
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    approved_by UUID REFERENCES employee_master(id),
    rejection_reason TEXT,
    approval_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS POLICIES (Placeholder - User needs to run these)
-- =====================================================
ALTER TABLE shift_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;

-- Basic Read Policies (Open for now, refine later)
CREATE POLICY "Enable read access for all users" ON shift_master FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON leave_types FOR SELECT USING (true);

-- Employee Specific Policies
CREATE POLICY "View own schedule" ON employee_schedule FOR SELECT USING (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager', 'team_lead'));
CREATE POLICY "View own attendance" ON attendance_logs FOR SELECT USING (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager', 'team_lead'));
CREATE POLICY "View own leaves" ON leave_applications FOR SELECT USING (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager', 'team_lead'));
