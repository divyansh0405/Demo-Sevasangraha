import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Play, FileText, Download, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import hrmService from '../../../services/hrmService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Props {
    onViewReports?: () => void;
}

const PayrollDashboard: React.FC<Props> = ({ onViewReports }) => {
    const queryClient = useQueryClient();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isProcessing, setIsProcessing] = useState(false);

    // 1. Create Cycle Mutation
    const createCycleMutation = useMutation({
        mutationFn: async () => {
            // Assume 30 days for simplicity or calculate based on month
            const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
            return hrmService.createPayrollCycle(selectedMonth, selectedYear, daysInMonth);
        },
        onSuccess: (data) => {
            // Immediately process after creation for this demo flow
            processMutation.mutate(data.id);
        },
        onError: () => toast.error('Failed to start payroll cycle'),
    });

    // 2. Process Payroll Mutation
    const processMutation = useMutation({
        mutationFn: (cycleId: string) => hrmService.processPayroll(cycleId),
        onSuccess: () => {
            toast.success('Payroll processed successfully');
            setIsProcessing(false);
            // Refetch cycles/records
        },
        onError: () => {
            toast.error('Error processing payroll');
            setIsProcessing(false);
        }
    });

    const handleRunPayroll = () => {
        setIsProcessing(true);
        createCycleMutation.mutate();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Payroll Management</h2>
                <div className="flex gap-2">
                    <select
                        className="border rounded-md p-2 text-sm"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{format(new Date(2024, i, 1), 'MMMM')}</option>
                        ))}
                    </select>
                    <select
                        className="border rounded-md p-2 text-sm"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                    </select>
                    <Button onClick={handleRunPayroll} disabled={isProcessing}>
                        <Play className="w-4 h-4 mr-2" />
                        {isProcessing ? 'Processing...' : 'Run Payroll'}
                    </Button>
                </div>
                {onViewReports && (
                    <Button onClick={onViewReports} variant="outline" className="ml-2">
                        <FileText className="w-4 h-4 mr-2" />
                        View Reports
                    </Button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Total Payroll Cost</h3>
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹ 0.00</p>
                    <p className="text-xs text-gray-500 mt-1">For selected month</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Employees Processed</h3>
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-500 mt-1">Out of total active staff</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Pending Payments</h3>
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <FileText className="w-5 h-5 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-500 mt-1">Requires approval</p>
                </div>
            </div>

            {/* Payroll Records Table Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Payroll Records</h3>
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                </div>
                <div className="p-8 text-center text-gray-500">
                    Select a month and click "Run Payroll" to generate records.
                </div>
            </div>
        </div>
    );
};

export default PayrollDashboard;
