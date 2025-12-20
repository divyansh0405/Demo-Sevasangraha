/**
 * DEPRECATED: Dynamic Supabase Client
 * This file is kept for backwards compatibility
 * Now uses Azure PostgreSQL backend API instead of Supabase
 */

import { AZURE_CONFIG } from './azure';
import { getCurrentHospitalConfig } from './hospitals';

/**
 * Get Azure backend API client (replaces Supabase client)
 * @deprecated Use services from ./azure instead
 */
export const getDynamicSupabaseClient = () => {
  const hospitalConfig = getCurrentHospitalConfig();

  console.log('🔍 [getDynamicSupabaseClient] DEPRECATED - Using Azure backend');
  console.log('🏥 Current hospital:', hospitalConfig?.name || 'default');
  console.log('🔗 Backend API:', AZURE_CONFIG.API_URL);

  // Return a mock client that warns users
  return {
    from: (table: string) => {
      console.error(`❌ Direct database access not allowed. Use backend API services instead.`);
      console.error(`Table requested: ${table}`);
      console.error(`Import services from '../services/' instead`);
      throw new Error('Supabase client is deprecated. Use Azure backend API services.');
    },
    auth: {
      signIn: () => {
        throw new Error('Use authService.login() instead');
      },
      signOut: () => {
        throw new Error('Use authService.logout() instead');
      },
      getSession: () => {
        throw new Error('Use authService.getCurrentUser() instead');
      }
    }
  };
};

/**
 * Get Supabase client for specific hospital
 * @deprecated Use Azure backend API instead
 */
export const getSupabaseForHospital = (hospitalName: string) => {
  console.warn('⚠️ getSupabaseForHospital() is deprecated');
  console.warn('🔄 All database operations now use Azure backend API');
  return getDynamicSupabaseClient();
};

// Export deprecated function for backwards compatibility
export default getDynamicSupabaseClient;
