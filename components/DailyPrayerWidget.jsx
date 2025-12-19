"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toBlob } from "html-to-image";

export default function DailyPrayerWidget() {
  const [prayer, setPrayer] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [amenCount, setAmenCount] = useState(0);
  const [hasAmened, setHasAmened] = useState(false);
  
  const cardRef = useRef(null);

  useEffect(() => {
    fetchDailyPrayer();
  }, []);

  async function fetchDailyPrayer() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    
    // Safety check for day number
    let safeDay = dayOfYear;
    if (safeDay > 365) safeDay = 365;
    if (safeDay < 1) safeDay = 1;

    const { data } = await supabase
      .from('daily_devotionals')
      .select('prayer_title, prayer_text')
      .eq('day_number', safeDay)
      .single();

    if (data) {
      setPrayer(data);
      const bgIndex = (safeDay % 30) + 1; 
      setBgImage(`/prayers/${bgIndex}.jpg`);
    }
    setLoading(false);
  }

  function handleAmen() {
    if (hasAmened) {
      setAmenCount(c => c - 1);
      setHasAmened(false);
    } else {
      setAmenCount(c => c + 1);
      setHasAmened(true);
    }
  }

// ... inside DailyPrayerWidget component ...

  // --- SMART SHARE LOGIC ---
  async function handleSpread() {
    if (!cardRef.current) return;
    setSharing(true);

    try {
      // 1. Generate Image
      const blob = await toBlob(cardRef.current, { cacheBust: true });
      const file = new File([blob], "daily-prayer.png", { type: "image/png" });

      // 2. Try Native Share (Mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Daily Prayer",
          text: prayer.prayer_title
        });
      } else {
        // 3. Desktop Fallback: Clipboard
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob })
          ]);
          alert("✅ Prayer copied to clipboard!\n\nJust Paste (Ctrl+V) it into WhatsApp or Social Media.");
        } catch (clipboardErr) {
          // 4. Download Fallback
          const link = document.createElement("a");
          link.download = "daily-prayer.png";
          link.href = URL.createObjectURL(blob);
          link.click();
          alert("✅ Prayer downloaded!");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Share failed.");
    } finally {
      setSharing(false);
    }
  }

  if (loading) return null;
  if (!prayer) return null;

  return (
    <div className="panel-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: 'none', position: 'relative', marginTop: '20px' }}>
      
      <div 
        ref={cardRef}
        style={{
          height: '400px',
          backgroundImage: `url('${bgImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          textAlign: 'center',
          color: 'white',
          position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(20, 20, 40, 0.6)', zIndex: 1 }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, marginBottom: '10px' }}>
            Daily Prayer
          </h3>
          <h2 style={{ fontSize: '22px', marginBottom: '20px', fontFamily: 'sans-serif' }}>
            {prayer.prayer_title}
          </h2>
          <p style={{ fontSize: '16px', lineHeight: '1.6', fontStyle: 'italic' }}>
            "{prayer.prayer_text}"
          </p>
          <div style={{ marginTop: '20px', fontSize: '14px', fontWeight: 'bold' }}>
            In Jesus' Name, Amen.
          </div>
        </div>
        
        <div style={{ position: 'absolute', bottom: 15, fontSize: '10px', opacity: 0.7, zIndex: 2 }}>
          The Believerse
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', background: '#0b2e4a' }}>
        <button 
          onClick={handleAmen}
          style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: hasAmened ? '#2e8b57' : 'white', fontWeight: 'bold' }}
        >
          🙏 Amen ({amenCount})
        </button>
        <button 
          onClick={handleSpread} 
          disabled={sharing}
          style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}
        >
          {sharing ? '⏳ Creating...' : '📢 Spread'}
        </button>
      </div>
    </div>
  );
}