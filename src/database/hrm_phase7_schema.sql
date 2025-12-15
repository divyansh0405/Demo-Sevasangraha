-- =====================================================
-- PHASE 7: ADVANCED SHIFTS & COMMUNICATION SCHEMA
-- =====================================================

-- 1. SHIFT SWAPS
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_swap_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    requester_id UUID NOT NULL REFERENCES employee_master(id),
    target_employee_id UUID REFERENCES employee_master(id), -- Optional: Open swap or specific person
    
    original_shift_id UUID NOT NULL REFERENCES employee_schedule(id),
    target_shift_id UUID REFERENCES employee_schedule(id), -- Optional: If swapping with a specific shift
    
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected, Cancelled
    
    manager_approval_status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected
    approved_by UUID REFERENCES employee_master(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. COMMUNICATION
-- =====================================================
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High
    
    target_department UUID REFERENCES department_master(id), -- Null means All Departments
    
    posted_by UUID REFERENCES employee_master(id),
    expiry_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    user_id UUID NOT NULL, -- Links to auth.users or employee_master depending on system design. Using auth.uid() usually.
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- Shift, Leave, Payroll, Announcement
    
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS POLICIES
-- =====================================================
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Shift Swap Policies
CREATE POLICY "View own swaps" ON shift_swap_requests FOR SELECT USING (
    requester_id::text = auth.uid()::text 
    OR target_employee_id::text = auth.uid()::text
    OR auth.jwt() ->> 'role' IN ('admin', 'hr_manager', 'department_head')
);

CREATE POLICY "Create swap request" ON shift_swap_requests FOR INSERT WITH CHECK (
    requester_id::text = auth.uid()::text
);

CREATE POLICY "Manage swaps" ON shift_swap_requests FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('admin', 'hr_manager', 'department_head')
    OR (target_employee_id::text = auth.uid()::text AND status = 'Pending') -- Target employee accepting
);

-- Announcement Policies
CREATE POLICY "View announcements" ON announcements FOR SELECT USING (true); -- Visible to all authenticated
CREATE POLICY "Manage announcements" ON announcements FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'hr_manager'));

-- Notification Policies
CREATE POLICY "View own notifications" ON notifications FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Update own notifications" ON notifications FOR UPDATE USING (user_id::text = auth.uid()::text);
