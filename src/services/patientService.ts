import axios from 'axios';
import type { Patient } from '../types/index';

export interface CreatePatientData {
  first_name: string;
  last_name?: string;
  phone?: string;
  address?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  age: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  email?: string;
  is_active?: boolean;
}

export class PatientService {
  
  /**
   * Create a new patient with robust error handling
   */
  static async createPatient(patientData: CreatePatientData): Promise<Patient> {
    
    try {
      // Prepare data with defaults
      const cleanedData = {
        first_name: patientData.first_name?.trim() || '',
        last_name: patientData.last_name?.trim() || '',
        phone: patientData.phone?.trim() || '',
        address: patientData.address?.trim() || '',
        gender: patientData.gender || 'MALE',
        age: patientData.age,
        emergency_contact_name: patientData.emergency_contact_name?.trim() || '',
        emergency_contact_phone: patientData.emergency_contact_phone?.trim() || '',
        email: patientData.email?.trim() || null,
        is_active: patientData.is_active !== false, // Default to true
      };

      // Remove empty strings and replace with null for optional fields
      const finalData = Object.fromEntries(
        Object.entries(cleanedData).map(([key, value]) => [
          key,
          value === '' && !['first_name', 'gender', 'is_active'].includes(key) ? null : value
        ])
      );

      // Get API URL and auth token
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const token = localStorage.getItem('auth_token');

      // Call backend API
      const response = await axios.post(`${baseUrl}/api/patients`, finalData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data as Patient;

    } catch (error: any) {
      
      // Provide user-friendly error messages
      if (error.message?.includes('duplicate key')) {
        throw new Error('A patient with this information already exists');
      } else if (error.message?.includes('not null violation')) {
        throw new Error('Missing required patient information');
      } else if (error.message?.includes('foreign key')) {
        throw new Error('Invalid reference data provided');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Database permission error - please check your login status');
      } else {
        throw new Error(`Failed to create patient: ${error.message}`);
      }
    }
  }

  /**
   * Test database connection and permissions
   */
  static async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const token = localStorage.getItem('auth_token');

      if (!token) {
        return {
          success: false,
          message: 'No authentication token found'
        };
      }

      // Test backend API connection
      const response = await axios.get(`${baseUrl}/api/patients`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1 }
      });

      // Get current user
      const userStr = localStorage.getItem('auth_user');
      const user = userStr ? JSON.parse(userStr) : null;

      return {
        success: true,
        message: `Connection successful. User: ${user?.email || 'Unknown'}`,
        details: { user: user?.email, hasTableAccess: true }
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        details: error
      };
    }
  }
}

export default PatientService;