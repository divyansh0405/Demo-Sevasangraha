import React, { useEffect, useState } from 'react';
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Pill,
  Zap,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import pharmacyService from '../../services/pharmacyService';
import type { PharmacyDashboardMetrics } from '../../types/pharmacy';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, color, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100',
  };

  return (
    <div
      onClick={onClick}
      className={`${colorClasses[color]} border-2 rounded-lg p-6 transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend && (
            <p className="text-xs mt-2 opacity-70">
              <TrendingUp className="inline w-3 h-3 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`${iconBgClasses[color]} p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
};

interface PharmacyDashboardProps {
  onNavigate?: (view: 'inventory' | 'orders' | 'billing' | 'reports') => void;
}

const PharmacyDashboard: React.FC<PharmacyDashboardProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<PharmacyDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await pharmacyService.getDashboardMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin text-[#0056B3] mx-auto mb-4" />
          <p className="text-gray-600">Loading pharmacy dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Pill className="w-8 h-8 text-[#0056B3]" />
              Pharmacy Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Monitor inventory, orders, and pharmacy operations</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadDashboardData} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-[#0056B3] hover:bg-[#004494]">
              <Package className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Medicines"
          value={metrics?.total_medicines || 0}
          icon={<Pill className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="Low Stock Items"
          value={metrics?.low_stock_items || 0}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
        />
        <MetricCard
          title="Expiring Soon"
          value={metrics?.expiring_soon || 0}
          icon={<Clock className="w-6 h-6" />}
          color="yellow"
        />
        <MetricCard
          title="Pending Orders"
          value={metrics?.pending_orders || 0}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Today's Dispenses"
          value={metrics?.today_dispenses || 0}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="Today's Revenue"
          value={`₹${(metrics?.today_revenue || 0).toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="High Alert Meds"
          value={metrics?.high_alert_meds || 0}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="red"
        />
        <MetricCard
          title="Crash Carts Ready"
          value={metrics?.crash_carts_ready || 0}
          icon={<Zap className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center border-2 hover:bg-blue-50 hover:border-[#0056B3]"
              onClick={() => onNavigate?.('inventory')}
            >
              <Package className="w-8 h-8 mb-2 text-[#0056B3]" />
              <span className="text-sm font-medium">Manage Inventory</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center border-2 hover:bg-blue-50 hover:border-[#0056B3]"
              onClick={() => onNavigate?.('orders')}
            >
              <ShoppingCart className="w-8 h-8 mb-2 text-[#0056B3]" />
              <span className="text-sm font-medium">New Prescription</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center border-2 hover:bg-blue-50 hover:border-[#0056B3]"
              onClick={() => onNavigate?.('billing')}
            >
              <DollarSign className="w-8 h-8 mb-2 text-[#0056B3]" />
              <span className="text-sm font-medium">Create Bill</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center border-2 hover:bg-blue-50 hover:border-[#0056B3]"
              onClick={() => onNavigate?.('reports')}
            >
              <Activity className="w-8 h-8 mb-2 text-[#0056B3]" />
              <span className="text-sm font-medium">View Reports</span>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Alerts & Notifications</h2>
          <div className="space-y-3">
            {metrics && metrics.low_stock_items > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Low Stock Alert</p>
                  <p className="text-sm text-red-700">
                    {metrics.low_stock_items} items below minimum reorder level
                  </p>
                </div>
              </div>
            )}
            {metrics && metrics.expiring_soon > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Expiry Warning</p>
                  <p className="text-sm text-yellow-700">
                    {metrics.expiring_soon} items expiring within 90 days
                  </p>
                </div>
              </div>
            )}
            {metrics && metrics.medication_errors_month > 0 && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <XCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900">Medication Errors</p>
                  <p className="text-sm text-orange-700">
                    {metrics.medication_errors_month} incidents reported this month
                  </p>
                </div>
              </div>
            )}
            {metrics &&
              metrics.low_stock_items === 0 &&
              metrics.expiring_soon === 0 &&
              metrics.medication_errors_month === 0 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">All Clear</p>
                    <p className="text-sm text-green-700">No critical alerts at this time</p>
                  </div>
                </div>
              )}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Activity log will be displayed here</p>
        </div>
      </Card>
    </div>
  );
};

export default PharmacyDashboard;
