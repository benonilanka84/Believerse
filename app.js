// ✅ Make sure the Supabase client is available globally
const supabase = window.supabase.createClient(
  'https://xpvlejqxqdsjulbyloyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3d2dvZGVucWVlbGViYnpvZnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTEzNTQsImV4cCI6MjA3NzMyNzM1NH0.eWQgOecRwV1bEcayvcI6BiMa5Ssj_Lha5-CSNpdKoNY'
);

// Test connection with 'users' table
async function testSupabase() {
  try {
    const { data, error } = await supabase.from('users').select('*');
    console.log('Supabase Connected:', error, data);

    if (error) {
      document.body.innerHTML += `<p style="color:red;">Error: ${error.message}</p>`;
    } else {
      document.body.innerHTML += `<p style="color:green;">Connected successfully! ${data.length} users found.</p>`;
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    document.body.innerHTML += `<p style="color:red;">Unexpected error: ${err.message}</p>`;
  }
}

testSupabase();
