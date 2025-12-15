import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import hrmService from '../../services/hrmService';
import toast from 'react-hot-toast';

const DepartmentMaster: React.FC = () => {
    const queryClient = useQueryClient();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptCode, setNewDeptCode] = useState('');

    const { data: departments, isLoading } = useQuery({
        queryKey: ['departments'],
        queryFn: () => hrmService.getDepartments(),
    });

    const createMutation = useMutation({
        mutationFn: () => hrmService.createDepartment(newDeptName, newDeptCode),
        onSuccess: () => {
            toast.success('Department created successfully');
            setShowCreateModal(false);
            setNewDeptName('');
            setNewDeptCode('');
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
        onError: () => toast.error('Failed to create department'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => hrmService.deleteDepartment(id),
        onSuccess: () => {
            toast.success('Department deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
        onError: () => toast.error('Failed to delete department'),
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Departments</h2>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Department
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Department Name</th>
                            <th className="px-6 py-3">Code</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments?.map((dept) => (
                            <tr key={dept.id} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                        {dept.department_name}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{dept.department_code}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${dept.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {dept.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to delete this department?')) {
                                                deleteMutation.mutate(dept.id);
                                            }
                                        }}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {(!departments || departments.length === 0) && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    No departments found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Add Department</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                                <input
                                    type="text"
                                    value={newDeptName}
                                    onChange={(e) => setNewDeptName(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="e.g. Cardiology"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                                <input
                                    type="text"
                                    value={newDeptCode}
                                    onChange={(e) => setNewDeptCode(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="e.g. CARDIO"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            <Button onClick={() => createMutation.mutate()} disabled={!newDeptName || !newDeptCode}>
                                Create
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentMaster;
