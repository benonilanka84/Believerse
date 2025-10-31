// Import Supabase client (make sure you've included supabase.min.js in your index.html)
const { createClient } = supabase;

// ✅ Use your actual project URL and anon public key
const supabaseUrl = 'https://wwwgodenqeelebbzofrd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3d2dvZGVucWVlbGViYnpvZnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTEzNTQsImV4cCI6MjA3NzMyNzM1NH0.eWQgOecRwV1bEcayvcI6BiMa5Ssj_Lha5-CSNpdKoNY'; // get from Supabase > Settings > API > Project API keys
const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection with an existing table name
async function testSupabase() {
  try {
    const { data, error } = await supabase.from('test').select('*');
    console.log('Supabase Connected:', error, data);

    if (error) {
      document.body.innerHTML += `<p style="color:red;">Error: ${error.message}</p>`;
    } else {
      document.body.innerHTML += `<p style="color:green;">Connected successfully! ${data.length} records found.</p>`;
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    document.body.innerHTML += `<p style="color:red;">Unexpected error: ${err.message}</p>`;
  }
}

testSupabase();
