"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toBlob } from "html-to-image";

export default function DailyVerseWidget({ user }) {
  const [verse, setVerse] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  
  const cardRef = useRef(null); // Reference for the screenshot

  useEffect(() => {
    fetchDailyContent();
  }, []);

  async function fetchDailyContent() {
    // 1. Calculate Day of Year (1-365)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    let dayOfYear = Math.floor(diff / oneDay);
    if (dayOfYear > 365) dayOfYear = 365;

    // 2. Fetch from DB
    const { data } = await supabase
      .from('daily_devotionals')
      .select('verse_text, verse_reference')
      .eq('day_number', dayOfYear)
      .single();

    if (data) {
      setVerse(data);
      // 3. Cycle through 30 nature images (ensure you have 1.jpg to 30.jpg in public/verses/)
      const bgIndex = (dayOfYear % 30) + 1; 
      setBgImage(`/verses/${bgIndex}.jpg`);
    }
    setLoading(false);
  }

  // --- THE MAGIC SHARE FUNCTION ---
  async function handleShareImage() {
    if (!cardRef.current) return;
    setSharing(true);

    try {
      // 1. Convert the HTML Element to a Blob (Image)
      const blob = await toBlob(cardRef.current, { cacheBust: true });
      
      // 2. Create a File object
      const file = new File([blob], "daily-verse.png", { type: "image/png" });

      // 3. Share natively (Mobile/Desktop)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Daily Verse",
          text: `"${verse.verse_text}" - ${verse.verse_reference}\n\nVia The Believerse`,
        });
      } else {
        // Fallback: Download for desktop users who can't "share"
        const link = document.createElement("a");
        link.download = "daily-verse.png";
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    } catch (err) {
      console.error("Share failed:", err);
      alert("Could not share image. Please screenshot manually.");
    } finally {
      setSharing(false);
    }
  }

  if (loading) return <div style={{height: 300, background: '#eee', borderRadius: 12, animation: 'pulse 1.5s infinite'}}></div>;
  if (!verse) return null;

  return (
    <div className="panel-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: 'none', position: 'relative' }}>
      
      {/* 1. THE VISUAL CARD (This gets screenshot) */}
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
        {/* Dark Overlay for Readability */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
          <p style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'Georgia, serif', lineHeight: '1.5', marginBottom: '15px' }}>
            "{verse.verse_text}"
          </p>
          <p style={{ fontSize: '16px', fontWeight: '500', opacity: 0.9 }}>
            {verse.verse_reference}
          </p>
        </div>
        
        {/* Branding (Only visible on the image) */}
        <div style={{ position: 'absolute', bottom: 15, fontSize: '10px', opacity: 0.7, zIndex: 2 }}>
          The Believerse
        </div>
      </div>

      {/* 2. ACTION BUTTONS (Below the image) */}
      <div style={{ display: 'flex', borderTop: '1px solid #eee', background: 'white' }}>
        <button style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', borderRight: '1px solid #eee', color: '#555', fontWeight: 'bold' }}>
          🙏 Amen
        </button>
        <button 
          onClick={handleShareImage} 
          disabled={sharing}
          style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#0b2e4a', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
        >
          {sharing ? '⏳ Generating...' : '📢 Share Image'}
        </button>
      </div>
    </div>
  );
}