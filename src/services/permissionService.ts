
import { supabase } from '../config/supabaseNew';
import { logger } from '../utils/logger';

export interface Permission {
    id: string;
    code: string;
    description: string;
    module: string;
}

export interface Role {
    id: string;
    name: string;
    description: string;
}

export interface RolePermission {
    role_id: string;
    permission_id: string;
}

class PermissionService {
    /**
     * Get all permissions for a specific user based on their role
     */
    async getUserPermissions(userId: string, email?: string): Promise<string[]> {
        try {
            let roleId: string | null = null;

            // 1. Try to get role_id using userId (assuming it might match id or user_id)
            // We'll check both 'id' and 'user_id' if possible, but for now let's try 'id' first
            // If the table has 'user_id', we should use that.
            // Since we are unsure, let's try to find by email if provided, as it's more reliable for linking

            if (email) {
                const { data: employeeByEmail, error: emailError } = await supabase
                    .from('employee_master')
                    .select('role_id')
                    .eq('work_email', email)
                    .single();

                if (!emailError && employeeByEmail) {
                    roleId = employeeByEmail.role_id;
                }
            }

            // If email lookup failed or wasn't provided, try ID
            if (!roleId) {
                const { data: employeeById, error: idError } = await supabase
                    .from('employee_master')
                    .select('role_id')
                    .eq('id', userId)
                    .single();

                if (!idError && employeeById) {
                    roleId = employeeById.role_id;
                }
            }

            if (!roleId) {
                // logger.warn(`⚠️ PermissionService: Could not find employee role for user ${userId} / ${email}`);
                return [];
            }

            // 2. Get permissions for the role
            const { data: rolePermissions, error: rpError } = await supabase
                .from('role_permissions')
                .select('permissions(code)')
                .eq('role_id', roleId);

            if (rpError) {
                logger.error('❌ Error fetching role permissions:', rpError);
                return [];
            }

            // 3. Extract codes
            const permissions = rolePermissions.map((rp: any) => rp.permissions.code);
            return permissions;
        } catch (error) {
            logger.error('❌ Exception in getUserPermissions:', error);
            return [];
        }
    }

    /**
     * Get all available roles
     */
    async getAllRoles(): Promise<Role[]> {
        try {
            const { data, error } = await supabase
                .from('roles')
                .select('*')
                .order('name');

            if (error) {
                // If table doesn't exist, return empty array
                if (error.code === '42P01') {
                    logger.warn('⚠️ Roles table does not exist. Please run migration.');
                    return [];
                }
                throw error;
            }
            return data || [];
        } catch (error) {
            logger.error('❌ Error fetching roles:', error);
            return [];
        }
    }

    /**
     * Get all available permissions
     */
    async getAllPermissions(): Promise<Permission[]> {
        try {
            const { data, error } = await supabase
                .from('permissions')
                .select('*')
                .order('module, code');

            if (error) {
                if (error.code === '42P01') {
                    logger.warn('⚠️ Permissions table does not exist. Please run migration.');
                    return [];
                }
                throw error;
            }
            return data || [];
        } catch (error) {
            logger.error('❌ Error fetching permissions:', error);
            return [];
        }
    }

    /**
     * Get permissions assigned to a specific role
     */
    async getRolePermissions(roleId: string): Promise<string[]> {
        try {
            const { data, error } = await supabase
                .from('role_permissions')
                .select('permission_id')
                .eq('role_id', roleId);

            if (error) {
                if (error.code === '42P01') return [];
                throw error;
            }
            return data.map(rp => rp.permission_id);
        } catch (error) {
            logger.error('❌ Error fetching role permissions:', error);
            return [];
        }
    }

    /**
     * Update permissions for a role
     */
    async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
        try {
            // 1. Delete existing permissions for the role
            const { error: deleteError } = await supabase
                .from('role_permissions')
                .delete()
                .eq('role_id', roleId);

            if (deleteError) throw deleteError;

            // 2. Insert new permissions
            if (permissionIds.length > 0) {
                const records = permissionIds.map(pid => ({
                    role_id: roleId,
                    permission_id: pid
                }));

                const { error: insertError } = await supabase
                    .from('role_permissions')
                    .insert(records);

                if (insertError) throw insertError;
            }
        } catch (error) {
            logger.error('❌ Error updating role permissions:', error);
            throw error;
        }
    }
}

export const permissionService = new PermissionService();
export default permissionService;
