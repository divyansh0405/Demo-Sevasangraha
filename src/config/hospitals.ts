/**
 * Multi-Hospital Configuration
 * Defines configurations for each hospital with their respective Supabase credentials
 */

export interface HospitalConfig {
  id: string;
  code: string;
  name: string;
  displayName: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  logo?: string;
  themeColor?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

/**
 * Hospital configurations
 * Each hospital has its own Supabase database
 */
export const hospitalConfigs: Record<string, HospitalConfig> = {
  'sevasangraha-shobhagpura': {
    id: '550e8400-e29b-41d4-a716-446655440000',
    code: 'SEVASANGRAHA',
    name: 'sevasangraha-shobhagpura',
    displayName: 'Sevasangraha Shobhagpura',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://oghqwddhojnryovmfvzc.supabase.co',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0',
    logo: '/logo.png',
    themeColor: '#0056B3',
    address: '10, Madhav Vihar Shobhagpura, Udaipur (313001)',
    phone: '+91 9119118000',
    email: 'sevasangrahahospital@gmail.com',
    website: 'www.sevasangrahahospital.com'
  },

  'bhilwara': {
    id: '550e8400-e29b-41d4-a716-446655440001', // Different hospital_id
    code: 'BHIL',
    name: 'bhilwara',
    displayName: 'Bhilwara',
    supabaseUrl: 'https://hgwomxpzaeeqgxsnhceq.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnd29teHB6YWVlcWd4c25oY2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMDEwNDEsImV4cCI6MjA3MDY3NzA0MX0.Eeucjix4oV-mGVcIuOXgfFGGVXjsXZj2-oA8ify2O0g',
    logo: '/logo.png',
    themeColor: '#0056B3',
    address: 'Bhilwara Hospital Address',
    phone: '+91 XXXXXXXXXX',
    email: 'bhilwara@hospital.com',
    website: 'www.bhilwarahospital.com'
  },

  'madhuban': {
    id: '550e8400-e29b-41d4-a716-446655440002', // Different hospital_id
    code: 'MADH',
    name: 'madhuban',
    displayName: 'Madhuban',
    supabaseUrl: 'https://btoeupnfqkioxigrheyp.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMTg0MjQsImV4cCI6MjA2OTU5NDQyNH0.j70Ab_8XHCUG9eYHdEbbcZAPko3_Lj2edkzkZEpd8QQ',
    logo: '/logo.png',
    themeColor: '#0056B3',
    address: 'Madhuban Hospital Address',
    phone: '+91 XXXXXXXXXX',
    email: 'madhuban@hospital.com',
    website: 'www.madhubanhospital.com'
  }
};

/**
 * Get all available hospitals for selection
 */
export const getAvailableHospitals = (): HospitalConfig[] => {
  return Object.values(hospitalConfigs);
};

/**
 * Get hospital configuration by name
 */
export const getHospitalConfig = (hospitalName: string): HospitalConfig | null => {
  return hospitalConfigs[hospitalName] || null;
};

/**
 * Get currently selected hospital from localStorage
 */
export const getSelectedHospital = (): string | null => {
  return localStorage.getItem('selectedHospital');
};

/**
 * Set selected hospital in localStorage
 */
export const setSelectedHospital = (hospitalName: string): void => {
  localStorage.setItem('selectedHospital', hospitalName);
};

/**
 * Clear selected hospital from localStorage
 */
export const clearSelectedHospital = (): void => {
  localStorage.removeItem('selectedHospital');
};

/**
 * Get current hospital configuration (from localStorage)
 */
export const getCurrentHospitalConfig = (): HospitalConfig | null => {
  const selectedHospital = getSelectedHospital();
  if (!selectedHospital) {
    console.warn('⚠️ No hospital selected');
    return null;
  }

  const config = getHospitalConfig(selectedHospital);
  if (!config) {
    console.error('❌ Invalid hospital selection:', selectedHospital);
    return null;
  }

  console.log('✅ Current hospital:', config.displayName);
  return config;
};
