import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  Briefcase,
  Download,
  RefreshCw,
  ChevronDown,
  UserCheck,
  BadgeCheck,
  Building2
} from 'lucide-react';
import { Button } from '../ui/Button';
import hrmService from '../../services/hrmService';
import type { EmployeeMaster, EmployeeFilters } from '../../types/hrm';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onAddEmployee: () => void;
  onEditEmployee: (employeeId: string) => void;
  onViewProfile?: (employeeId: string) => void;
}

const EmployeeList: React.FC<Props> = ({ onAddEmployee, onEditEmployee, onViewProfile }) => {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<EmployeeFilters>({
    is_active: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeMaster | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  // Fetch employees
  const { data: employees, isLoading, refetch } = useQuery({
    queryKey: ['employee-masters', filters],
    queryFn: () => hrmService.getEmployeeMasters(filters),
  });

  // Fetch departments for filters
  const { data: departments } = useQuery({
    queryKey: ['employee-departments'],
    queryFn: () => hrmService.getDepartments(),
  });

  // Filter employees based on search term (client-side for now)
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    if (!searchTerm) return employees;

    const term = searchTerm.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.first_name.toLowerCase().includes(term) ||
        emp.last_name.toLowerCase().includes(term) ||
        emp.staff_unique_id.toLowerCase().includes(term) ||
        emp.work_email?.toLowerCase().includes(term) ||
        emp.personal_phone?.toLowerCase().includes(term) ||
        emp.job_title.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  const handleDeactivateEmployee = async (employeeId: string) => {
    if (!hasPermission('hrm.employee.delete')) {
      toast.error('You do not have permission to deactivate employees');
      return;
    }

    if (!confirm('Are you sure you want to deactivate this employee?')) return;

    try {
      await hrmService.updateEmployeeMaster(employeeId, { employment_status: 'Inactive' });
      toast.success('Employee deactivated successfully');
      refetch();
    } catch (error) {
      console.error('Error deactivating employee:', error);
      toast.error('Failed to deactivate employee');
    }
  };

  const handleViewEmployee = (employee: EmployeeMaster) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
  };

  const exportToCSV = () => {
    if (!filteredEmployees || filteredEmployees.length === 0) {
      toast.error('No employees to export');
      return;
    }

    const headers = [
      'Staff ID',
      'Name',
      'Email',
      'Phone',
      'Department',
      'Job Title',
      'Joining Date',
      'Status',
    ];

    const csvData = filteredEmployees.map((emp) => [
      emp.staff_unique_id,
      `${emp.first_name} ${emp.last_name}`,
      emp.work_email,
      emp.personal_phone,
      emp.department?.department_name || '',
      emp.job_title,
      emp.date_of_joining,
      emp.employment_status,
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('Employee list exported successfully');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Employee Master</h2>
          <p className="text-gray-500 mt-1 flex items-center text-sm">
            <UserCheck className="w-4 h-4 mr-1.5 text-green-500" />
            {filteredEmployees?.length || 0} active employee(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {hasPermission('hrm.employee.create') && (
            <Button
              onClick={onAddEmployee}
              className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200 hover:shadow-primary-300 transition-all transform hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, ID, email, or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 border rounded-lg flex items-center gap-2 transition-all ${showFilters
              ? 'bg-primary-50 border-primary-200 text-primary-700'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''
                }`}
            />
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
            {/* Department Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Department
              </label>
              <select
                value={filters.department_id || ''}
                onChange={(e) =>
                  setFilters({ ...filters, department_id: e.target.value || undefined })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-sm"
              >
                <option value="">All Departments</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Employment Type Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Employment Status
              </label>
              <select
                value={filters.employment_type || ''}
                onChange={(e) =>
                  setFilters({ ...filters, employment_type: e.target.value || undefined })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="Permanent">Permanent</option>
                <option value="Contractual">Contractual</option>
                <option value="Trainee">Trainee</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Active Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Active State
              </label>
              <select
                value={filters.is_active === undefined ? '' : filters.is_active.toString()}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    is_active: e.target.value === '' ? undefined : e.target.value === 'true',
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-sm"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading employees...</p>
          </div>
        ) : filteredEmployees && filteredEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Role & Dept
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-primary-700 font-bold shadow-sm">
                          {employee.first_name[0]}
                          {employee.last_name[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5 bg-gray-100 px-1.5 py-0.5 rounded inline-block">
                            {employee.staff_unique_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 flex items-center mb-1">
                        <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                        {employee.work_email}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                        {employee.personal_phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        <Briefcase className="w-3.5 h-3.5 mr-2 text-gray-400" />
                        {employee.job_title}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1 ml-5.5">
                        <Building2 className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {employee.department?.department_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${employee.employment_status === 'Active' || employee.employment_status === 'Permanent'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                        {employee.employment_status === 'Permanent' && <BadgeCheck className="w-3 h-3 mr-1 mt-0.5" />}
                        {employee.employment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleViewEmployee(employee)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Quick View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {onViewProfile && (
                          <button
                            onClick={() => onViewProfile(employee.id)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Full Profile"
                          >
                            <Briefcase className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('hrm.employee.edit') && (
                          <button
                            onClick={() => onEditEmployee(employee.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {employee.is_active && hasPermission('hrm.employee.delete') && (
                          <button
                            onClick={() => handleDeactivateEmployee(employee.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Deactivate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center bg-gray-50/50">
            <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
              <Briefcase className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {searchTerm || Object.keys(filters).length > 1
                ? 'We couldn\'t find any employees matching your search. Try adjusting filters.'
                : 'Get started by adding your first employee to the system.'}
            </p>
            {!searchTerm && Object.keys(filters).length <= 1 && hasPermission('hrm.employee.create') && (
              <Button onClick={onAddEmployee} className="bg-primary-600 hover:bg-primary-700 text-white shadow-md">
                <UserPlus className="w-4 h-4 mr-2" />
                Add First Employee
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Employee Details Modal */}
      {showEmployeeModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start sticky top-0 bg-white z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-lg">
                  {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono">{selectedEmployee.staff_unique_id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Contact Section */}
              <section>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                  <Mail className="w-3 h-3 mr-2" /> Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Email Address</label>
                    <p className="text-gray-900 font-medium">{selectedEmployee.work_email || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Phone Number</label>
                    <p className="text-gray-900 font-medium">{selectedEmployee.personal_phone || 'N/A'}</p>
                  </div>
                  <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Residential Address</label>
                    <p className="text-gray-900 font-medium">{selectedEmployee.residential_address || 'N/A'}</p>
                  </div>
                </div>
              </section>

              {/* Professional Section */}
              <section>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                  <Briefcase className="w-3 h-3 mr-2" /> Professional Details
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Department</label>
                    <p className="text-gray-900 font-medium">{selectedEmployee.department?.department_name || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Job Title</label>
                    <p className="text-gray-900 font-medium">{selectedEmployee.job_title || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Employment Status</label>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${selectedEmployee.employment_status === 'Permanent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {selectedEmployee.employment_status || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Joining Date</label>
                    <p className="text-gray-900 font-medium">
                      {format(new Date(selectedEmployee.date_of_joining), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 sticky bottom-0">
              <Button
                onClick={() => setShowEmployeeModal(false)}
                variant="outline"
                className="border-gray-300 hover:bg-white"
              >
                Close
              </Button>
              {hasPermission('hrm.employee.edit') && (
                <Button
                  onClick={() => {
                    setShowEmployeeModal(false);
                    onEditEmployee(selectedEmployee.id);
                  }}
                  className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Employee
                </Button>
              )}
              {onViewProfile && (
                <Button
                  onClick={() => {
                    setShowEmployeeModal(false);
                    onViewProfile(selectedEmployee.id);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  View Full Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
