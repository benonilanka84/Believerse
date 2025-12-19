"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { verseDatabase } from "@/lib/data/verseDatabase";
import { prayerDatabase } from "@/lib/data/prayerDatabase";

export default function SeedPage() {
  const [status, setStatus] = useState("Ready to upload");
  const [progress, setProgress] = useState(0);

  async function handleUpload() {
    if (!confirm("Are you sure? This will overwrite data in 'daily_devotionals'.")) return;
    
    setStatus("Preparing data...");
    
    try {
      // 1. Merge the two databases based on ID (Day Number)
      const combinedData = [];
      const totalDays = 365;

      for (let i = 1; i <= totalDays; i++) {
        const verse = verseDatabase.find(v => v.id === i);
        const prayer = prayerDatabase.find(p => p.id === i);

        if (verse && prayer) {
          combinedData.push({
            day_number: i,
            verse_text: verse.text,
            verse_reference: verse.reference,
            verse_topic: verse.topic,
            prayer_title: prayer.title,
            prayer_text: prayer.text,
            prayer_category: prayer.category
          });
        }
      }

      console.log(`Prepared ${combinedData.length} records.`);
      setStatus(`Uploading ${combinedData.length} days of content...`);

      // 2. Upload in batches of 50 to prevent timeouts
      const batchSize = 50;
      for (let i = 0; i < combinedData.length; i += batchSize) {
        const batch = combinedData.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('daily_devotionals')
          .upsert(batch, { onConflict: 'day_number' });

        if (error) throw error;
        
        setProgress(Math.min(i + batchSize, combinedData.length));
      }

      setStatus("✅ Success! Database seeded successfully.");

    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + err.message);
    }
  }

  return (
    <div style={{ padding: 50, maxWidth: 600, margin: "0 auto", textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Database Seeder</h1>
      <p style={{color: '#666', marginBottom: 30}}>
        This tool will combine your <b>Verse Database</b> and <b>Prayer Database</b> 
        and upload them to Supabase as 365 daily entries.
      </p>
      
      <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, marginBottom: 20 }}>
        <div><strong>Verses Found:</strong> {verseDatabase.length}</div>
        <div><strong>Prayers Found:</strong> {prayerDatabase.length}</div>
      </div>

      <button 
        onClick={handleUpload} 
        style={{ 
          background: '#0b2e4a', color: 'white', border: 'none', 
          padding: '15px 30px', fontSize: '16px', borderRadius: 8, cursor: 'pointer' 
        }}
      >
        🚀 Start Upload
      </button>

      <div style={{ marginTop: 30, fontWeight: 'bold', fontSize: 18, color: status.includes("Error") ? "red" : "#2e8b57" }}>
        {status}
      </div>
      
      {progress > 0 && (
        <div style={{ marginTop: 10, color: '#666' }}>
          Progress: {progress} / 365
        </div>
      )}
    </div>
  );
}