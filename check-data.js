const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkData() {
  console.log('🔍 Checking database data...\n');
  
  // Check patients
  const { data: patients, error: pError } = await supabase
    .from('patients')
    .select('*')
    .limit(5);
  
  console.log('📋 Patients:', patients ? patients.length : 0);
  if (patients && patients.length > 0) {
    console.log('   Sample:', patients[0].name);
  }
  
  // Check medicines
  const { data: medicines, error: mError } = await supabase
    .from('medicines')
    .select('*')
    .limit(5);
  
  console.log('💊 Medicines:', medicines ? medicines.length : 0);
  if (medicines && medicines.length > 0) {
    console.log('   Sample:', medicines[0].name);
  }
  
  // Check pharmacy locations
  const { data: locations } = await supabase
    .from('pharmacy_locations')
    .select('*');
  
  console.log('📍 Pharmacy Locations:', locations ? locations.length : 0);
  
  console.log('\n✅ Data check complete!');
}

checkData().catch(console.error);
