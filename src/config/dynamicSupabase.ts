/**
 * Dynamic Supabase Client
 * Creates Supabase client based on selected hospital
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getCurrentHospitalConfig, getHospitalConfig } from './hospitals';

/**
 * Get or create Supabase client for currently selected hospital
 * NO CACHING - Always returns a fresh client based on current localStorage
 */
export const getDynamicSupabaseClient = (): SupabaseClient => {
  const hospitalConfig = getCurrentHospitalConfig();

  console.log('🔍 [getDynamicSupabaseClient] Called. Current hospital from localStorage:', hospitalConfig?.name || 'NONE');

  // If no hospital selected, return a default client (Valant Shobhagpura)
  if (!hospitalConfig) {
    console.warn('⚠️ No hospital selected, using default Valant Shobhagpura client');

    const defaultConfig = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://oghqwddhojnryovmfvzc.supabase.co',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0'
    };

    return createClient(
      defaultConfig.supabaseUrl,
      defaultConfig.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
  }

  // ALWAYS create a fresh client - NO CACHING
  console.log('🔧 [getDynamicSupabaseClient] Creating FRESH Supabase client for:', hospitalConfig.displayName);
  console.log('🔧 [getDynamicSupabaseClient] Supabase URL:', hospitalConfig.supabaseUrl);

  const client = createClient(
    hospitalConfig.supabaseUrl,
    hospitalConfig.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  console.log('✅ [getDynamicSupabaseClient] Fresh Supabase client created for:', hospitalConfig.displayName);
  return client;
};

/**
 * Initialize Supabase client for a specific hospital
 * @param hospitalName - Name of the hospital to connect to
 * NOTE: This just validates and returns a fresh client. Actual client creation happens in getDynamicSupabaseClient()
 */
export const initializeSupabaseForHospital = (hospitalName: string): SupabaseClient => {
  const hospitalConfig = getHospitalConfig(hospitalName);

  if (!hospitalConfig) {
    throw new Error(`Invalid hospital: ${hospitalName}`);
  }

  console.log('🔧 [initializeSupabaseForHospital] Validating hospital:', hospitalConfig.displayName);
  console.log('✅ [initializeSupabaseForHospital] Hospital validated, getDynamicSupabaseClient() will create fresh client');

  // Just return a fresh client - no caching
  return getDynamicSupabaseClient();
};

/**
 * Reset Supabase client (call on logout or hospital change)
 * NOTE: With no-caching approach, this is a no-op but kept for compatibility
 */
export const resetSupabaseClient = (): void => {
  console.log('🔄 [resetSupabaseClient] Called (no-op with fresh client approach)');
};

/**
 * Get current hospital ID
 * Returns default Valant Shobhagpura ID if no hospital selected
 */
export const getCurrentHospitalId = (): string => {
  const hospitalConfig = getCurrentHospitalConfig();

  if (!hospitalConfig) {
    console.warn('⚠️ No hospital selected, using default Valant Shobhagpura ID');
    return '550e8400-e29b-41d4-a716-446655440000'; // Default Valant Shobhagpura
  }

  return hospitalConfig.id;
};

/**
 * Get current hospital info
 */
export const getCurrentHospitalInfo = () => {
  const hospitalConfig = getCurrentHospitalConfig();

  if (!hospitalConfig) {
    throw new Error('No hospital selected');
  }

  return hospitalConfig;
};

/**
 * Check if a Supabase client is initialized
 */
export const isSupabaseInitialized = (): boolean => {
  return supabaseClient !== null;
};
