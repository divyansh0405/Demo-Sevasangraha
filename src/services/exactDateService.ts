import axios from 'axios';
import type { PatientWithRelations } from '../config/supabaseNew';

export class ExactDateService {
  private static getHeaders() {
    const token = localStorage.getItem('auth_token');
    return { Authorization: `Bearer ${token}` };
  }

  private static getBaseUrl() {
    return import.meta.env.VITE_API_URL || 'http://localhost:3002';
  }

  static async getPatientsForExactDate(dateStr: string, limit = 100): Promise<PatientWithRelations[]> {
    try {
      console.log('🔍 Getting patients for exact date:', dateStr);

      const response = await axios.get(`${this.getBaseUrl()}/api/patients/by-date/${dateStr}`, {
        headers: this.getHeaders(),
        params: { limit }
      });

      const patients = response.data || [];
      console.log(`✅ Retrieved ${patients.length} patients for ${dateStr}`);

      // Enhance patients with calculated fields
      const enhancedPatients = patients.map((patient: any) => {
        const transactions = patient.transactions || [];
        const admissions = patient.admissions || [];

        // Only count completed transactions (exclude cancelled)
        const totalSpent = transactions
          .filter((t: any) => t.status !== 'CANCELLED')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

        // Count patient entries/registrations and consultations
        const registrationVisits = transactions.filter((t: any) =>
          (t.transaction_type === 'ENTRY_FEE' ||
            t.transaction_type === 'entry_fee' ||
            t.transaction_type === 'CONSULTATION' ||
            t.transaction_type === 'consultation' ||
            t.transaction_type === 'LAB_TEST' ||
            t.transaction_type === 'XRAY' ||
            t.transaction_type === 'PROCEDURE') &&
          t.status !== 'CANCELLED'
        ).length;

        const visitCount = Math.max(registrationVisits, 1);

        // Get last transaction/visit date
        const lastTransactionDate = transactions.length > 0
          ? new Date(Math.max(...transactions.map((t: any) => new Date(t.created_at).getTime())))
          : new Date(patient.created_at);

        return {
          ...patient,
          totalSpent,
          visitCount,
          lastVisit: lastTransactionDate.toISOString().split('T')[0],
          departmentStatus: patient.ipd_status === 'ADMITTED' || patient.ipd_status === 'DISCHARGED' ? 'IPD' as const : 'OPD' as const
        };
      });

      return enhancedPatients as PatientWithRelations[];

    } catch (error: any) {
      console.error('❌ Error getting patients for exact date:', error);
      return [];
    }
  }

  static async getPatientsForDateRange(startDateStr: string, endDateStr: string): Promise<PatientWithRelations[]> {
    try {
      console.log('🔍 getPatientsForDateRange - Input:', { startDateStr, endDateStr });

      const response = await axios.get(`${this.getBaseUrl()}/api/patients/by-date-range`, {
        headers: this.getHeaders(),
        params: {
          start_date: startDateStr,
          end_date: endDateStr
        }
      });

      const patients = response.data || [];
      console.log(`📊 Retrieved ${patients.length} patients for date range`);

      // Enhance patients with calculated fields
      const enhancedPatients = patients.map((patient: any) => {
        const transactions = patient.transactions || [];
        const admissions = patient.admissions || [];

        const totalSpent = transactions
          .filter((t: any) => t.status !== 'CANCELLED')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

        const registrationVisits = transactions.filter((t: any) =>
          (t.transaction_type === 'ENTRY_FEE' ||
            t.transaction_type === 'entry_fee' ||
            t.transaction_type === 'CONSULTATION' ||
            t.transaction_type === 'consultation' ||
            t.transaction_type === 'LAB_TEST' ||
            t.transaction_type === 'XRAY' ||
            t.transaction_type === 'PROCEDURE') &&
          t.status !== 'CANCELLED'
        ).length;

        const visitCount = Math.max(registrationVisits, 1);

        const lastTransactionDate = transactions.length > 0
          ? new Date(Math.max(...transactions.map((t: any) => new Date(t.created_at).getTime())))
          : new Date(patient.created_at);

        return {
          ...patient,
          totalSpent,
          visitCount,
          lastVisit: lastTransactionDate.toISOString().split('T')[0],
          departmentStatus: patient.ipd_status === 'ADMITTED' || patient.ipd_status === 'DISCHARGED' ? 'IPD' as const : 'OPD' as const
        };
      });

      return enhancedPatients as PatientWithRelations[];

    } catch (error: any) {
      console.error('❌ Error getting patients for date range:', error);
      return [];
    }
  }

  static async getPatientRefunds(startDateStr: string, endDateStr: string): Promise<any[]> {
    try {
      console.log('🔍 getPatientRefunds - Input:', { startDateStr, endDateStr });

      const response = await axios.get(`${this.getBaseUrl()}/api/patient_refunds`, {
        headers: this.getHeaders(),
        params: {
          start_date: startDateStr,
          end_date: endDateStr
        }
      });

      const refunds = response.data || [];
      console.log(`💸 Retrieved ${refunds.length} refunds for date range`);
      return refunds;

    } catch (error: any) {
      console.error('❌ Error getting patient refunds:', error);
      return [];
    }
  }
}