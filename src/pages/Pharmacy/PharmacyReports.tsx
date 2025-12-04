import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  Users,
  AlertTriangle,
  BarChart as BarChartIcon,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import pharmacyService from '../../services/pharmacyService';

type ReportType =
  | 'inventory'
  | 'sales'
  | 'expiring'
  | 'low-stock'
  | 'orders'
  | 'patient-medications'
  | 'revenue';

const PharmacyReports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('inventory');
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    {
      id: 'inventory' as ReportType,
      name: 'Inventory Report',
      description: 'Complete stock overview',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'sales' as ReportType,
      name: 'Sales Report',
      description: 'Revenue and transactions',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'expiring' as ReportType,
      name: 'Expiring Items',
      description: 'Medicines near expiry',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      id: 'low-stock' as ReportType,
      name: 'Low Stock Alert',
      description: 'Items below reorder level',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'orders' as ReportType,
      name: 'Purchase Orders',
      description: 'Order history and status',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'patient-medications' as ReportType,
      name: 'Patient Medications',
      description: 'Dispensed medications',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      id: 'revenue' as ReportType,
      name: 'Revenue Analysis',
      description: 'Financial performance',
      icon: BarChartIcon,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
  ];

  useEffect(() => {
    if (selectedReport) {
      generateReport();
    }
  }, [selectedReport]);

  const generateReport = async () => {
    try {
      setLoading(true);
      let data = null;

      switch (selectedReport) {
        case 'inventory':
          data = await pharmacyService.getInventoryItems({});
          break;
        case 'expiring':
          data = await pharmacyService.getExpiringSoonItems(90);
          break;
        case 'low-stock':
          data = await pharmacyService.getLowStockItems();
          break;
        case 'orders':
          data = await pharmacyService.getPharmacyOrders();
          break;
        // Add other report types as needed
        default:
          data = [];
      }

      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    try {
      if (!reportData || reportData.length === 0) {
        alert('No data to export');
        return;
      }

      let headers: string[] = [];
      let rows: any[] = [];

      switch (selectedReport) {
        case 'inventory':
          headers = [
            'Medicine Name',
            'Generic Name',
            'Batch Number',
            'Quantity',
            'Unit Price',
            'Total Value',
            'Location',
            'Expiry Date',
            'Status',
          ];
          rows = reportData.map((item: any) => [
            item.medicine?.name || '',
            item.medicine?.generic_name || '',
            item.batch_number,
            item.quantity,
            item.unit_price.toFixed(2),
            (item.quantity * item.unit_price).toFixed(2),
            item.location?.name || '',
            new Date(item.expiry_date).toLocaleDateString(),
            item.status,
          ]);
          break;

        case 'expiring':
        case 'low-stock':
          headers = [
            'Medicine Name',
            'Generic Name',
            'Batch Number',
            'Quantity',
            'Location',
            'Expiry Date',
            'Days to Expiry',
          ];
          rows = reportData.map((item: any) => {
            const daysToExpiry = Math.floor(
              (new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            return [
              item.medicine?.name || '',
              item.medicine?.generic_name || '',
              item.batch_number,
              item.quantity,
              item.location?.name || '',
              new Date(item.expiry_date).toLocaleDateString(),
              daysToExpiry,
            ];
          });
          break;

        case 'orders':
          headers = [
            'Order Number',
            'Medicine Name',
            'Quantity',
            'Urgency',
            'Status',
            'Expected Delivery',
            'Created Date',
          ];
          rows = reportData.map((order: any) => [
            order.order_number,
            order.medicine?.name || '',
            order.quantity_requested,
            order.urgency,
            order.status,
            order.expected_delivery_date || 'N/A',
            new Date(order.created_at).toLocaleDateString(),
          ]);
          break;

        default:
          headers = ['Data'];
          rows = reportData.map((item: any) => [JSON.stringify(item)]);
      }

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `pharmacy_${selectedReport}_report_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report.');
    }
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056B3] mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating report...</p>
        </div>
      );
    }

    if (!reportData || reportData.length === 0) {
      return (
        <div className="p-12 text-center text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>No data available for this report</p>
        </div>
      );
    }

    // Summary statistics
    let summaryStats = null;

    switch (selectedReport) {
      case 'inventory':
        const totalItems = reportData.length;
        const totalQuantity = reportData.reduce((sum: number, item: any) => sum + item.quantity, 0);
        const totalValue = reportData.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0);
        summaryStats = (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Total Quantity</p>
              <p className="text-2xl font-bold text-blue-600">{totalQuantity}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-green-600">₹{totalValue.toFixed(2)}</p>
            </Card>
          </div>
        );
        break;

      case 'expiring':
        const expired = reportData.filter((item: any) => {
          const days = Math.floor(
            (new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          return days < 0;
        }).length;
        const expiringSoon = reportData.filter((item: any) => {
          const days = Math.floor(
            (new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          return days >= 0 && days <= 30;
        }).length;
        summaryStats = (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-red-600">{expired}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Expiring in 30 Days</p>
              <p className="text-2xl font-bold text-orange-600">{expiringSoon}</p>
            </Card>
          </div>
        );
        break;

      case 'low-stock':
        summaryStats = (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{reportData.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Requires Immediate Action</p>
              <p className="text-2xl font-bold text-orange-600">
                {reportData.filter((item: any) => item.quantity === 0).length}
              </p>
            </Card>
          </div>
        );
        break;

      case 'orders':
        const pending = reportData.filter((o: any) => o.status === 'pending').length;
        const approved = reportData.filter((o: any) => o.status === 'approved').length;
        const received = reportData.filter((o: any) => o.status === 'received').length;
        summaryStats = (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pending}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-blue-600">{approved}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Received</p>
              <p className="text-2xl font-bold text-green-600">{received}</p>
            </Card>
          </div>
        );
        break;
    }

    return (
      <div>
        {summaryStats}
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-2">
            Showing {reportData.length} record{reportData.length !== 1 ? 's' : ''}
          </p>
          <p className="text-gray-500 text-xs">Export this report to view detailed data in CSV format</p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#0056B3]" />
              Pharmacy Reports
            </h1>
            <p className="text-gray-600 mt-1">Analytics and reporting dashboard</p>
          </div>
          <Button onClick={exportReport} className="bg-[#0056B3] hover:bg-[#004494]">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Button onClick={generateReport} variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Apply Date Range
          </Button>
        </div>
      </Card>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isSelected = selectedReport === report.id;

          return (
            <Card
              key={report.id}
              className={`p-4 cursor-pointer transition-all ${
                isSelected ? 'border-2 border-[#0056B3] bg-blue-50' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <div className={`${report.bgColor} rounded-lg p-3 mb-3 inline-block`}>
                <Icon className={`w-6 h-6 ${report.color}`} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{report.name}</h3>
              <p className="text-xs text-gray-500">{report.description}</p>
            </Card>
          );
        })}
      </div>

      {/* Report Content */}
      <div>{renderReportContent()}</div>
    </div>
  );
};

export default PharmacyReports;
