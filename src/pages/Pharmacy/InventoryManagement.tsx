import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  Filter,
  Download,
  Barcode,
  Edit,
  TrendingDown,
  CheckCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import pharmacyService from '../../services/pharmacyService';
import type { PharmacyInventoryItem, PharmacyLocation, CreateInventoryItemData } from '../../types/pharmacy';

const InventoryManagement: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<PharmacyInventoryItem[]>([]);
  const [locations, setLocations] = useState<PharmacyLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'all' | 'low-stock' | 'expiring'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [addStockForm, setAddStockForm] = useState({
    medicine_id: '',
    batch_number: '',
    lot_number: '',
    quantity: '',
    unit_price: '',
    selling_price: '',
    expiry_date: '',
    location_id: '',
    min_reorder_level: '',
    max_stock_level: '',
    manufacturer: '',
    supplier: '',
    received_date: new Date().toISOString().split('T')[0],
  });
  const [addingStock, setAddingStock] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterLocation, filterStatus, viewMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [items, locs, meds] = await Promise.all([
        loadInventory(),
        pharmacyService.getPharmacyLocations(),
        pharmacyService.getMedicines(),
      ]);
      setLocations(locs);
      setMedicines(meds);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    if (viewMode === 'low-stock') {
      const items = await pharmacyService.getLowStockItems();
      setInventoryItems(items);
      return items;
    } else if (viewMode === 'expiring') {
      const items = await pharmacyService.getExpiringSoonItems(90);
      setInventoryItems(items);
      return items;
    } else {
      const items = await pharmacyService.getInventoryItems({
        location_id: filterLocation || undefined,
        status: filterStatus as any || undefined,
      });
      setInventoryItems(items);
      return items;
    }
  };

  const filteredItems = inventoryItems.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.medicine?.name.toLowerCase().includes(searchLower) ||
      item.batch_number.toLowerCase().includes(searchLower) ||
      item.medicine?.generic_name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      available: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      quarantined: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      recalled: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      expired: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      damaged: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    };

    const badge = badges[status as keyof typeof badges] || badges.available;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </span>
    );
  };

  const getDaysToExpiry = (expiryDate: string) => {
    const days = Math.floor(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const getExpiryBadge = (expiryDate: string) => {
    const days = getDaysToExpiry(expiryDate);

    if (days < 0) {
      return <span className="text-xs font-medium text-red-600">EXPIRED</span>;
    } else if (days <= 30) {
      return <span className="text-xs font-medium text-red-600">{days} days</span>;
    } else if (days <= 60) {
      return <span className="text-xs font-medium text-orange-600">{days} days</span>;
    } else if (days <= 90) {
      return <span className="text-xs font-medium text-yellow-600">{days} days</span>;
    } else {
      return <span className="text-xs font-medium text-gray-600">{days} days</span>;
    }
  };

  const handleAddStock = async () => {
    try {
      // Validate required fields
      if (!addStockForm.medicine_id || !addStockForm.batch_number || !addStockForm.quantity ||
          !addStockForm.unit_price || !addStockForm.expiry_date || !addStockForm.location_id) {
        alert('Please fill all required fields');
        return;
      }

      setAddingStock(true);

      const stockData: CreateInventoryItemData = {
        medicine_id: addStockForm.medicine_id,
        batch_number: addStockForm.batch_number,
        lot_number: addStockForm.lot_number || undefined,
        quantity: parseInt(addStockForm.quantity),
        unit_price: parseFloat(addStockForm.unit_price),
        selling_price: addStockForm.selling_price ? parseFloat(addStockForm.selling_price) : undefined,
        expiry_date: addStockForm.expiry_date,
        location_id: addStockForm.location_id,
        min_reorder_level: addStockForm.min_reorder_level ? parseInt(addStockForm.min_reorder_level) : undefined,
        max_stock_level: addStockForm.max_stock_level ? parseInt(addStockForm.max_stock_level) : undefined,
        manufacturer: addStockForm.manufacturer || undefined,
        supplier: addStockForm.supplier || undefined,
        received_date: addStockForm.received_date || undefined,
      };

      await pharmacyService.addInventoryItem(stockData);

      alert('Stock added successfully!');
      setShowAddModal(false);

      // Reset form
      setAddStockForm({
        medicine_id: '',
        batch_number: '',
        lot_number: '',
        quantity: '',
        unit_price: '',
        selling_price: '',
        expiry_date: '',
        location_id: '',
        min_reorder_level: '',
        max_stock_level: '',
        manufacturer: '',
        supplier: '',
        received_date: new Date().toISOString().split('T')[0],
      });

      // Reload inventory
      loadData();
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock. Please try again.');
    } finally {
      setAddingStock(false);
    }
  };

  const exportToExcel = () => {
    try {
      // Create CSV content
      const headers = [
        'Medicine Name',
        'Generic Name',
        'Batch Number',
        'Lot Number',
        'Location',
        'Quantity',
        'Unit Price',
        'Selling Price',
        'Total Value',
        'Min Reorder Level',
        'Expiry Date',
        'Days to Expiry',
        'Status',
      ];

      const rows = filteredItems.map((item) => [
        item.medicine?.name || '',
        item.medicine?.generic_name || '',
        item.batch_number,
        item.lot_number || '',
        item.location?.name || '',
        item.quantity,
        item.unit_price.toFixed(2),
        (item.selling_price || item.unit_price).toFixed(2),
        (item.quantity * item.unit_price).toFixed(2),
        item.min_reorder_level,
        new Date(item.expiry_date).toLocaleDateString(),
        getDaysToExpiry(item.expiry_date),
        item.status,
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pharmacy_inventory_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Failed to export inventory. Please try again.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-[#0056B3]" />
              Inventory Management
            </h1>
            <p className="text-gray-600 mt-1">Track and manage pharmacy stock</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowAddModal(true)} className="bg-[#0056B3] hover:bg-[#004494]">
              <Plus className="w-4 h-4 mr-2" />
              Add Stock
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card
          className={`p-4 cursor-pointer transition-all ${
            viewMode === 'all' ? 'border-2 border-[#0056B3] bg-blue-50' : 'hover:shadow-md'
          }`}
          onClick={() => setViewMode('all')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{inventoryItems.length}</p>
            </div>
            <Package className="w-8 h-8 text-[#0056B3]" />
          </div>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all ${
            viewMode === 'low-stock' ? 'border-2 border-red-500 bg-red-50' : 'hover:shadow-md'
          }`}
          onClick={() => setViewMode('low-stock')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {inventoryItems.filter((item) => item.quantity <= item.min_reorder_level).length}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all ${
            viewMode === 'expiring' ? 'border-2 border-yellow-500 bg-yellow-50' : 'hover:shadow-md'
          }`}
          onClick={() => setViewMode('expiring')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">
                {
                  inventoryItems.filter((item) => {
                    const days = getDaysToExpiry(item.expiry_date);
                    return days >= 0 && days <= 90;
                  }).length
                }
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-green-600">
                ₹
                {inventoryItems
                  .reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
                  .toLocaleString()}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="quarantined">Quarantined</option>
            <option value="recalled">Recalled</option>
            <option value="expired">Expired</option>
            <option value="damaged">Damaged</option>
          </select>

          <Button variant="outline" onClick={loadData}>
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056B3] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inventory...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No inventory items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medicine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch / Lot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{item.medicine?.name}</p>
                          {item.medicine?.is_high_alert && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              HIGH ALERT
                            </span>
                          )}
                        </div>
                        {item.medicine?.generic_name && (
                          <p className="text-xs text-gray-500">{item.medicine.generic_name}</p>
                        )}
                        {item.medicine?.strength && (
                          <p className="text-xs text-gray-500">{item.medicine.strength}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{item.batch_number}</p>
                        {item.lot_number && <p className="text-xs text-gray-500">Lot: {item.lot_number}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{item.location?.name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm">
                        <p
                          className={`font-bold ${
                            item.quantity <= item.min_reorder_level ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {item.quantity}
                        </p>
                        <p className="text-xs text-gray-500">Min: {item.min_reorder_level}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          ₹{(item.selling_price || item.unit_price).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">Total: ₹{(item.quantity * item.unit_price).toFixed(2)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="text-gray-900">{new Date(item.expiry_date).toLocaleDateString()}</p>
                        {getExpiryBadge(item.expiry_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Stock Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Stock">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Medicine Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medicine <span className="text-red-500">*</span>
            </label>
            <select
              value={addStockForm.medicine_id}
              onChange={(e) => setAddStockForm({ ...addStockForm, medicine_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
              required
            >
              <option value="">Select Medicine</option>
              {medicines.map((med) => (
                <option key={med.id} value={med.id}>
                  {med.name} {med.generic_name ? `(${med.generic_name})` : ''} - {med.strength}
                </option>
              ))}
            </select>
          </div>

          {/* Batch and Lot Numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Number <span className="text-red-500">*</span>
              </label>
              <Input
                value={addStockForm.batch_number}
                onChange={(e) => setAddStockForm({ ...addStockForm, batch_number: e.target.value })}
                placeholder="e.g., BATCH001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number</label>
              <Input
                value={addStockForm.lot_number}
                onChange={(e) => setAddStockForm({ ...addStockForm, lot_number: e.target.value })}
                placeholder="e.g., LOT001"
              />
            </div>
          </div>

          {/* Quantity and Reorder Levels */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={addStockForm.quantity}
                onChange={(e) => setAddStockForm({ ...addStockForm, quantity: e.target.value })}
                placeholder="0"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Reorder Level</label>
              <Input
                type="number"
                value={addStockForm.min_reorder_level}
                onChange={(e) => setAddStockForm({ ...addStockForm, min_reorder_level: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock Level</label>
              <Input
                type="number"
                value={addStockForm.max_stock_level}
                onChange={(e) => setAddStockForm({ ...addStockForm, max_stock_level: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (Purchase) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                value={addStockForm.unit_price}
                onChange={(e) => setAddStockForm({ ...addStockForm, unit_price: e.target.value })}
                placeholder="0.00"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (MRP)</label>
              <Input
                type="number"
                step="0.01"
                value={addStockForm.selling_price}
                onChange={(e) => setAddStockForm({ ...addStockForm, selling_price: e.target.value })}
                placeholder="0.00"
                min="0"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={addStockForm.expiry_date}
                onChange={(e) => setAddStockForm({ ...addStockForm, expiry_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
              <Input
                type="date"
                value={addStockForm.received_date}
                onChange={(e) => setAddStockForm({ ...addStockForm, received_date: e.target.value })}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Storage Location <span className="text-red-500">*</span>
            </label>
            <select
              value={addStockForm.location_id}
              onChange={(e) => setAddStockForm({ ...addStockForm, location_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
              required
            >
              <option value="">Select Location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} - {loc.type}
                </option>
              ))}
            </select>
          </div>

          {/* Manufacturer and Supplier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <Input
                value={addStockForm.manufacturer}
                onChange={(e) => setAddStockForm({ ...addStockForm, manufacturer: e.target.value })}
                placeholder="e.g., XYZ Pharma"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <Input
                value={addStockForm.supplier}
                onChange={(e) => setAddStockForm({ ...addStockForm, supplier: e.target.value })}
                placeholder="e.g., ABC Distributors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={addingStock}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddStock}
              disabled={addingStock}
              className="bg-[#0056B3] hover:bg-[#004494]"
            >
              {addingStock ? 'Adding...' : 'Add Stock'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryManagement;
