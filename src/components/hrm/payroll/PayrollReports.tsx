import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, DollarSign } from 'lucide-react';
import { Button } from '../../ui/Button';
import hrmService from '../../../services/hrmService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PayrollReports: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Fetch Payroll Data for the selected period
    // In a real app, we might have a specific report endpoint. 
    // Here we'll fetch all payroll records for the cycle and process client-side for demo.
    const { data: payrolls, isLoading } = useQuery({
        queryKey: ['payroll-reports', selectedMonth, selectedYear],
        queryFn: async () => {
            // 1. Find the cycle ID
            const cycles = await hrmService.getPayrollCycles();
            const cycle = cycles.find(c => c.month === selectedMonth && c.year === selectedYear);
            if (!cycle) return [];

            // 2. Fetch payrolls for that cycle
            return hrmService.getEmployeePayrolls(cycle.id);
        },
    });

    const generatePayslip = async (payrollId: string) => {
        try {
            const data = await hrmService.generatePayslipData(payrollId);
            // In a real app, this would generate a PDF. 
            // For now, we'll just show a success toast and log the data.
            console.log('Payslip Data:', data);
            toast.success(`Payslip generated for ${data.employee.first_name}`);
        } catch (error) {
            toast.error('Failed to generate payslip');
        }
    };

    const exportBankTransfer = () => {
        if (!payrolls || payrolls.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = [
            'Employee ID',
            'Name',
            'Bank Name',
            'Account Number',
            'IFSC Code',
            'Net Salary',
            'Payment Date'
        ];

        const csvData = payrolls.map(p => [
            p.employee?.staff_unique_id,
            `${p.employee?.first_name} ${p.employee?.last_name}`,
            p.employee?.bank_account_number || 'N/A', // Assuming these fields exist on employee object joined
            'N/A', // Account number might be in a different field or need joining
            'N/A', // IFSC
            p.net_salary,
            format(new Date(), 'yyyy-MM-dd')
        ]);

        const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bank_transfer_${selectedYear}_${selectedMonth}.csv`;
        a.click();
        toast.success('Bank transfer report exported');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Payroll Reports</h2>
                    <p className="text-gray-600">Generate payslips and bank transfer files</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="p-2 border rounded-md"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{format(new Date(2024, i, 1), 'MMMM')}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="p-2 border rounded-md"
                    >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bank Transfer Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Bank Transfer Report</h3>
                            <p className="text-sm text-gray-500">Export CSV for bank processing</p>
                        </div>
                    </div>
                    <Button onClick={exportBankTransfer} className="w-full" variant="outline">
                        <Download className="w-4 h-4 mr-2" /> Download CSV
                    </Button>
                </div>

                {/* Statutory Reports Card (Placeholder) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Statutory Reports</h3>
                            <p className="text-sm text-gray-500">PF, ESI, and TDS Challans</p>
                        </div>
                    </div>
                    <Button disabled className="w-full" variant="outline">
                        Coming Soon
                    </Button>
                </div>
            </div>

            {/* Payslip List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900">Employee Payslips</h3>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Employee</th>
                            <th className="px-6 py-3">Net Salary</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrolls?.map((payroll) => (
                            <tr key={payroll.id} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">
                                    {payroll.employee?.first_name} {payroll.employee?.last_name}
                                    <div className="text-xs text-gray-500">{payroll.employee?.staff_unique_id}</div>
                                </td>
                                <td className="px-6 py-4">₹{payroll.net_salary.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${payroll.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {payroll.payment_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button size="sm" variant="ghost" onClick={() => generatePayslip(payroll.id)}>
                                        <Download className="w-4 h-4 mr-2" /> Payslip
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {(!payrolls || payrolls.length === 0) && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    No payroll records found for this period.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PayrollReports;
