import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, MapPin, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import hrmService from '../../../services/hrmService';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AttendanceTracker: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [remarks, setRemarks] = useState('');

    // Fetch today's logs for current user
    const { data: logs, isLoading } = useQuery({
        queryKey: ['attendance-logs', user?.id],
        queryFn: () => hrmService.getAttendanceLogs(user?.id), // We need to ensure we get the employee ID, not auth ID if they differ
    });

    const todayLog = logs?.find(l => l.date === new Date().toISOString().split('T')[0]);

    const markMutation = useMutation({
        mutationFn: (data: any) => hrmService.markAttendance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance-logs'] });
            toast.success('Attendance marked successfully');
        },
        onError: () => toast.error('Failed to mark attendance'),
    });

    const handleCheckIn = () => {
        // In a real app, we'd get the employee ID from a proper mapping
        // For now, assuming we have a way to get it or the backend handles auth.uid() -> employee_id mapping
        // Since hrmService.markAttendance expects employee_id, we need to fetch the employee record first
        // This is a simplification.

        // TODO: Fetch employee ID for current user
        // For this demo, we'll assume the user context has it or we fetch it.
        // Let's assume we need to fetch it.

        // TEMPORARY: We need the employee ID. 
        // Ideally AuthContext should provide the linked employee_id.
        // For now, let's just show a toast if we can't find it.
        toast.error("Employee ID mapping required. Please ensure you are linked to an employee record.");
    };

    return (
        <div className="space-y-6">
            {/* Today's Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {format(new Date(), 'EEEE, d MMMM yyyy')}
                        </h2>
                        <p className="text-gray-500 mt-1 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Current Time: {format(new Date(), 'HH:mm:ss')}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        {!todayLog?.check_in_time ? (
                            <Button
                                onClick={handleCheckIn}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
                            >
                                Check In
                            </Button>
                        ) : !todayLog?.check_out_time ? (
                            <Button
                                onClick={() => { }} // Handle Check Out
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
                            >
                                Check Out
                            </Button>
                        ) : (
                            <div className="bg-green-50 text-green-700 px-6 py-3 rounded-full font-medium flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Day Completed
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Indicators */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Check In</span>
                        <p className="text-xl font-semibold text-gray-900 mt-1">
                            {todayLog?.check_in_time ? format(new Date(todayLog.check_in_time), 'HH:mm') : '--:--'}
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Check Out</span>
                        <p className="text-xl font-semibold text-gray-900 mt-1">
                            {todayLog?.check_out_time ? format(new Date(todayLog.check_out_time), 'HH:mm') : '--:--'}
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Work Hours</span>
                        <p className="text-xl font-semibold text-gray-900 mt-1">
                            {todayLog?.total_work_hours || '0'} hrs
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Status</span>
                        <p className={`text-xl font-semibold mt-1 ${todayLog?.status === 'Present' ? 'text-green-600' :
                                todayLog?.status === 'Late' ? 'text-orange-600' : 'text-gray-400'
                            }`}>
                            {todayLog?.status || 'Not Marked'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Logs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-700">Recent Activity</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Check In</th>
                                <th className="px-6 py-3">Check Out</th>
                                <th className="px-6 py-3">Hours</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs?.map((log) => (
                                <tr key={log.id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">{log.date}</td>
                                    <td className="px-6 py-4">
                                        {log.check_in_time ? format(new Date(log.check_in_time), 'HH:mm') : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {log.check_out_time ? format(new Date(log.check_out_time), 'HH:mm') : '-'}
                                    </td>
                                    <td className="px-6 py-4">{log.total_work_hours}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${log.status === 'Present' ? 'bg-green-100 text-green-800' :
                                                log.status === 'Absent' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!logs || logs.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No attendance records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendanceTracker;
