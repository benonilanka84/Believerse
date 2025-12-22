"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import * as tus from "tus-js-client"; // Import TUS for Bunny Uploads

export default function GlimpsesPage() {
  const [mounted, setMounted] = useState(false);
  const [glimpses, setGlimpses] = useState([]);
  const [user, setUser] = useState(null);
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [newGlimpseCaption, setNewGlimpseCaption] = useState("");
  const fileInputRef = useRef(null);
  
  // Interaction State
  const [blessModalUser, setBlessModalUser] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null); 
  
  // PLAYBACK STATE
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
       
      if (formatted.length > 0) {
        setActiveGlimpseId(formatted[0].id);
      }
    }
  }

  // --- NEW BUNNY UPLOAD LOGIC ---
  async function handleFileUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !user) return;

    if (file.size > 500 * 1024 * 1024) { alert("File too large! Max 500MB."); return; }

    setUploading(true);
    setUploadProgress(0);
     
    try {
      let uploadedUrl = null;

      // 1. Get Signature from your API
      const response = await fetch('/api/video/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newGlimpseCaption || "Glimpse" })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to init upload");
      }
       
      const { videoId, libraryId, signature, expirationTime } = await response.json();

      // 2. Upload to Bunny via TUS
      uploadedUrl = await new Promise((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: "https://video.bunnycdn.com/tusupload",
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            AuthorizationSignature: signature,
            AuthorizationExpire: expirationTime,
            VideoId: videoId,
            LibraryId: libraryId,
          },
          metadata: {
            filetype: file.type,
            title: newGlimpseCaption || "Glimpse",
          },
          onError: (error) => reject(error),
          onProgress: (bytesUploaded, bytesTotal) => {
            const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(0);
            setUploadProgress(Number(percentage));
          },
          onSuccess: () => {
            const embedUrl = `https://iframe.mediadelivery.net/play/${libraryId}/${videoId}`;
            resolve(embedUrl);
          },
        });
        upload.start();
      });

      // 3. Insert into Supabase
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: newGlimpseCaption || "⚡ New Glimpse",
        type: "Glimpse",
        media_url: uploadedUrl,
        media_type: "video"
      });

      if (error) throw error;

      alert("✅ Glimpse Uploaded!");
      setNewGlimpseCaption("");
      setUploadProgress(0);
      setIsUploadModalOpen(false); 
      loadGlimpses(user.id);

    } catch (err) {
      console.error(err);
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
    // FIX APPLIED: Use 100dvh for better mobile browser support
    <div style={{ background: "#000", height: "100dvh", width: "100vw", display: "flex", flexDirection: "column", alignItems:'center', position: "relative", overflow: "hidden" }}>
       
      {/* HEADER */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }}>
        <h2 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight:'bold' }}>⚡ Glimpses</h2>
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
           <button onClick={() => setIsUploadModalOpen(true)} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid white", color: "white", padding: "6px 15px", borderRadius: "20px", fontSize:'13px', cursor: "pointer", fontWeight:'bold' }}>
             + Upload
           </button>
           <button onClick={() => window.location.href='/dashboard'} style={{background:'none', border:'none', color:'white', fontSize:'24px', cursor:'pointer'}}>✕</button>
        </div>
      </div>

      {/* FEED CONTAINER */}
      <div 
        id="glimpses-scroll-container"
        style={{ width: '100%', maxWidth: '480px', height: '100%', overflowY: "scroll", scrollSnapType: "y mandatory", scrollBehavior: "smooth", background:'#000', position:'relative', scrollbarWidth: 'none' }}
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
              disabled={uploading}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px', marginBottom: '15px' }}
            />
            
            {!uploading && (
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="video/*" 
                  style={{ display: 'block', marginBottom: '20px' }} 
                  onChange={() => fileInputRef.current.files.length > 0 && handleFileUpload()} 
                />
            )}

            {/* Upload Progress Bar */}
            {uploading && (
                <div style={{marginBottom: '20px'}}>
                    <div style={{marginBottom:'5px', fontSize:'14px', color:'#2e8b57', fontWeight:'bold'}}>Uploading: {uploadProgress}%</div>
                    <div style={{width:'100%', height:'8px', background:'#eee', borderRadius:'4px'}}>
                        <div style={{width: `${uploadProgress}%`, height:'100%', background:'#2e8b57', borderRadius:'4px', transition:'width 0.3s'}}></div>
                    </div>
                </div>
            )}

            <button disabled={uploading} onClick={() => setIsUploadModalOpen(false)} style={{ width: '100%', padding: '10px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: uploading ? 'not-allowed' : 'pointer' }}>Cancel</button>
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

// --- GLIMPSE VIDEO ITEM ---

function GlimpseItem({ glimpse, isOwner, onDelete, onAmen, onBless, onShare, openMenuId, setOpenMenuId, onMenuAction, isActive, setActiveGlimpseId }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) { 
          setActiveGlimpseId(glimpse.id);
        }
      },
      { root: document.getElementById('glimpses-scroll-container'), threshold: 0.6 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => { if (containerRef.current) observer.unobserve(containerRef.current); };
  }, [glimpse.id, setActiveGlimpseId]);

  useEffect(() => {
    if (videoRef.current) {
        if (isActive) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) playPromise.catch(() => {});
        } else {
            videoRef.current.pause();
            videoRef.current.currentTime = 0; 
        }
    }
  }, [isActive]);

  function togglePlay() {
    if (videoRef.current) {
        if (videoRef.current.paused) videoRef.current.play();
        else videoRef.current.pause();
    }
  }
   
  const showMenu = openMenuId === glimpse.id;
  const isBunnyVideo = glimpse.media_url?.includes("iframe.mediadelivery.net") || glimpse.media_url?.includes("video.bunnycdn");

  async function handleBlessClick() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.country_code !== "IN") {
        alert("🌍 International Blessing is coming soon!\n\nCurrently, direct blessings are available for UPI (India) users only.");
        return;
      }
      onBless(glimpse.profiles);
    } catch (err) {
      onBless(glimpse.profiles);
    }
  }

  return (
    // FIX APPLIED: Force full height and width
    <div ref={containerRef} style={{ height: "100%", width: "100%", scrollSnapAlign: "start", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow:'hidden', background:'black' }}>
       
      {/* VIDEO LAYER */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        {isBunnyVideo ? (
           <iframe 
             src={glimpse.media_url + "?autoplay=true&loop=true&muted=false&preload=true"}
             loading="lazy"
             // FIX APPLIED: object-fit cover simulation for iframes (width/height 100% on wrapper handles most, but ensuring styles here)
             style={{ border: 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1, objectFit: 'cover' }}
             allow="accelerometer; gyroscope; autoplay; encrypted-media;"
             allowFullScreen
           />
        ) : (
           <video 
             ref={videoRef} 
             src={glimpse.media_url} 
             loop 
             playsInline 
             defaultMuted={true} 
             onClick={togglePlay} 
             // FIX APPLIED: Ensure object-cover is active to fill screen
             style={{ height: "100%", width: "100%", objectFit: "cover", cursor:'pointer', position: 'absolute', top: 0, left: 0 }} 
           />
        )}
      </div>
       
      {/* OVERLAYS (UI) */}
      <div style={{ position: "absolute", right: "10px", bottom: "120px", display: "flex", flexDirection: "column", gap: "25px", alignItems: "center", zIndex: 10, pointerEvents: 'auto' }}>
        
        {/* Avatar */}
        <div style={{ position: "relative", marginBottom:'10px' }}>
          <img src={glimpse.profiles?.avatar_url || '/images/default-avatar.png'} style={{ width: 45, height: 45, borderRadius: "50%", border: "2px solid white", objectFit:'cover' }} />
        </div>

        {/* Amen Button */}
        <div style={{ textAlign: "center" }}>
          <button onClick={() => onAmen(glimpse, glimpse.hasAmened)} style={{ background: "rgba(0,0,0,0.3)", borderRadius:'50%', width:'45px', height:'45px', border: "none", fontSize: "24px", cursor: "pointer", display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)', color:'white' }}>
            {glimpse.hasAmened ? "🙏" : "👐"}
          </button>
          <div style={{ color: "white", fontSize: "12px", fontWeight: "bold", marginTop:'2px', textShadow:'0 1px 2px black' }}>{glimpse.amenCount}</div>
        </div>

        {/* Bless Button */}
        <div style={{ textAlign: "center" }}>
          <button onClick={handleBlessClick} style={{ background: "rgba(0,0,0,0.3)", borderRadius:'50%', width:'45px', height:'45px', border: "none", fontSize: "24px", cursor: "pointer", display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)' }}>✨</button>
          <div style={{ color: "white", fontSize: "12px", fontWeight: "bold", marginTop:'2px', textShadow:'0 1px 2px black' }}>Bless</div>
        </div>

        {/* Share Button */}
        <div style={{ textAlign: "center" }}>
          <button onClick={onShare} style={{ background: "rgba(0,0,0,0.3)", borderRadius:'50%', width:'45px', height:'45px', border: "none", fontSize: "24px", cursor: "pointer", display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)' }}>📢</button>
          <div style={{ color: "white", fontSize: "12px", fontWeight: "bold", marginTop:'2px', textShadow:'0 1px 2px black' }}>Share</div>
        </div>

        {/* Menu Button */}
        <div style={{ position:'relative' }}>
          <button 
            onClick={(e) => {e.stopPropagation(); setOpenMenuId(showMenu ? null : glimpse.id);}} 
            style={{ background: "rgba(0,0,0,0.3)", borderRadius:'50%', width:'40px', height:'40px', border: "none", fontSize: "20px", color:'white', cursor: "pointer", display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)' }}
          >
            ⋮
          </button>
          {showMenu && (
            <div style={{ position: 'absolute', right: 50, bottom: 0, background: 'white', borderRadius: '12px', width: '180px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', animation: 'fadeIn 0.2s ease' }}>
              <button onClick={() => onMenuAction("Save", glimpse.id)} style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #eee', color:'#333' }}>💾 Save to Playlist</button>
              <button onClick={() => onMenuAction("Captions", glimpse.id)} style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #eee', color:'#333' }}>🅰️ Captions</button>
              <button onClick={() => onMenuAction("NotInterested", glimpse.id)} style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #eee', color:'#333' }}>🙈 Not Interested</button>
              {isOwner ? (
                <button onClick={onDelete} style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: '#fff5f5', cursor: 'pointer', color: 'red', fontSize: '13px', fontWeight:'bold' }}>🗑️ Delete</button>
              ) : (
                <button onClick={() => onMenuAction("Report", glimpse.id)} style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', color: '#ff8800', fontSize: '13px' }}>🚩 Report</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info */}
      <div style={{ position: "absolute", bottom: "0", left: "0", width: "100%", padding: "20px", background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', zIndex: 4, pointerEvents:'none' }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color:'white', textShadow:'0 1px 2px black' }}>@{glimpse.profiles?.full_name}</h3>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.4", color:'white', textShadow:'0 1px 2px black', maxWidth:'80%' }}>{glimpse.content}</p>
      </div>
    </div>
  );
}