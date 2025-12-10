"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function GlimpsesPage() {
  const [mounted, setMounted] = useState(false);
  const [glimpses, setGlimpses] = useState([]);
  const [user, setUser] = useState(null);
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newGlimpseCaption, setNewGlimpseCaption] = useState("");
  const fileInputRef = useRef(null);
  
  // Modal States
  const [blessModalUser, setBlessModalUser] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null); // Track which video's menu is open

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
    }
  }

  // --- UPLOAD HANDLER ---
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
    if(!confirm("Delete this Glimpse?")) return;
    await supabase.from('posts').delete().eq('id', glimpseId);
    setGlimpses(prev => prev.filter(g => g.id !== glimpseId));
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
  
  // --- MENU ACTIONS ---
  function handleSaveToPlaylist(id) { setOpenMenuId(null); alert("Saved to Playlist (Mock)"); }
  function handleToggleCaptions(id) { setOpenMenuId(null); alert("Captions Toggled (Mock)"); }
  function handleNotInterested(id) { 
    setOpenMenuId(null); 
    setGlimpses(prev => prev.filter(g => g.id !== id)); 
    alert("This video is now hidden."); 
  }
  function handleReport(id) { setOpenMenuId(null); alert("Reported for review."); }


  if (!mounted) return null;

  return (
    <div style={{ background: "#000", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems:'center', position: "relative", overflow: "hidden" }}>
      
      {/* HEADER */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
        <h2 style={{ color: "white", margin: 0, fontSize: "18px", fontWeight:'bold', textShadow:'0 2px 4px rgba(0,0,0,0.5)' }}>⚡ Glimpses</h2>
        <div style={{display:'flex', gap:'10px'}}>
           <button onClick={() => setIsUploadModalOpen(true)} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid white", color: "white", padding: "6px 12px", borderRadius: "20px", fontSize:'12px', cursor: "pointer" }}>
             {uploading ? "..." : "+ Upload"}
           </button>
           <button onClick={() => window.location.href='/dashboard'} style={{background:'rgba(0,0,0,0.5)', border:'none', color:'white', width:'30px', height:'30px', borderRadius:'50%', cursor:'pointer'}}>✕</button>
        </div>
      </div>

      {/* FEED */}
      <div style={{ width: '100%', maxWidth: '450px', height: '100%', overflowY: "scroll", scrollSnapType: "y mandatory", scrollBehavior: "smooth", background:'#111', position:'relative' }}>
        {glimpses.length === 0 ? <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><p>No Glimpses yet. Be the first!</p></div> : 
          glimpses.map((glimpse) => (
            <GlimpseItem 
              key={glimpse.id} 
              glimpse={glimpse} 
              isOwner={user && user.id === glimpse.user_id}
              onDelete={handleDelete}
              onAmen={handleAmen} 
              onBless={handleBless} 
              onShare={handleShare}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              // Menu Actions
              onSave={() => handleSaveToPlaylist(glimpse.id)}
              onCaptions={() => handleToggleCaptions(glimpse.id)}
              onNotInterested={() => handleNotInterested(glimpse.id)}
              onReport={() => handleReport(glimpse.id)}
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

function GlimpseItem({ glimpse, isOwner, onDelete, onAmen, onBless, onShare, openMenuId, setOpenMenuId, onSave, onCaptions, onNotInterested, onReport }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);

  function togglePlay() {
    if (playing) { videoRef.current.pause(); setPlaying(false); } 
    else { videoRef.current.play(); setPlaying(true); }
  }
  
  const showMenu = openMenuId === glimpse.id;

  return (
    <div style={{ height: "100%", width: "100%", scrollSnapAlign: "start", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow:'hidden' }}>
      <video ref={videoRef} src={glimpse.media_url} loop muted={muted} playsInline autoPlay onClick={togglePlay} style={{ height: "100%", width: "100%", objectFit: "cover", cursor:'pointer' }} />
      
      <button onClick={(e) => {e.stopPropagation(); setMuted(!muted);}} style={{position:'absolute', top:20, left:20, background:'rgba(0,0,0,0.5)', color:'white', border:'none', padding:'5px 10px', borderRadius:'20px', zIndex:5, cursor:'pointer'}}>{muted ? "🔇 Unmute" : "🔊"}</button>
      
      {/* 3-DOT MENU */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 6 }}>
        <button 
          onClick={(e) => {e.stopPropagation(); setOpenMenuId(showMenu ? null : glimpse.id);}} 
          style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '20px', fontSize: '18px', cursor: 'pointer' }}
        >
          ⋮
        </button>
        {showMenu && (
          <div style={{ position: 'absolute', right: 0, top: '40px', background: 'white', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', borderRadius: '8px', zIndex: 10, width: '160px', overflow: 'hidden' }}>
            <button onClick={onSave} style={{ width: '100%', padding: '10px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #eee' }}>💾 Save to Playlist</button>
            <button onClick={onCaptions} style={{ width: '100%', padding: '10px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #eee' }}>🅰️ Captions</button>
            <button onClick={onNotInterested} style={{ width: '100%', padding: '10px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #eee' }}>🙈 Not Interested</button>
            {isOwner ? (
                <button onClick={() => { setOpenMenuId(null); onDelete(glimpse.id); }} style={{ width: '100%', padding: '10px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', color: 'red', fontSize: '13px' }}>🗑️ Delete</button>
            ) : (
                <button onClick={onReport} style={{ width: '100%', padding: '10px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', color: '#ff8800', fontSize: '13px' }}>🚩 Report</button>
            )}
          </div>
        )}
      </div>

      {!playing && <div onClick={togglePlay} style={{position:'absolute', fontSize:'60px', color:'rgba(255,255,255,0.7)', pointerEvents:'none', zIndex:4}}>▶</div>}

      <div style={{ position: "absolute", right: "10px", bottom: "100px", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", zIndex: 5 }}>
        <div style={{ position: "relative" }}><img src={glimpse.profiles?.avatar_url || '/images/default-avatar.png'} style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid white" }} /></div>
        <div style={{ textAlign: "center" }}><button onClick={() => onAmen(glimpse, glimpse.hasAmened)} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", textShadow: "0 2px 5px rgba(0,0,0,0.5)" }}>{glimpse.hasAmened ? "🙏" : "👐"}</button><div style={{ color: "white", fontSize: "11px", fontWeight: "bold", textShadow: "0 1px 3px black" }}>{glimpse.amenCount}</div></div>
        <div style={{ textAlign: "center" }}><button onClick={() => onBless(glimpse.profiles)} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", textShadow: "0 2px 5px rgba(0,0,0,0.5)" }}>✨</button><div style={{ color: "white", fontSize: "11px", fontWeight: "bold", textShadow: "0 1px 3px black" }}>Bless</div></div>
        <div style={{ textAlign: "center" }}><button onClick={onShare} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", textShadow: "0 2px 5px rgba(0,0,0,0.5)" }}>📢</button><div style={{ color: "white", fontSize: "11px", fontWeight: "bold", textShadow: "0 1px 3px black" }}>Share</div></div>
      </div>

      <div style={{ position: "absolute", bottom: "20px", left: "15px", width: "75%", color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.8)", zIndex: 5 }}>
        <h3 style={{ margin: "0 0 5px 0", fontSize: "15px" }}>@{glimpse.profiles?.full_name?.split(' ')[0]}</h3>
        <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.4" }}>{glimpse.content || "#Believerse"}</p>
      </div>
    </div>
  );
}