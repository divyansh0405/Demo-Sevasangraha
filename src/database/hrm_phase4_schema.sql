-- =====================================================
-- PHASE 4: RECRUITMENT & ONBOARDING SCHEMA
-- =====================================================

-- 1. RECRUITMENT
-- =====================================================
CREATE TABLE IF NOT EXISTS recruitment_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    
    title VARCHAR(200) NOT NULL,
    department_id UUID REFERENCES department_master(id),
    description TEXT,
    requirements TEXT,
    positions INT DEFAULT 1,
    
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Draft', 'On Hold')),
    posted_date DATE DEFAULT CURRENT_DATE,
    closing_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

CREATE TABLE IF NOT EXISTS recruitment_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    job_id UUID REFERENCES recruitment_jobs(id),
    
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    resume_url TEXT,
    portfolio_url TEXT,
    
    status VARCHAR(20) DEFAULT 'Applied' CHECK (status IN ('Applied', 'Screening', 'Interview', 'Offered', 'Hired', 'Rejected')),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    notes TEXT,
    
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recruitment_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    candidate_id UUID NOT NULL REFERENCES recruitment_candidates(id),
    interviewer_id UUID NOT NULL REFERENCES employee_master(id),
    
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    interview_type VARCHAR(50) DEFAULT 'In Person' CHECK (interview_type IN ('In Person', 'Video Call', 'Phone', 'Technical Test')),
    location_link TEXT, -- Room or Zoom link
    
    feedback TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    status VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ONBOARDING
-- =====================================================
CREATE TABLE IF NOT EXISTS onboarding_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    title VARCHAR(100) NOT NULL, -- e.g., "Standard Employee Onboarding"
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_onboarding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    workflow_id UUID REFERENCES onboarding_workflows(id),
    
    status VARCHAR(20) DEFAULT 'In Progress' CHECK (status IN ('Not Started', 'In Progress', 'Completed')),
    start_date DATE DEFAULT CURRENT_DATE,
    completion_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    onboarding_id UUID NOT NULL REFERENCES employee_onboarding(id),
    
    task_name VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES employee_master(id), -- Who needs to do this (e.g., IT Admin for laptop)
    
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Skipped')),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS POLICIES
-- =====================================================
ALTER TABLE recruitment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- Recruitment Policies
CREATE POLICY "View jobs" ON recruitment_jobs FOR SELECT USING (true);
CREATE POLICY "Manage jobs" ON recruitment_jobs FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));

CREATE POLICY "View candidates" ON recruitment_candidates FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'hr_manager', 'team_lead'));
CREATE POLICY "Manage candidates" ON recruitment_candidates FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));

-- Onboarding Policies
CREATE POLICY "View onboarding" ON employee_onboarding FOR SELECT USING (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));
CREATE POLICY "Manage onboarding" ON employee_onboarding FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));
