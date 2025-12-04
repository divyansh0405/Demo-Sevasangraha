import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Trash2,
  User,
  DollarSign,
  Receipt,
  Printer,
  Save,
  X,
  Barcode,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import pharmacyService from '../../services/pharmacyService';
import medicineService from '../../services/medicineService';
import { supabase } from '../../config/supabase';
import type {
  EnhancedMedicine,
  PharmacyInventoryItem,
  CreatePharmacyBillData,
  CreateBillItemData,
} from '../../types/pharmacy';

interface Patient {
  id: string;
  name: string;
  hospital_id: string;
  contact_number?: string;
  age?: number;
}

interface BillItem {
  medicine_id: string;
  medicine_name: string;
  inventory_item_id: string;
  batch_number: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
}

const PharmacyBilling: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medicines, setMedicines] = useState<EnhancedMedicine[]>([]);
  const [inventoryItems, setInventoryItems] = useState<PharmacyInventoryItem[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [searchPatient, setSearchPatient] = useState('');
  const [searchMedicine, setSearchMedicine] = useState('');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [billDiscount, setBillDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'upi' | 'insurance'>('cash');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPatients();
    loadMedicines();
  }, []);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, hospital_id, contact_number, age')
        .order('name');

      if (error) {
        console.error('Error loading patients:', error);
        alert(`Error loading patients: ${error.message}\n\nPlease ensure you have patients in your database.`);
        throw error;
      }
      console.log('✅ Loaded patients:', data?.length || 0);
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadMedicines = async () => {
    try {
      const data = await pharmacyService.getMedicines();
      console.log('✅ Loaded medicines:', data?.length || 0);
      setMedicines(data);
    } catch (error) {
      console.error('Error loading medicines:', error);
      alert('Error loading medicines. Please check console for details.');
    }
  };

  const loadInventoryForMedicine = async (medicineId: string) => {
    try {
      const items = await pharmacyService.getInventoryItems({
        medicine_id: medicineId,
        status: 'available',
      });
      setInventoryItems(items.filter((item) => item.quantity > 0));
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(false);
  };

  const addMedicineToCart = (
    medicine: EnhancedMedicine,
    inventoryItem: PharmacyInventoryItem,
    quantity: number
  ) => {
    const unitPrice = inventoryItem.selling_price || inventoryItem.unit_price;
    const subtotal = quantity * unitPrice;
    const discountAmount = (subtotal * 0) / 100; // Item-level discount
    const taxable = subtotal - discountAmount;
    const taxAmount = (taxable * 12) / 100; // 12% GST
    const netAmount = taxable + taxAmount;

    const newItem: BillItem = {
      medicine_id: medicine.id,
      medicine_name: medicine.name,
      inventory_item_id: inventoryItem.id,
      batch_number: inventoryItem.batch_number,
      quantity,
      unit_price: unitPrice,
      discount_percentage: 0,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      net_amount: netAmount,
    };

    setBillItems([...billItems, newItem]);
    setShowMedicineModal(false);
    setSearchMedicine('');
    setInventoryItems([]);
  };

  const removeMedicineFromCart = (index: number) => {
    const newItems = [...billItems];
    newItems.splice(index, 1);
    setBillItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + item.subtotal, 0);
    const billDiscountAmount = (subtotal * billDiscount) / 100;
    const taxableAmount = subtotal - billDiscountAmount;
    const totalTax = billItems.reduce((sum, item) => sum + item.tax_amount, 0);
    const grandTotal = subtotal - billDiscountAmount + totalTax;

    return {
      subtotal,
      billDiscountAmount,
      taxableAmount,
      totalTax,
      grandTotal,
    };
  };

  const createBill = async () => {
    if (!selectedPatient) {
      alert('Please select a patient');
      return;
    }

    if (billItems.length === 0) {
      alert('Please add items to the bill');
      return;
    }

    try {
      setLoading(true);

      const billData: CreatePharmacyBillData = {
        patient_id: selectedPatient.id,
        bill_type: 'OPD',
        items: billItems.map((item) => ({
          medicine_id: item.medicine_id,
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage,
        })),
        discount_percentage: billDiscount,
        payment_mode: paymentMode,
        insurance_company: paymentMode === 'insurance' ? insuranceCompany : undefined,
        insurance_policy_number: paymentMode === 'insurance' ? insurancePolicyNumber : undefined,
        notes,
      };

      // Get current user ID (you may need to adjust this based on your auth setup)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const bill = await pharmacyService.createPharmacyBill(billData, user.id);

      alert(`Bill created successfully! Bill Number: ${bill.bill_number}`);

      // Reset form
      setSelectedPatient(null);
      setBillItems([]);
      setBillDiscount(0);
      setPaymentMode('cash');
      setInsuranceCompany('');
      setInsurancePolicyNumber('');
      setNotes('');
      setShowPreview(false);
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('Failed to create bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchPatient.toLowerCase()) ||
      patient.hospital_id.toLowerCase().includes(searchPatient.toLowerCase())
  );

  const filteredMedicines = medicines.filter((medicine) =>
    medicine.name.toLowerCase().includes(searchMedicine.toLowerCase())
  );

  const totals = calculateTotals();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Receipt className="w-8 h-8 text-[#0056B3]" />
          Pharmacy Billing
        </h1>
        <p className="text-gray-600 mt-1">Create bills for patients and manage payments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Selection */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
            {!selectedPatient ? (
              <Button
                onClick={() => setShowPatientModal(true)}
                className="w-full bg-[#0056B3] hover:bg-[#004494]"
              >
                <User className="w-4 h-4 mr-2" />
                Select Patient
              </Button>
            ) : (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-lg text-blue-900">{selectedPatient.name}</p>
                    <p className="text-sm text-blue-700">ID: {selectedPatient.hospital_id}</p>
                    {selectedPatient.contact_number && (
                      <p className="text-sm text-blue-700">
                        Contact: {selectedPatient.contact_number}
                      </p>
                    )}
                    {selectedPatient.age && (
                      <p className="text-sm text-blue-700">Age: {selectedPatient.age}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPatient(null)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Medicine Selection */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Bill Items</h2>
              <Button
                onClick={() => setShowMedicineModal(true)}
                size="sm"
                className="bg-[#0056B3] hover:bg-[#004494]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Medicine
              </Button>
            </div>

            {billItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>No items added yet</p>
                <p className="text-sm">Click "Add Medicine" to start</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Medicine
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Batch
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {billItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.medicine_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.batch_number}</td>
                        <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          ₹{item.unit_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          ₹{item.net_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeMedicineFromCart(index)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Bill Summary</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600">Discount</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={billDiscount}
                    onChange={(e) => setBillDiscount(Number(e.target.value))}
                    className="w-16 text-right"
                    min="0"
                    max="100"
                  />
                  <span>%</span>
                </div>
              </div>

              {billDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount Amount</span>
                  <span>-₹{totals.billDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (GST 12%)</span>
                <span className="font-medium">₹{totals.totalTax.toFixed(2)}</span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold text-[#0056B3]">
                  <span>Grand Total</span>
                  <span>₹{totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) =>
                      setPaymentMode(e.target.value as 'cash' | 'card' | 'upi' | 'insurance')
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="insurance">Insurance</option>
                  </select>
                </div>

                {paymentMode === 'insurance' && (
                  <>
                    <Input
                      placeholder="Insurance Company"
                      value={insuranceCompany}
                      onChange={(e) => setInsuranceCompany(e.target.value)}
                    />
                    <Input
                      placeholder="Policy Number"
                      value={insurancePolicyNumber}
                      onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                    />
                  </>
                )}

                <textarea
                  placeholder="Notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
                  rows={3}
                />
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  onClick={() => setShowPreview(true)}
                  disabled={billItems.length === 0 || !selectedPatient}
                  className="w-full bg-[#0056B3] hover:bg-[#004494]"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Preview & Save
                </Button>
                <Button variant="outline" className="w-full" disabled={billItems.length === 0}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Bill
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Patient Selection Modal */}
      <Modal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        title="Select Patient"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by name or hospital ID..."
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {patients.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 mb-2">No patients found</p>
                <p className="text-sm text-gray-500">
                  Please add patients in your Hospital CRM first
                </p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No patients match your search</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => selectPatient(patient)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                >
                  <p className="font-semibold text-gray-900">{patient.name}</p>
                  <p className="text-sm text-gray-600">ID: {patient.hospital_id}</p>
                  {patient.contact_number && (
                    <p className="text-sm text-gray-600">Contact: {patient.contact_number}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Medicine Selection Modal */}
      <Modal
        isOpen={showMedicineModal}
        onClose={() => {
          setShowMedicineModal(false);
          setInventoryItems([]);
          setSearchMedicine('');
        }}
        title="Add Medicine"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search medicine..."
              value={searchMedicine}
              onChange={(e) => setSearchMedicine(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {medicines.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 mb-2">No medicines found</p>
                <p className="text-sm text-gray-500">
                  Please add medicines in your Hospital CRM first
                </p>
              </div>
            ) : filteredMedicines.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No medicines match your search</p>
              </div>
            ) : (
              filteredMedicines.map((medicine) => (
                <div
                  key={medicine.id}
                  onClick={() => loadInventoryForMedicine(medicine.id)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{medicine.name}</p>
                    {medicine.generic_name && (
                      <p className="text-sm text-gray-600">{medicine.generic_name}</p>
                    )}
                    {medicine.strength && (
                      <p className="text-sm text-gray-600">Strength: {medicine.strength}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {medicine.is_high_alert && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        HIGH ALERT
                      </span>
                    )}
                    {medicine.is_lasa && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        LASA
                      </span>
                    )}
                  </div>
                </div>

                {/* Show inventory items if loaded */}
                {inventoryItems.length > 0 &&
                  inventoryItems[0]?.medicine_id === medicine.id && (
                    <div className="mt-3 space-y-2 border-t pt-3">
                      {inventoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white border border-gray-200 rounded p-3 hover:bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Batch: {item.batch_number}</p>
                              <p className="text-xs text-gray-600">
                                Available: {item.quantity} | Expiry:{' '}
                                {new Date(item.expiry_date).toLocaleDateString()}
                              </p>
                              <p className="text-sm font-semibold text-green-600 mt-1">
                                ₹{(item.selling_price || item.unit_price).toFixed(2)} per unit
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="Qty"
                                className="w-16"
                                min="1"
                                max={item.quantity}
                                onClick={(e) => e.stopPropagation()}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    const qty = parseInt((e.target as HTMLInputElement).value);
                                    if (qty > 0 && qty <= item.quantity) {
                                      addMedicineToCart(medicine, item, qty);
                                    }
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const qtyInput = (e.currentTarget
                                    .previousElementSibling as HTMLInputElement)?.value;
                                  const qty = parseInt(qtyInput || '1');
                                  if (qty > 0 && qty <= item.quantity) {
                                    addMedicineToCart(medicine, item, qty);
                                  } else {
                                    alert('Invalid quantity');
                                  }
                                }}
                                className="bg-[#0056B3] hover:bg-[#004494]"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Bill Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Bill Preview"
        size="large"
      >
        <div className="space-y-6">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#0056B3]">Pharmacy Bill</h2>
              <p className="text-sm text-gray-600">Hospital CRM Pro</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm font-semibold text-gray-700">Patient Information</p>
                <p className="text-sm">{selectedPatient?.name}</p>
                <p className="text-xs text-gray-600">ID: {selectedPatient?.hospital_id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">Bill Details</p>
                <p className="text-xs text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                <p className="text-xs text-gray-600">Payment: {paymentMode.toUpperCase()}</p>
              </div>
            </div>

            <table className="w-full mb-6">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold">Medicine</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold">Price</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {billItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm">{item.medicine_name}</td>
                    <td className="px-4 py-2 text-sm text-center">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{item.unit_price.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium">
                      ₹{item.net_amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              {billDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({billDiscount}%)</span>
                  <span>-₹{totals.billDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax (GST 12%)</span>
                <span>₹{totals.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-[#0056B3] border-t pt-2">
                <span>Grand Total</span>
                <span>₹{totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={createBill} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : 'Confirm & Save'}
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PharmacyBilling;
