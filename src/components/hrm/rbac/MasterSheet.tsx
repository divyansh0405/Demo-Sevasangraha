import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';
import permissionService from '../../../services/permissionService';
import type { Role, Permission } from '../../../services/permissionService';
import { toast } from 'react-hot-toast';

const MasterSheet: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [rolesData, permissionsData] = await Promise.all([
                permissionService.getAllRoles(),
                permissionService.getAllPermissions()
            ]);

            setRoles(rolesData);
            setPermissions(permissionsData);

            // Fetch permissions for each role
            const rpMap: Record<string, string[]> = {};
            await Promise.all(rolesData.map(async (role) => {
                const pids = await permissionService.getRolePermissions(role.id);
                rpMap[role.id] = pids;
            }));

            setRolePermissions(rpMap);
        } catch (err) {
            console.error('Error fetching RBAC data:', err);
            setError('Failed to load roles and permissions');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermission = (roleId: string, permissionId: string) => {
        setRolePermissions(prev => {
            const current = prev[roleId] || [];
            const exists = current.includes(permissionId);

            let updated;
            if (exists) {
                updated = current.filter(id => id !== permissionId);
            } else {
                updated = [...current, permissionId];
            }

            return {
                ...prev,
                [roleId]: updated
            };
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Save all roles (could be optimized to only save changed ones)
            await Promise.all(roles.map(role =>
                permissionService.updateRolePermissions(role.id, rolePermissions[role.id])
            ));

            toast.success('Permissions updated successfully');
        } catch (err) {
            console.error('Error saving permissions:', err);
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    // Group permissions by module
    const permissionsByModule = permissions.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-red-600">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="text-lg font-medium">{error}</p>
                <button
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Access Control Master Sheet</h2>
                    <p className="text-gray-500">Manage role-based permissions across the system</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchData}
                        className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-64">
                                    Permission / Module
                                </th>
                                {roles.map(role => (
                                    <th key={role.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-gray-900">{role.name}</span>
                                            <span className="text-[10px] font-normal lowercase truncate max-w-[100px]">{role.description}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                                <React.Fragment key={module}>
                                    <tr className="bg-gray-50/50">
                                        <td colSpan={roles.length + 1} className="px-6 py-2 text-sm font-bold text-gray-900 capitalize sticky left-0 bg-gray-50/50">
                                            {module} Module
                                        </td>
                                    </tr>
                                    {modulePermissions.map(perm => (
                                        <tr key={perm.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 text-sm text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-100">
                                                <div className="font-medium">{perm.code}</div>
                                                <div className="text-xs text-gray-500">{perm.description}</div>
                                            </td>
                                            {roles.map(role => {
                                                const isChecked = rolePermissions[role.id]?.includes(perm.id);
                                                return (
                                                    <td key={`${role.id}-${perm.id}`} className="px-6 py-3 text-center">
                                                        <label className="inline-flex items-center justify-center cursor-pointer p-2 rounded-md hover:bg-gray-100">
                                                            <input
                                                                type="checkbox"
                                                                className="form-checkbox h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 transition duration-150 ease-in-out"
                                                                checked={isChecked}
                                                                onChange={() => handleTogglePermission(role.id, perm.id)}
                                                            />
                                                        </label>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MasterSheet;
