import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ArrowRightLeft } from 'lucide-react';
import { Button } from '../../ui/Button';
import hrmService from '../../../services/hrmService';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
    onClose: () => void;
    originalShiftId: string; // The shift the user wants to swap OUT of
}

const ShiftSwapModal: React.FC<Props> = ({ onClose, originalShiftId }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [targetEmployeeId, setTargetEmployeeId] = useState('');
    const [reason, setReason] = useState('');

    // Fetch potential swap candidates (employees in same department)
    const { data: employees } = useQuery({
        queryKey: ['swap-candidates'],
        queryFn: () => hrmService.getEmployeeMasters({ is_active: true }), // Should filter by dept ideally
    });

    const swapMutation = useMutation({
        mutationFn: () => hrmService.requestShiftSwap({
            requester_id: user?.id,
            original_shift_id: originalShiftId,
            target_employee_id: targetEmployeeId || undefined, // Optional for open swap
            reason,
        }),
        onSuccess: () => {
            toast.success('Swap request sent successfully');
            onClose();
            queryClient.invalidateQueries({ queryKey: ['shift-swaps'] });
        },
        onError: () => toast.error('Failed to send swap request'),
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center">
                        <ArrowRightLeft className="w-5 h-5 mr-2 text-blue-600" />
                        Request Shift Swap
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Swap With (Optional)
                        </label>
                        <select
                            value={targetEmployeeId}
                            onChange={(e) => setTargetEmployeeId(e.target.value)}
                            className="w-full p-2 border rounded-md text-sm"
                        >
                            <option value="">-- Open Swap (Anyone) --</option>
                            {employees?.filter(e => e.id !== user?.id).map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.first_name} {emp.last_name} ({emp.job_title})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Leave empty to broadcast to all eligible staff.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-2 border rounded-md text-sm"
                            rows={3}
                            placeholder="Why do you need to swap?"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={() => swapMutation.mutate()} disabled={swapMutation.isPending}>
                            {swapMutation.isPending ? 'Sending...' : 'Send Request'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftSwapModal;
