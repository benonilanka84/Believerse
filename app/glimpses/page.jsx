"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function GlimpsesPage() {
  const [mounted, setMounted] = useState(false);
  const [glimpses, setGlimpses] = useState([]);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Bless Modal State
  const [blessModalUser, setBlessModalUser] = useState(null);

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      loadGlimpses(data.user.id);
    }
  }

  async function loadGlimpses(userId) {
    // Fetch posts of type 'Glimpse' or videos
    const { data } = await supabase
      .from('posts')
      .select(`*, profiles(full_name, avatar_url, upi_id), amens(user_id)`)
      .eq('type', 'Glimpse')
      .order('created_at', { ascending: false });

    if (data) {
      const formatted = data.map(p => ({
        ...p,
        amenCount: p.amens.length,
        hasAmened: p.amens.some(a => a.user_id === userId)
      }));
      setGlimpses(formatted);
    }
  }

  // --- UPLOAD LOGIC ---
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Limit video size (e.g., 50MB) to save bandwidth
    if (file.size > 50 * 1024 * 1024) {
      alert("Video too large! Please keep it under 50MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `glimpse-${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from("posts").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("posts").getPublicUrl(fileName);

      // Create Post
      await supabase.from('posts').insert({
        user_id: user.id,
        content: "⚡ New Glimpse", // Default caption
        type: "Glimpse",
        media_url: urlData.publicUrl,
        media_type: "video"
      });

      alert("✅ Glimpse Uploaded!");
      loadGlimpses(user.id); // Refresh
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  // --- INTERACTIONS ---
  async function handleAmen(glimpseId, currentStatus) {
    // Optimistic UI
    setGlimpses(prev => prev.map(g => g.id === glimpseId ? { ...g, hasAmened: !currentStatus, amenCount: currentStatus ? g.amenCount - 1 : g.amenCount + 1 } : g));
    
    if (currentStatus) await supabase.from('amens').delete().match({ user_id: user.id, post_id: glimpseId });
    else await supabase.from('amens').insert({ user_id: user.id, post_id: glimpseId });
  }

  function handleBless(author) {
    if (!author?.upi_id) {
      alert(`User has not set up their UPI ID yet.`);
      return;
    }
    setBlessModalUser(author);
  }

  function handleShare(id) {
    if (navigator.share) navigator.share({ title: 'Check out this Glimpse!', url: window.location.href });
    else alert("Link copied!");
  }

  if (!mounted) return null;

  return (
    <div style={{ background: "#000", height: "100vh", width: "100%", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      
      {/* HEADER OVERLAY */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }}>
        <h2 style={{ color: "white", margin: 0, fontSize: "20px" }}>⚡ Glimpses</h2>
        <div style={{display:'flex', gap:'15px'}}>
           <button onClick={() => fileInputRef.current.click()} style={{ background: "#2e8b57", border: "none", color: "white", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
             {uploading ? "Uploading..." : "+ Upload"}
           </button>
           <button onClick={() => window.location.href='/dashboard'} style={{background:'rgba(255,255,255,0.2)', border:'none', color:'white', width:'35px', height:'35px', borderRadius:'50%', cursor:'pointer'}}>✕</button>
        </div>
        <input type="file" ref={fileInputRef} accept="video/*" style={{ display: "none" }} onChange={handleUpload} />
      </div>

      {/* VIDEO FEED CONTAINER */}
      <div style={{ flex: 1, overflowY: "scroll", scrollSnapType: "y mandatory", scrollBehavior: "smooth" }}>
        
        {glimpses.length === 0 ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexDirection:'column' }}>
            <div style={{fontSize:'50px', marginBottom:'20px'}}>🎥</div>
            <p>No Glimpses yet.</p>
            <p style={{fontSize:'13px', opacity:0.7}}>Be the first to upload a short video!</p>
          </div>
        ) : (
          glimpses.map((glimpse) => (
            <GlimpseItem key={glimpse.id} glimpse={glimpse} onAmen={() => handleAmen(glimpse.id, glimpse.hasAmened)} onBless={() => handleBless(glimpse.profiles)} onShare={() => handleShare(glimpse.id)} />
          ))
        )}

      </div>

      {/* BLESS MODAL */}
      {blessModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '350px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#0b2e4a' }}>Bless {blessModalUser.full_name}</h3>
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${blessModalUser.upi_id}&pn=${encodeURIComponent(blessModalUser.full_name)}&cu=INR`)}`} 
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
            <a 
              href={`upi://pay?pa=${blessModalUser.upi_id}&pn=${encodeURIComponent(blessModalUser.full_name)}&cu=INR`}
              target="_blank"
              style={{ display: 'block', width: '100%', padding: '12px', background: '#2e8b57', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', marginBottom: '10px' }}
            >
              Pay via UPI App
            </a>
            <button onClick={() => setBlessModalUser(null)} style={{ width: '100%', padding: '12px', background: '#ccc', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}

// --- INDIVIDUAL VIDEO COMPONENT ---
function GlimpseItem({ glimpse, onAmen, onBless, onShare }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // Auto-play when in view logic can be complex; simplified here to "click to play" for stability
  // Or use IntersectionObserver for true TikTok autoplay
  
  function togglePlay() {
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play();
      setPlaying(true);
    }
  }

  return (
    <div style={{ height: "100%", width: "100%", scrollSnapAlign: "start", position: "relative", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
      
      {/* VIDEO */}
      <video 
        ref={videoRef}
        src={glimpse.media_url} 
        loop 
        onClick={togglePlay}
        playsInline
        style={{ height: "100%", width: "100%", objectFit: "cover", cursor:'pointer' }} 
      />

      {/* PLAY ICON OVERLAY */}
      {!playing && (
        <div onClick={togglePlay} style={{position:'absolute', fontSize:'60px', color:'rgba(255,255,255,0.7)', pointerEvents:'none'}}>▶</div>
      )}

      {/* RIGHT SIDEBAR ACTIONS */}
      <div style={{ position: "absolute", right: "15px", bottom: "100px", display: "flex", flexDirection: "column", gap: "25px", alignItems: "center", zIndex: 5 }}>
        
        {/* Profile */}
        <div style={{ position: "relative" }}>
          <img src={glimpse.profiles?.avatar_url || '/images/default-avatar.png'} style={{ width: 45, height: 45, borderRadius: "50%", border: "2px solid white" }} />
          <div style={{ position: "absolute", bottom: -8, left: 14, background: "#ef4444", color: "white", width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>+</div>
        </div>

        {/* Amen */}
        <div style={{ textAlign: "center" }}>
          <button onClick={onAmen} style={{ background: "none", border: "none", fontSize: "32px", cursor: "pointer", textShadow: "0 2px 5px rgba(0,0,0,0.5)" }}>
            {glimpse.hasAmened ? "🙏" : "👐"}
          </button>
          <div style={{ color: "white", fontSize: "12px", fontWeight: "bold", textShadow: "0 1px 3px black" }}>{glimpse.amenCount}</div>
        </div>

        {/* Bless */}
        <div style={{ textAlign: "center" }}>
          <button onClick={onBless} style={{ background: "none", border: "none", fontSize: "32px", cursor: "pointer", textShadow: "0 2px 5px rgba(0,0,0,0.5)" }}>
            ✨
          </button>
          <div style={{ color: "white", fontSize: "12px", fontWeight: "bold", textShadow: "0 1px 3px black" }}>Bless</div>
        </div>

        {/* Share */}
        <div style={{ textAlign: "center" }}>
          <button onClick={onShare} style={{ background: "none", border: "none", fontSize: "32px", cursor: "pointer", textShadow: "0 2px 5px rgba(0,0,0,0.5)" }}>
            📢
          </button>
          <div style={{ color: "white", fontSize: "12px", fontWeight: "bold", textShadow: "0 1px 3px black" }}>Spread</div>
        </div>
      </div>

      {/* BOTTOM INFO */}
      <div style={{ position: "absolute", bottom: "20px", left: "15px", width: "70%", color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.8)", zIndex: 5 }}>
        <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>@{glimpse.profiles?.full_name}</h3>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.4" }}>{glimpse.content || "Watch this blessing! #Believerse"}</p>
        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", opacity: 0.8 }}>
          <span>🎵</span> Original Audio - The Believerse
        </div>
      </div>

    </div>
  );
}