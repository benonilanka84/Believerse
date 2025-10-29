// app.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://wwwgodenqeelebbzofrd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3d2dvZGVucWVlbGViYnpvZnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTEzNTQsImV4cCI6MjA3NzMyNzM1NH0.eWQgOecRwV1bEcayvcI6BiMa5Ssj_Lha5-CSNpdKoNY'
const supabase = createClient(supabaseUrl, supabaseKey)

// Example test to check connection
async function testConnection() {
  const { data, error } = await supabase.from('test').select('*')
  console.log('Supabase Connected:', data, error)
}

testConnection()
