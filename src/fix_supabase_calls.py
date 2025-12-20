import os

def fix_app_tsx():
    file_path = r'C:\Users\DELL\hospital-crm-pro-new\src\App.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add import
    if "import { ExactDateService } from './services/exactDateService';" not in content:
        content = content.replace("import EmailService from './services/emailService';", 
                                  "import EmailService from './services/emailService';\nimport { ExactDateService } from './services/exactDateService';")

    # Replace backup refund fetch
    old_backup = """      // Get all refunds with error handling
      let refunds: any[] = [];
      try {
        const { data: refundData, error: refundError } = await supabase
          .from('patient_refunds')
          .select(`
            *,
            patient:patients(id, patient_id, first_name, last_name, phone)
          `)
          .eq('hospital_id', '550e8400-e29b-41d4-a716-446655440000')
          .order('created_at', { ascending: false });
        
        if (!refundError && refundData) {
          refunds = refundData;
          logger.log(`✅ Retrieved ${refunds.length} refunds for backup`);
        } else {
          logger.warn('⚠️ Refunds table not accessible, skipping refunds in backup');
          refunds = [];
        }
      } catch (error) {
        logger.warn('⚠️ Error fetching refunds, using empty array:', error);
        refunds = [];
      }"""

    new_backup = """      // Get all refunds with error handling
      let refunds: any[] = [];
      try {
        // Use ExactDateService to get all refunds (wide date range)
        const refundData = await ExactDateService.getPatientRefunds('2000-01-01', '2100-12-31');
        
        if (refundData) {
          refunds = refundData;
          logger.log(`✅ Retrieved ${refunds.length} refunds for backup`);
        } else {
          refunds = [];
        }
      } catch (error) {
        logger.warn('⚠️ Error fetching refunds, using empty array:', error);
        refunds = [];
      }"""

    # Replace export refund fetch
    old_export = """      // Add refunds data to export
      try {
        const { data: refunds } = await supabase
          .from('patient_refunds')
          .select(`
            *,
            patient:patients(id, patient_id, first_name, last_name, phone)
          `)
          .eq('hospital_id', '550e8400-e29b-41d4-a716-446655440000');
          
        exportDataObject.refunds = {
          count: refunds?.length || 0,
          data: refunds || [],
          note: refunds?.length === 0 ? 'No refunds found or table not accessible' : 'All refunds included'
        };
      } catch (error) {
        logger.warn('⚠️ Refunds not available for export:', error);
        exportDataObject.refunds = {
          count: 0,
          data: [],
          note: 'Refunds table not accessible'
        };
      }"""

    new_export = """      // Add refunds data to export
      try {
        // Use ExactDateService to get all refunds (wide date range)
        const refunds = await ExactDateService.getPatientRefunds('2000-01-01', '2100-12-31');
          
        exportDataObject.refunds = {
          count: refunds?.length || 0,
          data: refunds || [],
          note: refunds?.length === 0 ? 'No refunds found' : 'All refunds included'
        };
      } catch (error) {
        logger.warn('⚠️ Refunds not available for export:', error);
        exportDataObject.refunds = {
          count: 0,
          data: [],
          note: 'Refunds table not accessible'
        };
      }"""

    # Normalize line endings for matching
    content = content.replace('\r\n', '\n')
    old_backup = old_backup.replace('\r\n', '\n')
    old_export = old_export.replace('\r\n', '\n')

    if old_backup in content:
        content = content.replace(old_backup, new_backup)
        print("Replaced backup refund fetch in App.tsx")
    else:
        print("Backup refund fetch not found in App.tsx")

    if old_export in content:
        content = content.replace(old_export, new_export)
        print("Replaced export refund fetch in App.tsx")
    else:
        print("Export refund fetch not found in App.tsx")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_dashboard_tsx():
    file_path = r'C:\Users\DELL\hospital-crm-pro-new\src\components\EnhancedDashboard.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add import
    if "import { ExactDateService } from '../services/exactDateService';" not in content:
        content = content.replace("import HospitalService from '../services/hospitalService';", 
                                  "import HospitalService from '../services/hospitalService';\nimport { ExactDateService } from '../services/exactDateService';")

    # Replace fetchAllRefunds
    # We will use a simpler replacement strategy: find the start of the function and replace until the end of the block
    # But since we know the exact content from previous steps, we can try exact match first
    
    old_function_start = """  // Helper function to fetch all refunds with pagination
  const fetchAllRefunds = async () => {"""
    
    new_function = """  // Helper function to fetch all refunds using ExactDateService
  const fetchAllRefunds = async () => {
    try {
      // Use ExactDateService to get all refunds (wide date range)
      const allRefunds = await ExactDateService.getPatientRefunds('2000-01-01', '2100-12-31');
      console.log(`📊 Total refunds fetched via API: ${allRefunds.length}`);
      return allRefunds;
    } catch (error) {
      console.warn('⚠️ Refunds query failed, using empty array:', error);
      return [];
    }
  };"""

    # Normalize
    content = content.replace('\r\n', '\n')
    
    # Find start index
    start_idx = content.find(old_function_start)
    if start_idx != -1:
        # Find the end of the function. It ends with "};" and then a newline and empty line usually.
        # We know the old function is about 45 lines long.
        # Let's find the next function start or end of file to be safe, or just count braces?
        # Counting braces is safer.
        
        idx = start_idx
        brace_count = 0
        found_brace = False
        end_idx = -1
        
        for i in range(start_idx, len(content)):
            if content[i] == '{':
                brace_count += 1
                found_brace = True
            elif content[i] == '}':
                brace_count -= 1
            
            if found_brace and brace_count == 0:
                # Found end of function
                # Check for semicolon
                if i + 1 < len(content) and content[i+1] == ';':
                    end_idx = i + 2
                else:
                    end_idx = i + 1
                break
        
        if end_idx != -1:
            content = content[:start_idx] + new_function + content[end_idx:]
            print("Replaced fetchAllRefunds in EnhancedDashboard.tsx")
        else:
            print("Could not find end of fetchAllRefunds in EnhancedDashboard.tsx")
    else:
        print("fetchAllRefunds start not found in EnhancedDashboard.tsx")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    try:
        fix_app_tsx()
        fix_dashboard_tsx()
        print("Fix script completed")
    except Exception as e:
        print(f"Error: {e}")
