// =====================================================
// HRM MODULE TYPE DEFINITIONS
// Hospital CRM Pro - Human Resource Management
// =====================================================

export interface EmployeeMaster {
  id: string;
  hospital_id: string;
  staff_unique_id: string;
  first_name: string;
  last_name: string;

  // Professional
  employment_status: 'Permanent' | 'Contractual' | 'Trainee' | 'Inactive';
  job_title: string;
  department_id: string;
  role_id: string;
  date_of_joining: string;
  reporting_manager_id?: string;

  // Personal
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  work_email: string;
  personal_phone: string;
  residential_address: string;

  // Statutory & Finance
  basic_salary: number;
  bank_account_number: string;
  pan_card_number?: string;
  aadhaar_number?: string;
  hpr_number?: string;

  // Documents
  photo_url?: string;
  aadhaar_doc_url?: string;

  // Meta
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;

  // Joins
  department?: EmployeeDepartment;
  reporting_manager?: EmployeeMaster;
}

export interface Employee {
  id: string;
  hospital_id: string;
  employee_id: string; // Custom employee ID (e.g., EMP001)
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  blood_group?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;

  // Employment Details
  department_id?: string;
  role_id?: string;
  designation?: string;
  joining_date: string;
  resignation_date?: string;
  employment_type?: 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern';
  work_location?: string;
  reporting_manager_id?: string;

  // Salary Details
  basic_salary?: number;
  hra?: number;
  allowances?: number;
  gross_salary?: number;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  pan_number?: string;

  // Documents
  photo_url?: string;
  resume_url?: string;
  id_proof_url?: string;
  address_proof_url?: string;
  documents?: DocumentInfo[];

  // Status
  is_active: boolean;
  termination_reason?: string;
  notes?: string;

  // Integration
  linked_doctor_id?: string;
  user_id?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;

  // Joined data (populated via queries)
  department?: EmployeeDepartment;
  role?: EmployeeRole;
  reporting_manager?: Employee;
}

export interface EmployeeDepartment {
  id: string;
  hospital_id: string;
  department_name: string;
  department_code: string;
  description?: string;
  head_employee_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeRole {
  id: string;
  hospital_id: string;
  role_name: string;
  role_code: string;
  description?: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAttendance {
  id: string;
  hospital_id: string;
  employee_id: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  total_hours?: number;
  status: 'Present' | 'Absent' | 'Half-Day' | 'Leave' | 'Holiday';
  is_late: boolean;
  late_by_minutes: number;
  notes?: string;
  marked_by?: string;
  location?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  employee?: Employee;
}

export interface LeaveType {
  id: string;
  hospital_id: string;
  leave_name: string;
  leave_code: string;
  description?: string;
  max_days_per_year: number;
  is_paid: boolean;
  requires_approval: boolean;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeLeave {
  id: string;
  hospital_id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  notes?: string;
  emergency_contact?: string;
  attachments?: DocumentInfo[];
  created_at: string;
  updated_at: string;

  // Joined data
  employee?: Employee;
  leave_type?: LeaveType;
  approver?: Employee;
}

export interface EmployeeLeaveBalance {
  id: string;
  hospital_id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  total_allocated: number;
  used: number;
  balance: number;
  carried_forward: number;
  created_at: string;
  updated_at: string;

  // Joined data
  leave_type?: LeaveType;
}

export interface EmployeeSalaryStructure {
  id: string;
  hospital_id: string;
  employee_id: string;
  basic_salary: number;
  hra: number;
  da: number;
  medical_allowance: number;
  travel_allowance: number;
  special_allowance: number;
  pf_enabled: boolean;
  esi_enabled: boolean;
  pt_enabled: boolean;
  tds_enabled: boolean;
  effective_from: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollCycle {
  id: string;
  hospital_id: string;
  month: number;
  year: number;
  start_date: string;
  end_date: string;
  working_days: number;
  status: 'Draft' | 'Processing' | 'Approved' | 'Locked';
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeePayroll {
  id: string;
  hospital_id: string;
  payroll_cycle_id: string;
  employee_id: string;

  // Attendance
  total_days: number;
  present_days: number;
  paid_leave_days: number;
  absent_days: number;
  payable_days: number;

  // Earnings
  basic_earned: number;
  hra_earned: number;
  da_earned: number;
  allowances_earned: number;
  overtime_amount: number;
  gross_salary: number;

  // Deductions
  pf_deduction: number;
  esi_deduction: number;
  pt_deduction: number;
  tds_deduction: number;
  loan_deduction: number;
  total_deductions: number;

  // Net
  net_salary: number;

  // Status
  payment_status: 'Pending' | 'Paid' | 'Failed';
  payment_date?: string;
  transaction_ref?: string;

  created_at: string;
  updated_at: string;

  // Joined
  employee?: EmployeeMaster;
  cycle?: PayrollCycle;
}

export interface PerformanceReview {
  id: string;
  hospital_id: string;
  employee_id: string;
  reviewer_id: string;
  review_period_start: string;
  review_period_end: string;

  technical_skills_rating?: number;
  communication_rating?: number;
  teamwork_rating?: number;
  punctuality_rating?: number;
  initiative_rating?: number;
  overall_rating?: number;

  strengths?: string;
  areas_for_improvement?: string;
  goals_for_next_period?: string;
  reviewer_comments?: string;
  employee_comments?: string;

  status: 'Draft' | 'Submitted' | 'Acknowledged' | 'Finalized';
  submitted_at?: string;
  acknowledged_at?: string;

  created_at: string;
  updated_at: string;

  // Joined
  employee?: EmployeeMaster;
  reviewer?: EmployeeMaster;
}

export interface TrainingProgram {
  id: string;
  hospital_id: string;
  title: string;
  description?: string;
  trainer_name?: string;
  training_type: 'Technical' | 'Soft Skills' | 'Safety' | 'Compliance' | 'Onboarding';
  start_time: string;
  end_time: string;
  location?: string;
  max_participants?: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface TrainingParticipant {
  id: string;
  hospital_id: string;
  training_id: string;
  employee_id: string;
  status: 'Registered' | 'Attended' | 'No Show' | 'Completed';
  feedback_rating?: number;
  feedback_comments?: string;
  certificate_url?: string;
  created_at: string;
  updated_at: string;

  // Joined
  employee?: EmployeeMaster;
  training?: TrainingProgram;
}

export interface Shift {
  id: string;
  hospital_id: string;
  shift_name: string;
  shift_code: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobPosting {
  id: string;
  hospital_id: string;
  title: string;
  department_id?: string;
  description?: string;
  requirements?: string;
  positions: number;
  status: 'Open' | 'Closed' | 'Draft' | 'On Hold';
  posted_date: string;
  closing_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  hospital_id: string;
  job_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  portfolio_url?: string;
  status: 'Applied' | 'Screening' | 'Interview' | 'Offered' | 'Hired' | 'Rejected';
  rating?: number;
  notes?: string;
  applied_at: string;
  updated_at: string;

  // Joined
  job?: JobPosting;
}

export interface OnboardingTask {
  id: string;
  hospital_id: string;
  onboarding_id: string;
  task_name: string;
  description?: string;
  assigned_to?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Skipped';
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeOnboarding {
  id: string;
  hospital_id: string;
  employee_id: string;
  workflow_id?: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  start_date: string;
  completion_date?: string;
  created_at: string;
  updated_at: string;

  // Joined
  employee?: EmployeeMaster;
  tasks?: OnboardingTask[];
}

export interface EmployeeSchedule {
  id: string;
  hospital_id: string;
  employee_id: string;
  shift_id: string;
  schedule_date: string;
  is_off_day: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;

  // Joined data
  employee?: EmployeeMaster;
  shift?: Shift;
}


export interface AttendanceLog {
  id: string;
  hospital_id: string;
  employee_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Late' | 'On Leave';
  is_late_entry: boolean;
  is_early_exit: boolean;
  total_work_hours: number;
  overtime_hours: number;
  remarks?: string;
  created_at: string;
  updated_at: string;

  // Joined
  employee?: EmployeeMaster;
}

export interface DocumentInfo {
  name: string;
  url: string;
  type: string;
  uploaded_at: string;
}

export interface EmployeeExit {
  id: string;
  hospital_id: string;
  employee_id: string;
  type: 'Resignation' | 'Termination' | 'Retirement' | 'Death';
  reason?: string;
  resignation_date: string;
  last_working_day?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  exit_interview_notes?: string;
  feedback_rating?: number;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;

  // Joined
  employee?: EmployeeMaster;
}

export interface ExitChecklist {
  id: string;
  hospital_id: string;
  exit_id: string;
  department: string;
  task_name: string;
  status: 'Pending' | 'Cleared' | 'Not Applicable';
  cleared_by?: string;
  cleared_at?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftSwapRequest {
  id: string;
  hospital_id: string;
  requester_id: string;
  target_employee_id?: string;
  original_shift_id: string;
  target_shift_id?: string;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  manager_approval_status: 'Pending' | 'Approved' | 'Rejected';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;

  // Joined
  requester?: EmployeeMaster;
  target_employee?: EmployeeMaster;
  original_shift?: EmployeeSchedule;
  target_shift?: EmployeeSchedule;
}

export interface Announcement {
  id: string;
  hospital_id: string;
  title: string;
  content: string;
  priority: 'Low' | 'Medium' | 'High';
  target_department?: string;
  posted_by?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  hospital_id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'Shift' | 'Leave' | 'Payroll' | 'Announcement';
  is_read: boolean;
  link?: string;
  created_at: string;
}

// =====================================================
// FORM TYPES FOR DATA INPUT
// =====================================================

export interface EmployeeFormData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  department_id?: string;
  role_id?: string;
  designation?: string;
  joining_date: string;
  employment_type?: string;
  work_location?: string;
  reporting_manager_id?: string;
  basic_salary?: number;
  hra?: number;
  allowances?: number;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  pan_number?: string;
  notes?: string;
}

export interface EmployeeMasterFormData {
  staff_unique_id?: string;
  first_name: string;
  last_name: string;
  employment_status: string;
  job_title: string;
  department_id: string;
  role_id: string;
  date_of_joining: string;
  reporting_manager_id?: string;
  date_of_birth: string;
  gender: string;
  work_email: string;
  personal_phone: string;
  residential_address: string;
  basic_salary: number;
  bank_account_number: string;
  pan_card_number?: string;
  aadhaar_number?: string;
  hpr_number?: string;
  photo_url?: string;
  aadhaar_doc_url?: string;
}

export interface AttendanceFormData {
  employee_id: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: string;
  notes?: string;
  location?: string;
}

export interface LeaveFormData {
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  emergency_contact?: string;
}

export interface PayrollFormData {
  employee_id: string;
  month: number;
  year: number;
  bonus?: number;
  overtime_pay?: number;
  other_earnings?: number;
  pf_deduction?: number;
  esi_deduction?: number;
  tax_deduction?: number;
  loan_deduction?: number;
  other_deductions?: number;
  payment_date?: string;
  payment_mode?: string;
  payment_reference?: string;
  notes?: string;
}

// =====================================================
// STATISTICS AND DASHBOARD TYPES
// =====================================================

export interface HRMDashboardStats {
  total_employees: number;
  active_employees: number;
  present_today: number;
  absent_today: number;
  on_leave_today: number;
  pending_leave_requests: number;
  departments_count: number;
  new_joinings_this_month: number;
  resignations_this_month: number;
}

export interface AttendanceSummary {
  date: string;
  total_employees: number;
  present: number;
  absent: number;
  on_leave: number;
  half_day: number;
  attendance_percentage: number;
}

export interface DepartmentStats {
  department_id: string;
  department_name: string;
  total_employees: number;
  active_employees: number;
  average_salary: number;
}

export interface LeaveStats {
  leave_type: string;
  total_requests: number;
  approved: number;
  pending: number;
  rejected: number;
}

// =====================================================
// FILTER AND SEARCH TYPES
// =====================================================

export interface EmployeeFilters {
  department_id?: string;
  role_id?: string;
  employment_type?: string;
  is_active?: boolean;
  search?: string;
}

export interface AttendanceFilters {
  employee_id?: string;
  department_id?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export interface LeaveFilters {
  employee_id?: string;
  leave_type_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface PayrollFilters {
  employee_id?: string;
  department_id?: string;
  month?: number;
  year?: number;
  status?: string;
}

// =====================================================
// FAMILY, EDUCATION & DOCUMENTS (PHASE 5)
// Force HMR Update
// =====================================================

export interface FamilyMember {
  id: string;
  hospital_id: string;
  employee_id: string;
  name: string;
  relationship: string;
  relation?: string; // Alias for backward compatibility
  date_of_birth?: string;
  is_dependent?: boolean;
  is_emergency_contact?: boolean;
  contact_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Education {
  id: string;
  hospital_id: string;
  employee_id: string;
  institution: string;
  institution_name?: string; // Alias
  degree: string;
  field_of_study?: string;
  year_of_passing: number;
  start_date?: string;
  end_date?: string;
  grade?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeDocument {
  id: string;
  hospital_id: string;
  employee_id: string;
  document_type: string;
  document_number?: string;
  document_url: string;
  expiry_date?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

