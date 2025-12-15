-- HRM Schema for Azure PostgreSQL

-- 1. Employee Master Table
CREATE TABLE IF NOT EXISTS employee_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL, -- Kept for compatibility, though single tenant in this context
    staff_unique_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    work_email TEXT UNIQUE NOT NULL,
    personal_email TEXT,
    phone TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE,
    department_id UUID, -- FK to departments
    role_id UUID, -- FK to roles (if we create a roles table) or just text
    designation TEXT,
    date_of_joining DATE NOT NULL,
    employment_status TEXT CHECK (employment_status IN ('Full-time', 'Part-time', 'Contract', 'Intern')),
    is_active BOOLEAN DEFAULT TRUE,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    pan_number TEXT,
    aadhaar_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Leave Types Table
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_name TEXT NOT NULL,
    leave_code TEXT NOT NULL,
    description TEXT,
    max_days_per_year INTEGER DEFAULT 12,
    is_paid BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Leave Balances Table
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee_master(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    total_allocated INTEGER NOT NULL,
    used INTEGER DEFAULT 0,
    pending INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, leave_type_id, year)
);

-- 4. Leave Applications Table
CREATE TABLE IF NOT EXISTS leave_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee_master(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(4,1) NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    approved_by UUID, -- FK to employee_master or users
    rejection_reason TEXT,
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Attendance Table
CREATE TABLE IF NOT EXISTS employee_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee_master(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('Present', 'Absent', 'Leave', 'Half-Day', 'Late')),
    total_hours NUMERIC(4,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, attendance_date)
);

-- 6. Payroll Table
CREATE TABLE IF NOT EXISTS employee_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee_master(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- e.g., 'January'
    year INTEGER NOT NULL,
    basic_salary NUMERIC(10,2) NOT NULL,
    allowances NUMERIC(10,2) DEFAULT 0,
    deductions NUMERIC(10,2) DEFAULT 0,
    net_salary NUMERIC(10,2) NOT NULL,
    payment_date DATE,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Processing')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Leave Types
INSERT INTO leave_types (leave_name, leave_code, max_days_per_year) VALUES
('Casual Leave', 'CL', 12),
('Sick Leave', 'SL', 10),
('Earned Leave', 'EL', 15),
('Maternity Leave', 'ML', 180),
('Paternity Leave', 'PL', 5)
ON CONFLICT DO NOTHING;
