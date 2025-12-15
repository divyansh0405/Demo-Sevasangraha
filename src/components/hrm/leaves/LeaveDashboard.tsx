import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import hrmService from '../../../services/hrmService';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

const LeaveDashboard: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showApplyModal, setShowApplyModal] = useState(false);

    // Fetch Leave Types
    const { data: leaveTypes } = useQuery({
        queryKey: ['leave-types'],
        queryFn: () => hrmService.getLeaveTypes(),
    });

    // Fetch My Applications (Mock for now, need service method)
    // const { data: applications } = useQuery(...)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Leave Management</h2>
                <Button onClick={() => setShowApplyModal(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Apply for Leave
                </Button>
            </div>

            {/* Leave Balances Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leaveTypes?.map((type) => (
                    <div key={type.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-gray-800">{type.leave_name}</h3>
                                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                            </div>
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                {type.leave_code}
                            </span>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-gray-900">
                                    {/* TODO: Fetch actual balance */}
                                    {type.max_days_per_year}
                                </span>
                                <span className="text-sm text-gray-500 mb-1">days remaining</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full mt-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: '0%' }} // TODO: Calculate percentage
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Applications List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">Recent Applications</h3>
                </div>
                <div className="p-6 text-center text-gray-500">
                    No leave applications found.
                </div>
            </div>

            {/* Apply Modal (Placeholder) */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Apply for Leave</h3>
                        <p className="text-gray-500 text-sm mb-4">Form implementation pending...</p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowApplyModal(false)}>Cancel</Button>
                            <Button>Submit Request</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveDashboard;
