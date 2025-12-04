import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Activity,
  FileText,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import PharmacyDashboard from './PharmacyDashboard';
import InventoryManagement from './InventoryManagement';
import PharmacyBilling from './PharmacyBilling';
import PharmacyOrders from './PharmacyOrders';
import PharmacyReports from './PharmacyReports';
import PharmacySettings from './PharmacySettings';

type PharmacyView = 'dashboard' | 'inventory' | 'billing' | 'orders' | 'reports' | 'settings';

const PharmacyModule: React.FC = () => {
  const [activeView, setActiveView] = useState<PharmacyView>('dashboard');

  const menuItems = [
    { id: 'dashboard' as PharmacyView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory' as PharmacyView, label: 'Inventory', icon: Package },
    { id: 'billing' as PharmacyView, label: 'Billing', icon: Receipt },
    { id: 'orders' as PharmacyView, label: 'Orders', icon: ShoppingCart },
    { id: 'reports' as PharmacyView, label: 'Reports', icon: FileText },
    { id: 'settings' as PharmacyView, label: 'Settings', icon: Settings },
  ];

  const handleNavigate = (view: PharmacyView) => {
    setActiveView(view);
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <PharmacyDashboard onNavigate={handleNavigate} />;
      case 'inventory':
        return <InventoryManagement />;
      case 'billing':
        return <PharmacyBilling />;
      case 'orders':
        return <PharmacyOrders />;
      case 'reports':
        return <PharmacyReports />;
      case 'settings':
        return <PharmacySettings />;
      default:
        return <PharmacyDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-[#0056B3] flex items-center gap-2">
            <Activity className="w-7 h-7" />
            Pharmacy
          </h1>
          <p className="text-xs text-gray-500 mt-1">Hospital CRM Pro</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-[#0056B3] text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white w-64">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-yellow-900">Quick Alert</p>
                <p className="text-xs text-yellow-700 mt-1">Check low stock items</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{renderView()}</main>
    </div>
  );
};

export default PharmacyModule;
