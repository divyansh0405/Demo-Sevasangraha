-- =====================================================
-- PHASE 2: PAYROLL ENGINE SCHEMA
-- =====================================================

-- 1. SALARY STRUCTURE
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_salary_structure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    
    -- Earnings (Monthly)
    basic_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
    hra DECIMAL(12, 2) DEFAULT 0, -- House Rent Allowance
    da DECIMAL(12, 2) DEFAULT 0, -- Dearness Allowance
    medical_allowance DECIMAL(12, 2) DEFAULT 0,
    travel_allowance DECIMAL(12, 2) DEFAULT 0,
    special_allowance DECIMAL(12, 2) DEFAULT 0,
    
    -- Deductions (Config)
    pf_enabled BOOLEAN DEFAULT TRUE, -- Provident Fund
    esi_enabled BOOLEAN DEFAULT TRUE, -- Employee State Insurance
    pt_enabled BOOLEAN DEFAULT TRUE, -- Professional Tax
    tds_enabled BOOLEAN DEFAULT FALSE, -- Tax Deducted at Source
    
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    UNIQUE(employee_id, is_active) -- Only one active structure per employee
);

-- 2. PAYROLL PROCESSING
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    working_days INT NOT NULL,
    
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Processing', 'Approved', 'Locked')),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hospital_id, month, year)
);

CREATE TABLE IF NOT EXISTS employee_payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    payroll_cycle_id UUID NOT NULL REFERENCES payroll_cycles(id),
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    
    -- Attendance Stats
    total_days INT NOT NULL,
    present_days DECIMAL(5, 1) NOT NULL,
    paid_leave_days DECIMAL(5, 1) DEFAULT 0,
    absent_days DECIMAL(5, 1) DEFAULT 0,
    payable_days DECIMAL(5, 1) GENERATED ALWAYS AS (present_days + paid_leave_days) STORED,
    
    -- Earnings (Calculated)
    basic_earned DECIMAL(12, 2) NOT NULL,
    hra_earned DECIMAL(12, 2) DEFAULT 0,
    da_earned DECIMAL(12, 2) DEFAULT 0,
    allowances_earned DECIMAL(12, 2) DEFAULT 0,
    overtime_amount DECIMAL(12, 2) DEFAULT 0,
    gross_salary DECIMAL(12, 2) NOT NULL,
    
    -- Deductions (Calculated)
    pf_deduction DECIMAL(12, 2) DEFAULT 0,
    esi_deduction DECIMAL(12, 2) DEFAULT 0,
    pt_deduction DECIMAL(12, 2) DEFAULT 0,
    tds_deduction DECIMAL(12, 2) DEFAULT 0,
    loan_deduction DECIMAL(12, 2) DEFAULT 0,
    total_deductions DECIMAL(12, 2) NOT NULL,
    
    -- Net Pay
    net_salary DECIMAL(12, 2) NOT NULL,
    
    -- Status
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed')),
    payment_date DATE,
    transaction_ref VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(payroll_cycle_id, employee_id)
);

-- 3. RLS POLICIES
-- =====================================================
ALTER TABLE employee_salary_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payroll ENABLE ROW LEVEL SECURITY;

-- Read Policies
CREATE POLICY "View own salary structure" ON employee_salary_structure FOR SELECT USING (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));
CREATE POLICY "View payroll cycles" ON payroll_cycles FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'hr_manager', 'accountant'));
CREATE POLICY "View own payroll" ON employee_payroll FOR SELECT USING (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager', 'accountant'));
