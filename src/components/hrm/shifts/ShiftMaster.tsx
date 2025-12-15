import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Edit2, Trash2, Save, X, ArrowRightLeft } from 'lucide-react';
import { Button } from '../../ui/Button';
import hrmService from '../../../services/hrmService';
import type { Shift } from '../../../types/hrm';
import toast from 'react-hot-toast';
import ShiftSwapModal from './ShiftSwapModal';

const ShiftMaster: React.FC = () => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [swapShiftId, setSwapShiftId] = useState<string | null>(null);
    const [newShift, setNewShift] = useState<Partial<Shift>>({
        shift_name: '',
        shift_code: '',
        start_time: '',
        end_time: '',
        break_duration_minutes: 60,
        is_active: true
    });

    const { data: shifts, isLoading } = useQuery({
        queryKey: ['shifts'],
        queryFn: () => hrmService.getShifts(),
    });

    const createMutation = useMutation({
        mutationFn: (shift: any) => hrmService.createShift(shift),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
            toast.success('Shift created successfully');
            setNewShift({
                shift_name: '',
                shift_code: '',
                start_time: '',
                end_time: '',
                break_duration_minutes: 60,
                is_active: true
            });
        },
        onError: () => toast.error('Failed to create shift'),
    });

    const handleCreate = () => {
        if (!newShift.shift_name || !newShift.start_time || !newShift.end_time) {
            toast.error('Please fill all required fields');
            return;
        }
        createMutation.mutate(newShift);
    };

    if (isLoading) return <div>Loading shifts...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Shift Configuration</h2>
            </div>

            {/* Create New Shift Form */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                    <Plus className="w-4 h-4 mr-2" /> Add New Shift
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Shift Name</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-md text-sm"
                            placeholder="e.g. Morning"
                            value={newShift.shift_name}
                            onChange={(e) => setNewShift({ ...newShift, shift_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Code</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-md text-sm"
                            placeholder="e.g. S1"
                            value={newShift.shift_code}
                            onChange={(e) => setNewShift({ ...newShift, shift_code: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                        <input
                            type="time"
                            className="w-full p-2 border rounded-md text-sm"
                            value={newShift.start_time}
                            onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                        <input
                            type="time"
                            className="w-full p-2 border rounded-md text-sm"
                            value={newShift.end_time}
                            onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
                        />
                    </div>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                        {createMutation.isPending ? 'Adding...' : 'Add Shift'}
                    </Button>
                </div>
            </div>

            {/* Shift List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {shifts?.map((shift) => (
                    <div key={shift.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-semibold text-gray-800">{shift.shift_name}</h4>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                    {shift.shift_code}
                                </span>
                            </div>
                            <div className="flex space-x-2">
                                <button className="text-gray-400 hover:text-blue-600">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center text-sm text-gray-600 mt-3">
                            <Clock className="w-4 h-4 mr-2 text-blue-500" />
                            <span>{shift.start_time} - {shift.end_time}</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                            Break: {shift.break_duration_minutes} mins
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                            Break: {shift.break_duration_minutes} mins
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => setSwapShiftId(shift.id)}
                        >
                            <ArrowRightLeft className="w-3 h-3 mr-2" />
                            Request Swap
                        </Button>
                    </div>
                ))}
            </div>

            {swapShiftId && (
                <ShiftSwapModal
                    originalShiftId={swapShiftId}
                    onClose={() => setSwapShiftId(null)}
                />
            )}
        </div>
    );
};

export default ShiftMaster;
