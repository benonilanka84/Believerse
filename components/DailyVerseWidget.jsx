"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toBlob } from "html-to-image";

export default function DailyVerseWidget() {
  const [verse, setVerse] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [amenCount, setAmenCount] = useState(0);
  const [hasAmened, setHasAmened] = useState(false);
  
  const cardRef = useRef(null);

  useEffect(() => {
    fetchDailyContent();
  }, []);

  async function fetchDailyContent() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    let safeDay = dayOfYear || 1;
    if (safeDay > 365) safeDay = 365;

    const { data } = await supabase
      .from('daily_devotionals')
      .select('verse_text, verse_reference')
      .eq('day_number', safeDay)
      .single();

    if (data) {
      setVerse(data);
      const TOTAL_IMAGES = 30; 
      const bgIndex = (safeDay % TOTAL_IMAGES) + 1; 
      setBgImage(`/verses/${bgIndex}.jpg`);
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

  // --- UPDATED MARKETING-FIRST SHARE LOGIC ---
  async function handleSpread() {
    if (!cardRef.current) return;
    setSharing(true);

    try {
      // 1. Generate the image blob
      const blob = await toBlob(cardRef.current, { cacheBust: true });
      const file = new File([blob], "daily-verse.png", { type: "image/png" });
      
      // 2. Marketing Text with platform URL
      const shareText = `"${verse.verse_text}" - ${verse.verse_reference}\n\nJoin our global sanctuary for edification and fellowship: https://www.thebelieverse.com`;

      // 3. Share with file attachment (Triggers Image preview in WhatsApp)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "The Believerse Daily Verse",
          text: shareText,
        });
      } else {
        // Desktop/Browser Fallback
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        alert("✅ Verse Image copied! Paste it into WhatsApp with our link: https://www.thebelieverse.com");
      }
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setSharing(false);
    }
  }

  if (loading) return <div style={{height: 350, background: '#f0f0f0', borderRadius: 12, marginBottom: 20}}></div>;
  if (!verse) return null;

  return (
    <div className="panel-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: 'none', position: 'relative', marginBottom: '20px' }}>
      <div 
        ref={cardRef}
        style={{
          height: '350px',
          backgroundImage: `url('${bgImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '30px',
          textAlign: 'center',
          color: 'white',
          position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
          <p style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'Georgia, serif', lineHeight: '1.5', marginBottom: '15px' }}>
            "{verse.verse_text}"
          </p>
          <p style={{ fontSize: '16px', fontWeight: '500', opacity: 0.9 }}>
            {verse.verse_reference}
          </p>
        </div>
        <div style={{ position: 'absolute', bottom: 15, fontSize: '10px', opacity: 0.7, zIndex: 2 }}>
          The Believerse
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', background: 'white' }}>
        <button 
          onClick={handleAmen}
          style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: hasAmened ? '#2e8b57' : '#555', fontWeight: 'bold' }}
        >
          🙏 Amen ({amenCount})
        </button>
        <button 
          onClick={handleSpread} 
          disabled={sharing}
          style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#0b2e4a', fontWeight: 'bold' }}
        >
          {sharing ? '⏳ Preparing...' : '📢 Spread'}
        </button>
      </div>
    </div>
  );
}