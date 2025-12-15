-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. Department Master Table
-- =====================================================
CREATE TABLE IF NOT EXISTS department_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(20) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- =====================================================
-- 2. Employee Master Table
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    
    -- Identifiers
    staff_unique_id VARCHAR(50) NOT NULL UNIQUE, -- Auto-generated (e.g., EMP-001)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    -- Professional Details
    employment_status VARCHAR(50) NOT NULL CHECK (employment_status IN ('Permanent', 'Contractual', 'Trainee', 'Inactive')),
    job_title VARCHAR(100) NOT NULL,
    department_id UUID NOT NULL REFERENCES department_master(id),
    role_id UUID NOT NULL, -- Links to existing UserRoles table
    date_of_joining DATE NOT NULL,
    reporting_manager_id UUID REFERENCES employee_master(id),
    
    -- Personal & Contact
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    work_email VARCHAR(255) NOT NULL UNIQUE,
    personal_phone VARCHAR(20) NOT NULL,
    residential_address TEXT NOT NULL,
    
    -- Statutory & Finance
    basic_salary DECIMAL(12, 2) NOT NULL CHECK (basic_salary > 0),
    bank_account_number VARCHAR(50) NOT NULL,
    pan_card_number VARCHAR(10) UNIQUE, -- Regex validation to be handled in app/constraint
    aadhaar_number VARCHAR(12) UNIQUE,
    hpr_number VARCHAR(50), -- Required if medical staff
    
    -- Documents
    photo_url TEXT,
    aadhaar_doc_url TEXT,
    
    -- Meta
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Add indexes for performance
CREATE INDEX idx_employee_master_hospital_id ON employee_master(hospital_id);
CREATE INDEX idx_employee_master_department_id ON employee_master(department_id);
CREATE INDEX idx_employee_master_email ON employee_master(work_email);
CREATE INDEX idx_employee_master_staff_id ON employee_master(staff_unique_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_master_updated_at
    BEFORE UPDATE ON employee_master
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
