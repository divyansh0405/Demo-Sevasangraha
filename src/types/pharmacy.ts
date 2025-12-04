/**
 * Comprehensive TypeScript Types for Pharmacy Module
 * Hospital CRM Pro - Pharmacy Management System
 */

// =====================================================================
// ENHANCED MEDICINE TYPES
// =====================================================================

export interface EnhancedMedicine {
  id: string;
  name: string;
  generic_name?: string;
  brand_name?: string;
  category: string;
  dosage_form?: string;
  strength?: string;
  manufacturer?: string;
  is_active: boolean;
  is_custom: boolean;
  usage_count: number;

  // Pharmacy-specific fields
  is_high_alert: boolean;
  is_lasa: boolean; // Look-Alike Sound-Alike
  is_emergency: boolean;
  is_high_risk: boolean;
  is_narcotic: boolean;
  is_psychotropic: boolean;
  is_radioactive: boolean;
  is_chemotherapeutic: boolean;

  barcode?: string;
  qr_code?: string;
  formulary_status: 'formulary' | 'non-formulary' | 'restricted';
  therapeutic_class?: string;
  route_of_administration?: string;
  storage_conditions?: string;
  warnings?: string;
  contraindications?: string;
  side_effects?: string;

  created_at: string;
  updated_at: string;
  created_by?: string;
}

export type MedicineTag = 'high-alert' | 'LASA' | 'emergency' | 'high-risk' | 'narcotic' | 'psychotropic' | 'radioactive' | 'chemotherapeutic';

// =====================================================================
// PHARMACY LOCATION TYPES
// =====================================================================

export type PharmacyLocationType = 'main_store' | 'ward' | 'icu' | 'emergency' | 'ot' | 'crash_cart' | 'satellite';

export interface PharmacyLocation {
  id: string;
  name: string;
  type: PharmacyLocationType;
  department?: string;
  floor_number?: number;
  room_number?: string;
  is_active: boolean;
  capacity_limit?: number;
  responsible_pharmacist_id?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================================
// INVENTORY TYPES
// =====================================================================

export type InventoryStatus = 'available' | 'quarantined' | 'recalled' | 'expired' | 'damaged' | 'returned';

export interface PharmacyInventoryItem {
  id: string;
  medicine_id: string;
  location_id: string;
  batch_number: string;
  lot_number?: string;
  serial_number?: string;
  quantity: number;
  min_reorder_level: number;
  max_stock_level?: number;
  unit_price: number;
  purchase_price?: number;
  selling_price?: number;
  tax_percentage: number;
  manufacturer?: string;
  supplier_name?: string;
  expiry_date: string;
  received_date: string;
  manufactured_date?: string;
  status: InventoryStatus;
  storage_location?: string;
  is_consignment: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  hsn_code?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;

  // Populated fields
  medicine?: EnhancedMedicine;
  location?: PharmacyLocation;
}

// =====================================================================
// CONSUMPTION TRACKING TYPES
// =====================================================================

export interface PharmacyConsumption {
  id: string;
  medicine_id: string;
  location_id: string;
  quantity_consumed: number;
  consumption_date: string;
  month: number;
  year: number;
  created_at: string;

  // Populated fields
  medicine?: EnhancedMedicine;
  location?: PharmacyLocation;
}

// =====================================================================
// PHARMACY ORDER TYPES
// =====================================================================

export type PharmacyOrderType = 'OPD' | 'IPD' | 'emergency' | 'walk-in';
export type PharmacyOrderStatus = 'prescribed' | 'pending_dispense' | 'partially_dispensed' | 'dispensed' | 'administered' | 'cancelled' | 'returned';
export type OrderPriority = 'stat' | 'urgent' | 'routine';

export interface PharmacyOrder {
  id: string;
  order_number: string;
  patient_id: string;
  prescriber_id: string;
  order_type: PharmacyOrderType;
  order_status: PharmacyOrderStatus;
  priority: OrderPriority;
  prescribed_at: string;
  dispensed_at?: string;
  administered_at?: string;
  location_id?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  requires_second_check: boolean;
  second_checker_id?: string;
  second_check_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Populated fields
  patient?: any; // Patient type from existing types
  prescriber?: any; // User type
  items?: PharmacyOrderItem[];
  location?: PharmacyLocation;
}

export interface PharmacyOrderItem {
  id: string;
  order_id: string;
  medicine_id: string;
  inventory_item_id?: string;
  quantity_ordered: number;
  quantity_dispensed: number;
  dose: string;
  frequency: string;
  route: string;
  duration?: string;
  start_date?: string;
  end_date?: string;
  special_instructions?: string;
  is_prn: boolean;
  max_dose_per_day?: string;
  unit_price: number;
  total_price: number;
  discount_percentage: number;
  tax_amount: number;
  net_amount: number;
  is_substituted: boolean;
  substituted_from_medicine_id?: string;
  substitution_reason?: string;
  status: 'pending' | 'dispensed' | 'administered' | 'cancelled' | 'returned';
  created_at: string;
  updated_at: string;

  // Populated fields
  medicine?: EnhancedMedicine;
  inventory_item?: PharmacyInventoryItem;
}

// =====================================================================
// eMAR TYPES
// =====================================================================

export interface ElectronicMAR {
  id: string;
  patient_id: string;
  order_id: string;
  order_item_id: string;
  medicine_id: string;
  scheduled_time: string;
  administered_time?: string;
  administered_by?: string;
  dose_given: string;
  route: string;
  site?: string;
  is_administered: boolean;
  is_omitted: boolean;
  omission_reason?: string;
  is_refused: boolean;
  refusal_reason?: string;
  is_delayed: boolean;
  delay_reason?: string;
  patient_response?: string;
  adverse_reaction?: string;
  verified_by?: string;
  verification_time?: string;
  barcode_scanned: boolean;
  patient_barcode?: string;
  medicine_barcode?: string;
  is_verbal_order: boolean;
  verbal_order_by?: string;
  verbal_order_confirmed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Populated fields
  patient?: any;
  medicine?: EnhancedMedicine;
  order?: PharmacyOrder;
}

// =====================================================================
// ALLERGY TYPES
// =====================================================================

export type AllergyType = 'drug' | 'food' | 'environmental' | 'other';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life-threatening';

export interface PatientAllergy {
  id: string;
  patient_id: string;
  allergy_type: AllergyType;
  allergen_name: string;
  medicine_id?: string;
  reaction: string;
  severity?: AllergySeverity;
  onset_date?: string;
  reported_by?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Populated fields
  medicine?: EnhancedMedicine;
}

// =====================================================================
// MEDICATION RECONCILIATION TYPES
// =====================================================================

export type ReconciliationEncounterType = 'admission' | 'discharge' | 'transfer' | 'follow-up';
export type ReconciliationStatus = 'in_progress' | 'completed' | 'reviewed';

export interface HomeMedication {
  name: string;
  dose: string;
  frequency: string;
  route: string;
}

export interface MedicationReconciliation {
  id: string;
  patient_id: string;
  encounter_type: ReconciliationEncounterType;
  encounter_date: string;
  reconciled_by: string;
  home_medications?: HomeMedication[];
  hospital_medications?: HomeMedication[];
  reconciled_medications?: HomeMedication[];
  discrepancies_found?: string;
  actions_taken?: string;
  status: ReconciliationStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================================
// RETURNS & RECALLS TYPES
// =====================================================================

export type ReturnRecallType = 'return' | 'recall' | 'damaged' | 'expired';
export type ReturnRecallStatus = 'reported' | 'quarantined' | 'disposed' | 'returned_to_supplier' | 'resolved';
export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processed';

export interface PharmacyReturnRecall {
  id: string;
  type: ReturnRecallType;
  inventory_item_id: string;
  medicine_id: string;
  batch_number: string;
  quantity: number;
  reason: string;
  reported_by: string;
  reported_date: string;
  action_taken?: string;
  disposed_by?: string;
  disposal_date?: string;
  disposal_method?: string;
  affected_patients?: string[];
  supplier_notified: boolean;
  supplier_notification_date?: string;
  refund_amount?: number;
  refund_status?: RefundStatus;
  status: ReturnRecallStatus;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Populated fields
  inventory_item?: PharmacyInventoryItem;
  medicine?: EnhancedMedicine;
}

// =====================================================================
// MEDICATION ERROR TYPES
// =====================================================================

export type MedicationErrorType = 'medication_error' | 'near_miss' | 'adverse_drug_reaction' | 'other';
export type ErrorCategory = 'wrong_patient' | 'wrong_drug' | 'wrong_dose' | 'wrong_route' | 'wrong_time' | 'omission' | 'documentation' | 'other';
export type ErrorSeverity = 'minor' | 'moderate' | 'severe' | 'critical' | 'catastrophic';
export type InvestigationStatus = 'reported' | 'under_review' | 'investigated' | 'closed';

export interface MedicationError {
  id: string;
  incident_number: string;
  incident_type: MedicationErrorType;
  error_category?: ErrorCategory;
  severity: ErrorSeverity;
  patient_id?: string;
  medicine_id?: string;
  order_id?: string;
  occurred_at: string;
  reported_by: string;
  reported_at: string;
  discovered_by?: string;
  location_id?: string;
  description: string;
  root_cause_analysis?: string;
  contributing_factors?: string;
  immediate_action_taken?: string;
  corrective_action?: string;
  preventive_measures?: string;
  patient_outcome?: string;
  requires_notification: boolean;
  notification_sent: boolean;
  investigation_status: InvestigationStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  is_sentinel_event: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================================
// CRASH CART TYPES
// =====================================================================

export type CrashCartStatus = 'ready' | 'in_use' | 'restocking' | 'maintenance' | 'decommissioned';

export interface CrashCart {
  id: string;
  cart_number: string;
  location_id: string;
  location_description: string;
  responsible_person?: string;
  last_checked_at?: string;
  last_checked_by?: string;
  next_check_due?: string;
  check_frequency_days: number;
  seal_number?: string;
  is_sealed: boolean;
  status: CrashCartStatus;
  created_at: string;
  updated_at: string;

  // Populated fields
  location?: PharmacyLocation;
  inventory?: CrashCartInventoryItem[];
}

export interface CrashCartInventoryItem {
  id: string;
  cart_id: string;
  medicine_id: string;
  inventory_item_id?: string;
  required_quantity: number;
  current_quantity: number;
  position?: string;
  is_complete: boolean;
  last_verified_at?: string;
  last_verified_by?: string;
  created_at: string;
  updated_at: string;

  // Populated fields
  medicine?: EnhancedMedicine;
  inventory_item?: PharmacyInventoryItem;
}

export interface CrashCartCheckLog {
  id: string;
  cart_id: string;
  checked_by: string;
  checked_at: string;
  seal_intact: boolean;
  seal_number?: string;
  all_items_present: boolean;
  expiry_check_done: boolean;
  issues_found?: string;
  corrective_actions?: string;
  next_check_date?: string;
  created_at: string;
}

// =====================================================================
// PHARMACY BILLING TYPES
// =====================================================================

export type PharmacyBillType = 'OPD' | 'IPD' | 'emergency' | 'walk-in';
export type PaymentMode = 'cash' | 'card' | 'upi' | 'insurance' | 'credit' | 'multiple';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded';

export interface PharmacyBill {
  id: string;
  bill_number: string;
  patient_id: string;
  order_id?: string;
  bill_type: PharmacyBillType;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  tax_amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_mode?: PaymentMode;
  payment_status: PaymentStatus;
  insurance_company?: string;
  insurance_policy_number?: string;
  insurance_claim_amount?: number;
  insurance_approval_number?: string;
  billed_by: string;
  billed_at: string;
  payment_received_by?: string;
  payment_received_at?: string;
  notes?: string;
  is_cancelled: boolean;
  cancelled_by?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;

  // Populated fields
  patient?: any;
  items?: PharmacyBillItem[];
}

export interface PharmacyBillItem {
  id: string;
  bill_id: string;
  medicine_id: string;
  inventory_item_id?: string;
  medicine_name: string;
  batch_number?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  net_amount: number;
  created_at: string;

  // Populated fields
  medicine?: EnhancedMedicine;
}

// =====================================================================
// MEDICAL IMPLANT TYPES
// =====================================================================

export interface MedicalImplant {
  id: string;
  patient_id: string;
  order_id?: string;
  implant_type: string;
  implant_name: string;
  manufacturer: string;
  model_number?: string;
  serial_number: string;
  lot_number: string;
  batch_number?: string;
  size?: string;
  expiry_date?: string;
  implantation_date: string;
  implanted_by: string;
  procedure_name: string;
  procedure_id?: string;
  location_in_body?: string;
  barcode?: string;
  qr_code?: string;
  unit_price?: number;
  supplier_name?: string;
  is_mri_compatible?: boolean;
  warranty_period?: string;
  patient_card_issued: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================================
// FORMULARY TYPES
// =====================================================================

export type FormularyPreferredStatus = 'preferred' | 'alternative' | 'restricted' | 'non-preferred';
export type CostEffectivenessTier = 'tier1' | 'tier2' | 'tier3';

export interface PharmacyFormulary {
  id: string;
  medicine_id: string;
  therapeutic_category: string;
  preferred_status: FormularyPreferredStatus;
  restriction_criteria?: string;
  alternatives?: string[]; // Array of medicine IDs
  cost_effectiveness_tier?: CostEffectivenessTier;
  added_to_formulary_date: string;
  added_by?: string;
  review_date?: string;
  reviewed_by?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Populated fields
  medicine?: EnhancedMedicine;
}

// =====================================================================
// STOCK MOVEMENT TYPES
// =====================================================================

export type StockMovementType = 'purchase' | 'dispense' | 'return' | 'transfer' | 'adjustment' | 'wastage' | 'recall' | 'expiry';

export interface PharmacyStockMovement {
  id: string;
  inventory_item_id: string;
  medicine_id: string;
  location_id: string;
  movement_type: StockMovementType;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  batch_number: string;
  reference_id?: string;
  reference_type?: string;
  performed_by: string;
  reason?: string;
  created_at: string;

  // Populated fields
  medicine?: EnhancedMedicine;
  location?: PharmacyLocation;
}

// =====================================================================
// ALERT TYPES
// =====================================================================

export type AlertPriority = 'urgent' | 'high' | 'normal' | 'low';
export type AlertStatus = 'active' | 'acknowledged' | 'ordered' | 'resolved';

export interface PharmacyReorderAlert {
  id: string;
  medicine_id: string;
  location_id: string;
  inventory_item_id?: string;
  current_quantity: number;
  min_reorder_level: number;
  suggested_reorder_quantity?: number;
  priority: AlertPriority;
  alert_status: AlertStatus;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;

  // Populated fields
  medicine?: EnhancedMedicine;
  location?: PharmacyLocation;
}

export type ExpiryAlertLevel = 'critical' | 'warning' | 'info';

export interface PharmacyExpiryAlert {
  id: string;
  inventory_item_id: string;
  medicine_id: string;
  location_id: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  days_to_expiry: number;
  alert_level: ExpiryAlertLevel;
  alert_status: AlertStatus;
  action_taken?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;

  // Populated fields
  medicine?: EnhancedMedicine;
  location?: PharmacyLocation;
  inventory_item?: PharmacyInventoryItem;
}

// =====================================================================
// AUDIT LOG TYPES
// =====================================================================

export interface PharmacyAuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  performed_by: string;
  performed_at: string;
  ip_address?: string;
  user_agent?: string;
  old_data?: any;
  new_data?: any;
  changes?: any;
  reason?: string;
  session_id?: string;
  created_at: string;
}

// =====================================================================
// REPORTING & ANALYTICS TYPES
// =====================================================================

export interface LowStockItem {
  id: string;
  medicine_name: string;
  generic_name?: string;
  batch_number: string;
  location_name: string;
  current_quantity: number;
  min_reorder_level: number;
  expiry_date: string;
  shortage_quantity: number;
}

export interface ExpiringSoonItem {
  id: string;
  medicine_name: string;
  batch_number: string;
  location_name: string;
  quantity: number;
  expiry_date: string;
  days_to_expiry: number;
}

export interface TopConsumedMedicine {
  id: string;
  name: string;
  generic_name?: string;
  category: string;
  total_consumed: number;
  consumption_days: number;
}

export interface PendingDispense {
  id: string;
  order_number: string;
  order_type: string;
  patient_name: string;
  hospital_id: string;
  prescriber: string;
  prescribed_at: string;
  total_items: number;
  dispensed_items: number;
}

// =====================================================================
// DASHBOARD METRICS TYPES
// =====================================================================

export interface PharmacyDashboardMetrics {
  total_medicines: number;
  total_inventory_value: number;
  low_stock_items: number;
  expiring_soon: number;
  pending_orders: number;
  today_dispenses: number;
  today_revenue: number;
  medication_errors_month: number;
  high_alert_meds: number;
  crash_carts_ready: number;
}

// =====================================================================
// FORM DATA TYPES
// =====================================================================

export interface CreateInventoryItemData {
  medicine_id: string;
  location_id: string;
  batch_number: string;
  lot_number?: string;
  quantity: number;
  min_reorder_level: number;
  max_stock_level?: number;
  unit_price: number;
  purchase_price?: number;
  selling_price?: number;
  tax_percentage: number;
  manufacturer?: string;
  supplier_name?: string;
  expiry_date: string;
  received_date: string;
  cgst?: number;
  sgst?: number;
  igst?: number;
  hsn_code?: string;
}

export interface CreatePharmacyOrderData {
  patient_id: string;
  prescriber_id: string;
  order_type: PharmacyOrderType;
  priority: OrderPriority;
  location_id?: string;
  items: CreateOrderItemData[];
  notes?: string;
}

export interface CreateOrderItemData {
  medicine_id: string;
  quantity_ordered: number;
  dose: string;
  frequency: string;
  route: string;
  duration?: string;
  special_instructions?: string;
  is_prn?: boolean;
}

export interface CreatePharmacyBillData {
  patient_id: string;
  order_id?: string;
  bill_type: PharmacyBillType;
  items: CreateBillItemData[];
  discount_percentage?: number;
  payment_mode?: PaymentMode;
  insurance_company?: string;
  insurance_policy_number?: string;
  notes?: string;
}

export interface CreateBillItemData {
  medicine_id: string;
  inventory_item_id?: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
}

// =====================================================================
// API RESPONSE TYPES
// =====================================================================

export interface PharmacyApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// =====================================================================
// FILTER & SEARCH TYPES
// =====================================================================

export interface InventoryFilters {
  medicine_id?: string;
  location_id?: string;
  status?: InventoryStatus;
  low_stock?: boolean;
  expiring_soon?: boolean;
  search?: string;
}

export interface OrderFilters {
  patient_id?: string;
  prescriber_id?: string;
  order_type?: PharmacyOrderType;
  order_status?: PharmacyOrderStatus;
  priority?: OrderPriority;
  date_from?: string;
  date_to?: string;
}

export interface BillFilters {
  patient_id?: string;
  bill_type?: PharmacyBillType;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
}
