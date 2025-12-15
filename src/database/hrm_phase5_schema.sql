-- =====================================================
-- PHASE 5: CORE HR ENHANCEMENTS SCHEMA
-- =====================================================

-- 1. EMPLOYEE DETAILS
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_family (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL, -- Spouse, Child, Parent, Sibling
    date_of_birth DATE,
    phone VARCHAR(20),
    is_emergency_contact BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    
    degree VARCHAR(100) NOT NULL, -- e.g., MBBS, B.Sc Nursing
    institution VARCHAR(200) NOT NULL,
    year_of_passing INT,
    grade_or_percentage VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    
    document_type VARCHAR(50) NOT NULL, -- Aadhaar, PAN, Resume, Certificate, Contract
    document_url TEXT NOT NULL,
    document_number VARCHAR(100), -- Optional: Aadhaar No, PAN No
    
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES employee_master(id)
);

-- 2. RLS POLICIES
-- =====================================================
ALTER TABLE employee_family ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- Family Policies
CREATE POLICY "View own family" ON employee_family FOR SELECT USING (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));
CREATE POLICY "Manage own family" ON employee_family FOR ALL USING (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));

-- Education Policies
CREATE POLICY "View own education" ON employee_education FOR SELECT USING (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));
CREATE POLICY "Manage own education" ON employee_education FOR ALL USING (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));

-- Document Policies
CREATE POLICY "View own documents" ON employee_documents FOR SELECT USING (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));
CREATE POLICY "Manage own documents" ON employee_documents FOR ALL USING (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));
