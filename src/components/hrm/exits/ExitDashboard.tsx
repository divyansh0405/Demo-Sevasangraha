import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Plus, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import hrmService from '../../../services/hrmService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';

const ExitDashboard: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const queryClient = useQueryClient();
    const [showInitiateModal, setShowInitiateModal] = useState(false);
    const [selectedExit, setSelectedExit] = useState<any | null>(null);

    // Form State
    const [exitType, setExitType] = useState('Resignation');
    const [reason, setReason] = useState('');
    const [resignationDate, setResignationDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const { data: exits, isLoading } = useQuery({
        queryKey: ['exits'],
        queryFn: () => hrmService.getExitRequests(),
    });

    const { data: checklist } = useQuery({
        queryKey: ['exit-checklist', selectedExit?.id],
        queryFn: () => hrmService.getExitChecklist(selectedExit.id),
        enabled: !!selectedExit,
    });

    const initiateMutation = useMutation({
        mutationFn: () => hrmService.initiateExit({
            employee_id: user?.id, // Assuming self-service for now, or admin selects employee
            type: exitType as any,
            reason,
            resignation_date: resignationDate,
        }),
        onSuccess: () => {
            toast.success('Exit process initiated');
            setShowInitiateModal(false);
            queryClient.invalidateQueries({ queryKey: ['exits'] });
        },
        onError: () => toast.error('Failed to initiate exit'),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            hrmService.updateExitStatus(id, status, user?.id),
        onSuccess: () => {
            toast.success('Status updated');
            queryClient.invalidateQueries({ queryKey: ['exits'] });
        },
    });

    const updateChecklistMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            hrmService.updateChecklistItem(id, status),
        onSuccess: () => {
            toast.success('Checklist updated');
            queryClient.invalidateQueries({ queryKey: ['exit-checklist'] });
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Exit Management</h2>
                    <p className="text-gray-600">Manage resignations and offboarding</p>
                </div>
                <Button onClick={() => setShowInitiateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Initiate Exit
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Exit Requests List */}
                <div className="lg:col-span-2 space-y-4">
                    {exits?.map((exit) => (
                        <div
                            key={exit.id}
                            className={`bg-white p-4 rounded-lg shadow-sm border cursor-pointer transition-colors ${selectedExit?.id === exit.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
                            onClick={() => setSelectedExit(exit)}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        {exit.employee?.first_name} {exit.employee?.last_name}
                                    </h3>
                                    <p className="text-sm text-gray-500">{exit.type} • {format(new Date(exit.resignation_date), 'MMM d, yyyy')}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${exit.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        exit.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                                            exit.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                    }`}>
                                    {exit.status}
                                </span>
                            </div>

                            {hasPermission('hrm.exit.approve') && exit.status === 'Pending' && (
                                <div className="mt-4 flex gap-2">
                                    <Button size="sm" onClick={(e) => {
                                        e.stopPropagation();
                                        updateStatusMutation.mutate({ id: exit.id, status: 'Approved' });
                                    }}>
                                        Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={(e) => {
                                        e.stopPropagation();
                                        updateStatusMutation.mutate({ id: exit.id, status: 'Rejected' });
                                    }}>
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                    {(!exits || exits.length === 0) && (
                        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed">
                            No exit requests found.
                        </div>
                    )}
                </div>

                {/* Details & Checklist Panel */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-fit">
                    {selectedExit ? (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-lg mb-2">Offboarding Checklist</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Tasks to complete before final settlement.
                                </p>
                                <div className="space-y-3">
                                    {checklist?.map((item) => (
                                        <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                                            <div className={`mt-0.5 ${item.status === 'Cleared' ? 'text-green-500' : 'text-gray-400'}`}>
                                                {item.status === 'Cleared' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{item.task_name}</p>
                                                <p className="text-xs text-gray-500">{item.department}</p>
                                            </div>
                                            {hasPermission('hrm.exit.checklist') && item.status !== 'Cleared' && (
                                                <button
                                                    onClick={() => updateChecklistMutation.mutate({ id: item.id, status: 'Cleared' })}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedExit.status === 'Approved' && checklist?.every(i => i.status === 'Cleared') && (
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={() => updateStatusMutation.mutate({ id: selectedExit.id, status: 'Completed' })}
                                >
                                    Mark as Completed
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-12">
                            Select an exit request to view details.
                        </div>
                    )}
                </div>
            </div>

            {/* Initiate Modal */}
            {showInitiateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Initiate Exit</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={exitType}
                                    onChange={(e) => setExitType(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="Resignation">Resignation</option>
                                    <option value="Termination">Termination</option>
                                    <option value="Retirement">Retirement</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Resignation Date</label>
                                <input
                                    type="date"
                                    value={resignationDate}
                                    onChange={(e) => setResignationDate(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    rows={3}
                                    placeholder="Reason for leaving..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setShowInitiateModal(false)}>Cancel</Button>
                            <Button onClick={() => initiateMutation.mutate()}>Submit</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExitDashboard;
