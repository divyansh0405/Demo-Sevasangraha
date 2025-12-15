-- =====================================================
-- PHASE 3: PERFORMANCE & TRAINING SCHEMA
-- =====================================================

-- 1. PERFORMANCE MANAGEMENT
-- =====================================================
CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    reviewer_id UUID NOT NULL REFERENCES employee_master(id),
    
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    
    -- Ratings (1-5 Scale)
    technical_skills_rating INT CHECK (technical_skills_rating BETWEEN 1 AND 5),
    communication_rating INT CHECK (communication_rating BETWEEN 1 AND 5),
    teamwork_rating INT CHECK (teamwork_rating BETWEEN 1 AND 5),
    punctuality_rating INT CHECK (punctuality_rating BETWEEN 1 AND 5),
    initiative_rating INT CHECK (initiative_rating BETWEEN 1 AND 5),
    overall_rating DECIMAL(3, 1), -- Calculated average
    
    -- Qualitative Feedback
    strengths TEXT,
    areas_for_improvement TEXT,
    goals_for_next_period TEXT,
    reviewer_comments TEXT,
    employee_comments TEXT,
    
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Acknowledged', 'Finalized')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TRAINING MANAGEMENT
-- =====================================================
CREATE TABLE IF NOT EXISTS training_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    trainer_name VARCHAR(100),
    training_type VARCHAR(50) CHECK (training_type IN ('Technical', 'Soft Skills', 'Safety', 'Compliance', 'Onboarding')),
    
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(100), -- e.g., "Conference Room A" or "Zoom Link"
    max_participants INT,
    
    status VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

CREATE TABLE IF NOT EXISTS training_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    training_id UUID NOT NULL REFERENCES training_programs(id),
    employee_id UUID NOT NULL REFERENCES employee_master(id),
    
    status VARCHAR(20) DEFAULT 'Registered' CHECK (status IN ('Registered', 'Attended', 'No Show', 'Completed')),
    feedback_rating INT CHECK (feedback_rating BETWEEN 1 AND 5),
    feedback_comments TEXT,
    certificate_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(training_id, employee_id)
);

-- 3. RLS POLICIES
-- =====================================================
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_participants ENABLE ROW LEVEL SECURITY;

-- Performance Policies
CREATE POLICY "View own reviews" ON performance_reviews FOR SELECT USING (employee_id::text = auth.uid()::text OR reviewer_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));
CREATE POLICY "Reviewer can edit" ON performance_reviews FOR UPDATE USING (reviewer_id::text = auth.uid()::text);

-- Training Policies
CREATE POLICY "View all trainings" ON training_programs FOR SELECT USING (true);
CREATE POLICY "View own participation" ON training_participants FOR SELECT USING (employee_id::text = auth.uid()::text OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));
