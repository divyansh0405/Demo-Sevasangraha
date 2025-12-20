import re

def fix_app_tsx():
    file_path = r'C:\Users\DELL\hospital-crm-pro-new\src\App.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find the backup refund fetch block
    # It looks for .from('patient_refunds') inside a try block
    
    # We will replace the specific Supabase call pattern
    
    # Pattern 1: Backup
    # const { data: refundData, error: refundError } = await supabase
    #   .from('patient_refunds')
    #   ...
    #   .order('created_at', { ascending: false });
    
    # We'll use a simpler approach: find the line with .from('patient_refunds') and replace the whole try/catch block around it if possible.
    # Or just replace the specific query lines.
    
    # Let's try to replace the exact string again but with more flexibility on whitespace
    
    backup_pattern = r"const\s+\{\s+data:\s+refundData,\s+error:\s+refundError\s+\}\s+=\s+await\s+supabase\s+\.from\('patient_refunds'\)[\s\S]*?\.order\('created_at',\s+\{\s+ascending:\s+false\s+\}\);"
    
    backup_replacement = """// Use ExactDateService to get all refunds (wide date range)
        const refundData = await ExactDateService.getPatientRefunds('2000-01-01', '2100-12-31');
        const refundError = null;"""
        
    # We need to adjust the surrounding code too because the original code uses refundData and refundError
    # The original code:
    # if (!refundError && refundData) { ... }
    
    # So if we set refundError = null and refundData = result, it should work without changing the surrounding logic too much,
    # EXCEPT that the original query returns { data, error }, but ExactDateService returns data directly.
    # So:
    # const refundData = ...
    # const refundError = null;
    
    # Wait, the original code destructures: const { data: refundData, error: refundError } = ...
    # So we can't just replace the query with const refundData = ... because it's inside a destructuring assignment?
    # No, the original code IS: const { data: refundData, error: refundError } = await supabase...
    
    # So we should replace the WHOLE statement.
    
    content = re.sub(backup_pattern, backup_replacement, content)
    
    # Pattern 2: Export
    # const { data: refunds } = await supabase
    #   .from('patient_refunds')
    #   ...
    #   .eq('hospital_id', '550e8400-e29b-41d4-a716-446655440000');
    
    export_pattern = r"const\s+\{\s+data:\s+refunds\s+\}\s+=\s+await\s+supabase\s+\.from\('patient_refunds'\)[\s\S]*?\.eq\('hospital_id',\s+'550e8400-e29b-41d4-a716-446655440000'\);"
    
    export_replacement = """// Use ExactDateService to get all refunds (wide date range)
        const refunds = await ExactDateService.getPatientRefunds('2000-01-01', '2100-12-31');"""
        
    content = re.sub(export_pattern, export_replacement, content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("App.tsx updated using regex")

if __name__ == "__main__":
    try:
        fix_app_tsx()
    except Exception as e:
        print(f"Error: {e}")
