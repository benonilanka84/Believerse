"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function GlimpsesPage() {
  const [mounted, setMounted] = useState(false);
  const [glimpses, setGlimpses] = useState([]);
  const [user, setUser] = useState(null);
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newGlimpseCaption, setNewGlimpseCaption] = useState("");
  const fileInputRef = useRef(null);
  
  // Interaction State
  const [blessModalUser, setBlessModalUser] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null); 
  
  // PLAYBACK STATE (Fixes overlapping audio)
  const [activeGlimpseId, setActiveGlimpseId] = useState(null);

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
      
      // Set the first video as active initially if it exists
      if (formatted.length > 0) {
        setActiveGlimpseId(formatted[0].id);
      }
    }
  }

  // --- UPLOAD ---
  async function handleFileUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !user) return;
    if (file.size > 50 * 1024 * 1024) { alert("Video too large! Max 50MB."); return; }

    setUploading(true);
    setIsUploadModalOpen(false); 
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `glimpse-${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("posts").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("posts").getPublicUrl(fileName);

      await supabase.from('posts').insert({
        user_id: user.id,
        content: newGlimpseCaption || "⚡ New Glimpse",
        type: "Glimpse",
        media_url: urlData.publicUrl,
        media_type: "video"
      });

      alert("✅ Glimpse Uploaded!");
      setNewGlimpseCaption("");
      loadGlimpses(user.id);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  }

  // --- ACTIONS ---
  async function handleDelete(glimpseId) {
    if(!confirm("Permanently delete this Glimpse?")) return;
    const { error } = await supabase.from('posts').delete().eq('id', glimpseId);
    if (!error) {
        setGlimpses(prev => prev.filter(g => g.id !== glimpseId));
        setOpenMenuId(null); 
    } else {
        alert("Error deleting: " + error.message);
    }
  }

  async function handleAmen(glimpse, currentStatus) {
    setGlimpses(prev => prev.map(g => g.id === glimpse.id ? { ...g, hasAmened: !currentStatus, amenCount: currentStatus ? g.amenCount - 1 : g.amenCount + 1 } : g));
    if (currentStatus) await supabase.from('amens').delete().match({ user_id: user.id, post_id: glimpse.id });
    else await supabase.from('amens').insert({ user_id: user.id, post_id: glimpse.id });
  }

  function handleBless(author) {
    if (!author?.upi_id) { alert(`User has not set up their UPI ID yet.`); return; }
    setBlessModalUser(author);
  }

  function handleShare() {
    if (navigator.share) navigator.share({ title: 'Glimpse', url: window.location.href });
    else alert("Link copied!");
  }
  
  function handleMenuAction(action, id) {
    setOpenMenuId(null);
    if (action === "NotInterested") {
        setGlimpses(prev => prev.filter(g => g.id !== id));
        alert("Video hidden.");
    } else {
        alert(`${action} triggered!`);
    }
  }

  if (!mounted) return null;

  return (
    <div style={{ background: "#000", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems:'center', position: "relative", overflow: "hidden" }}>
      
      {/* HEADER */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }}>
        <h2 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight:'bold' }}>⚡ Glimpses</h2>
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
           <button onClick={() => setIsUploadModalOpen(true)} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid white", color: "white", padding: "6px 15px", borderRadius: "20px", fontSize:'13px', cursor: "pointer", fontWeight:'bold' }}>
             {uploading ? "..." : "+ Upload"}
           </button>
           <button onClick={() => window.location.href='/dashboard'} style={{background:'none', border:'none', color:'white', fontSize:'24px', cursor:'pointer'}}>✕</button>
        </div>
      </div>

      {/* FEED CONTAINER - With ID for IntersectionObserver */}
      <div 
        id="glimpses-scroll-container"
        style={{ width: '100%', maxWidth: '480px', height: '100%', overflowY: "scroll", scrollSnapType: "y mandatory", scrollBehavior: "smooth", background:'#000', position:'relative' }}
      >
        {glimpses.length === 0 ? <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><p>No Glimpses yet.</p></div> : 
          glimpses.map((glimpse) => (
            <GlimpseItem 
              key={glimpse.id} 
              glimpse={glimpse} 
              isOwner={user && user.id === glimpse.user_id}
              onDelete={() => handleDelete(glimpse.id)}
              onAmen={handleAmen} 
              onBless={handleBless} 
              onShare={handleShare}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onMenuAction={handleMenuAction}
              // NEW: Pass active state
              isActive={glimpse.id === activeGlimpseId}
              setActiveGlimpseId={setActiveGlimpseId}
            />
          ))
        }
      </div>
      
      {/* UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '350px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#0b2e4a' }}>Upload New Glimpse</h3>
            <textarea 
              value={newGlimpseCaption} 
              onChange={e => setNewGlimpseCaption(e.target.value)} 
              placeholder="Add a caption..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px', marginBottom: '15px' }}
            />
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="video/*" 
              style={{ display: 'block', marginBottom: '20px' }} 
              onChange={() => fileInputRef.current.files.length > 0 && handleFileUpload()} 
            />
            <button onClick={() => setIsUploadModalOpen(false)} style={{ width: '100%', padding: '10px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* BLESS MODAL */}
      {blessModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
           <div style={{ background: 'white', padding: '25px', borderRadius: '16px', width: '85%', maxWidth: '320px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#0b2e4a' }}>Bless {blessModalUser.full_name}</h3>
            <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '12px', marginBottom: '15px' }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${blessModalUser.upi_id}&pn=${encodeURIComponent(blessModalUser.full_name)}&cu=INR`)}`} style={{ width: '100%', height: 'auto' }} />
            </div>
            <a href={`upi://pay?pa=${blessModalUser.upi_id}&pn=${encodeURIComponent(blessModalUser.full_name)}&cu=INR`} target="_blank" style={{ display: 'block', width: '100%', padding: '10px', background: '#2e8b57', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', marginBottom: '10px' }}>Open Payment App</a>
            <button onClick={() => setBlessModalUser(null)} style={{ width: '100%', padding: '10px', background: '#ccc', border: 'none', borderRadius: '8px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- GLIMPSE VIDEO ITEM (Updated for Audio Fix) ---
function GlimpseItem({ glimpse, isOwner, onDelete, onAmen, onBless, onShare, openMenuId, setOpenMenuId, onMenuAction, isActive, setActiveGlimpseId }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isMutedUI, setIsMutedUI] = useState(true);

  // 1. Intersection Observer: Detect when this video is in the center
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If 70% of the video is visible, set it as active
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          setActiveGlimpseId(glimpse.id);
        }
      },
      {
        root: document.getElementById('glimpses-scroll-container'),
        threshold: 0.7,
      }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [glimpse.id, setActiveGlimpseId]);

  // 2. Play/Pause based on 'isActive' prop
  useEffect(() => {
    if (videoRef.current) {
        if (isActive) {
            // Play if active
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {}); // Catch autoplay errors
            }
        } else {
            // Pause & Mute if not active (Prevent overlapping audio)
            videoRef.current.pause();
            videoRef.current.currentTime = 0; // Optional: restart video when scrolling back
        }
    }
  }, [isActive]);

  // 3. Play/Pause Toggle on Video Click
  function togglePlay() {
    if (videoRef.current) {
        if (videoRef.current.paused) videoRef.current.play();
        else videoRef.current.pause();
    }
  }

  // 4. Force Unmute Button
  function toggleMute(e) {
    e.stopPropagation(); // Stop click from pausing video
    if (videoRef.current) {
        // Direct DOM manipulation guarantees the browser listens
        videoRef.current.muted = !videoRef.current.muted;
        setIsMutedUI(videoRef.current.muted);
        if (!videoRef.current.muted) videoRef.current.volume = 1.0;
    }
  }
  
  const showMenu = openMenuId === glimpse.id;

  return (
    <div ref={containerRef} style={{ height: "100%", width: "100%", scrollSnapAlign: "start", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow:'hidden' }}>
      
      {/* VIDEO */}
      <video 
        ref={videoRef} 
        src={glimpse.media_url} 
        loop 
        playsInline 
        // Essential: Use defaultMuted so React doesn't lock the property
        defaultMuted={true} 
        onClick={togglePlay} 
        style={{ height: "100%", width: "100%", objectFit: "cover", cursor:'pointer' }} 
      />
      
      {/* MUTE TOGGLE (Top Left) */}
      <button 
        onClick={toggleMute} 
        style={{position:'absolute', top:20, left:20, background:'rgba(0,0,0,0.4)', color:'white', border:'none', padding:'8px 12px', borderRadius:'20px', zIndex:5, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', backdropFilter:'blur(5px)'}}
      >
        <span style={{fontSize:'16px'}}>{isMutedUI ? "🔇" : "🔊"}</span>
        <span style={{fontSize:'12px', fontWeight:'bold'}}>{isMutedUI ? "Tap to Unmute" : "On"}</span>
      </button>

      {/* RIGHT SIDEBAR (ACTIONS) */}
      <div style={{ position: "absolute", right: "10px", bottom: "120px", display: "flex", flexDirection: "column", gap: "25px", alignItems: "center", zIndex: 5 }}>
        
        {/* AVATAR */}
        <div style={{ position: "relative", marginBottom:'10px' }}>
          <img src={glimpse.profiles?.avatar_url || '/images/default-avatar.png'} style={{ width: 45, height: 45, borderRadius: "50%", border: "2px solid white", objectFit:'cover' }} />
        </div>

        {/* AMEN */}
        <div style={{ textAlign: "center" }}>
          <button onClick={() => onAmen(glimpse, glimpse.hasAmened)} style={{ background: "rgba(0,0,0,0.3)", borderRadius:'50%', width:'45px', height:'45px', border: "none", fontSize: "24px", cursor: "pointer", display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)' }}>
            {glimpse.hasAmened ? "🙏" : "👐"}
          </button>
          <div style={{ color: "white", fontSize: "12px", fontWeight: "bold", marginTop:'2px', textShadow:'0 1px 2px black' }}>{glimpse.amenCount}</div>
        </div>

        {/* BLESS */}
        <div style={{ textAlign: "center" }}>
          <button onClick={() => onBless(glimpse.profiles)} style={{ background: "rgba(0,0,0,0.3)", borderRadius:'50%', width:'45px', height:'45px', border: "none", fontSize: "24px", cursor: "pointer", display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)' }}>✨</button>
          <div style={{ color: "white", fontSize: "12px", fontWeight: "bold", marginTop:'2px', textShadow:'0 1px 2px black' }}>Bless</div>
        </div>

        {/* SHARE */}
        <div style={{ textAlign: "center" }}>
          <button onClick={onShare} style={{ background: "rgba(0,0,0,0.3)", borderRadius:'50%', width:'45px', height:'45px', border: "none", fontSize: "24px", cursor: "pointer", display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)' }}>📢</button>
          <div style={{ color: "white", fontSize: "12px", fontWeight: "bold", marginTop:'2px', textShadow:'0 1px 2px black' }}>Share</div>
        </div>

        {/* MENU (Three Dots) */}
        <div style={{ position:'relative' }}>
          <button 
            onClick={(e) => {e.stopPropagation(); setOpenMenuId(showMenu ? null : glimpse.id);}} 
            style={{ background: "rgba(0,0,0,0.3)", borderRadius:'50%', width:'40px', height:'40px', border: "none", fontSize: "20px", color:'white', cursor: "pointer", display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)' }}
          >
            ⋮
          </button>
          
          {/* MENU POPUP */}
          {showMenu && (
            <div style={{ position: 'absolute', right: 50, bottom: 0, background: 'white', borderRadius: '12px', width: '180px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', animation: 'fadeIn 0.2s ease' }}>
              <button onClick={() => onMenuAction("Save", glimpse.id)} style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #eee', color:'#333' }}>💾 Save to Playlist</button>
              <button onClick={() => onMenuAction("Captions", glimpse.id)} style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #eee', color:'#333' }}>🅰️ Captions</button>
              <button onClick={() => onMenuAction("NotInterested", glimpse.id)} style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #eee', color:'#333' }}>🙈 Not Interested</button>
              
              {/* DELETE (Only for Creator) */}
              {isOwner ? (
                <button onClick={onDelete} style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: '#fff5f5', cursor: 'pointer', color: 'red', fontSize: '13px', fontWeight:'bold' }}>🗑️ Delete</button>
              ) : (
                <button onClick={() => onMenuAction("Report", glimpse.id)} style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', color: '#ff8800', fontSize: '13px' }}>🚩 Report</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM INFO */}
      <div style={{ position: "absolute", bottom: "0", left: "0", width: "100%", padding: "20px", background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', zIndex: 4, pointerEvents:'none' }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color:'white', textShadow:'0 1px 2px black' }}>@{glimpse.profiles?.full_name}</h3>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.4", color:'white', textShadow:'0 1px 2px black', maxWidth:'80%' }}>{glimpse.content}</p>
      </div>
    </div>
  );
}