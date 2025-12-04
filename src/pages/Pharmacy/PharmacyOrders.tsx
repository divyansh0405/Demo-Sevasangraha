import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Package,
  User,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import pharmacyService from '../../services/pharmacyService';
import type { PharmacyOrder, CreatePharmacyOrderData } from '../../types/pharmacy';

const PharmacyOrders: React.FC = () => {
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [orderForm, setOrderForm] = useState({
    medicine_id: '',
    quantity: '',
    urgency: 'routine' as 'routine' | 'urgent' | 'emergency',
    expected_delivery_date: '',
    notes: '',
  });
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, medsData] = await Promise.all([
        pharmacyService.getPharmacyOrders(filterStatus as any),
        pharmacyService.getMedicines(),
      ]);
      setOrders(ordersData);
      setMedicines(medsData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.medicine?.name.toLowerCase().includes(searchLower) ||
      order.order_number.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateOrder = async () => {
    try {
      if (!orderForm.medicine_id || !orderForm.quantity) {
        alert('Please fill all required fields');
        return;
      }

      setCreatingOrder(true);

      const orderData: CreatePharmacyOrderData = {
        medicine_id: orderForm.medicine_id,
        quantity: parseInt(orderForm.quantity),
        urgency: orderForm.urgency,
        expected_delivery_date: orderForm.expected_delivery_date || undefined,
        notes: orderForm.notes || undefined,
      };

      await pharmacyService.createPharmacyOrder(orderData);

      alert('Order created successfully!');
      setShowCreateModal(false);

      // Reset form
      setOrderForm({
        medicine_id: '',
        quantity: '',
        urgency: 'routine',
        expected_delivery_date: '',
        notes: '',
      });

      // Reload orders
      loadData();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await pharmacyService.updatePharmacyOrderStatus(orderId, status as any);
      alert('Order status updated successfully!');
      loadData();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      ordered: { color: 'bg-purple-100 text-purple-800', icon: ShoppingCart },
      received: { color: 'bg-green-100 text-green-800', icon: Package },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const badges = {
      routine: { color: 'bg-gray-100 text-gray-800' },
      urgent: { color: 'bg-orange-100 text-orange-800' },
      emergency: { color: 'bg-red-100 text-red-800' },
    };

    const badge = badges[urgency as keyof typeof badges] || badges.routine;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {urgency.toUpperCase()}
      </span>
    );
  };

  const exportToCSV = () => {
    try {
      const headers = [
        'Order Number',
        'Medicine Name',
        'Quantity',
        'Urgency',
        'Status',
        'Expected Delivery',
        'Ordered Date',
      ];

      const rows = filteredOrders.map((order) => [
        order.order_number,
        order.medicine?.name || '',
        order.quantity_requested,
        order.urgency,
        order.status,
        order.expected_delivery_date || '',
        new Date(order.created_at).toLocaleDateString(),
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pharmacy_orders_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Failed to export orders.');
    }
  };

  // Summary counts
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const approvedCount = orders.filter((o) => o.status === 'approved').length;
  const orderedCount = orders.filter((o) => o.status === 'ordered').length;
  const receivedCount = orders.filter((o) => o.status === 'received').length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-[#0056B3]" />
              Pharmacy Orders
            </h1>
            <p className="text-gray-600 mt-1">Manage purchase orders and requisitions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateModal(true)} className="bg-[#0056B3] hover:bg-[#004494]">
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-blue-600">{approvedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ordered</p>
              <p className="text-2xl font-bold text-purple-600">{orderedCount}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Received</p>
              <p className="text-2xl font-bold text-green-600">{receivedCount}</p>
            </div>
            <Package className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <Button variant="outline" onClick={loadData}>
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056B3] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medicine
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Delivery
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{order.order_number}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.medicine?.name}</p>
                        {order.medicine?.generic_name && (
                          <p className="text-xs text-gray-500">{order.medicine.generic_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <p className="text-sm font-bold text-gray-900">{order.quantity_requested}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getUrgencyBadge(order.urgency)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">
                        {order.expected_delivery_date
                          ? new Date(order.expected_delivery_date).toLocaleDateString()
                          : 'Not specified'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-1 justify-end">
                        {order.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {order.status === 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order.id, 'ordered')}
                          >
                            Mark Ordered
                          </Button>
                        )}
                        {order.status === 'ordered' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order.id, 'received')}
                          >
                            Mark Received
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Order Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Order">
        <div className="space-y-4">
          {/* Medicine Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medicine <span className="text-red-500">*</span>
            </label>
            <select
              value={orderForm.medicine_id}
              onChange={(e) => setOrderForm({ ...orderForm, medicine_id: e.target.value })}
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

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={orderForm.quantity}
              onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
              placeholder="0"
              min="1"
              required
            />
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
            <select
              value={orderForm.urgency}
              onChange={(e) =>
                setOrderForm({ ...orderForm, urgency: e.target.value as 'routine' | 'urgent' | 'emergency' })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          {/* Expected Delivery Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
            <Input
              type="date"
              value={orderForm.expected_delivery_date}
              onChange={(e) => setOrderForm({ ...orderForm, expected_delivery_date: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={orderForm.notes}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              placeholder="Additional notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={creatingOrder}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={creatingOrder}
              className="bg-[#0056B3] hover:bg-[#004494]"
            >
              {creatingOrder ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PharmacyOrders;
