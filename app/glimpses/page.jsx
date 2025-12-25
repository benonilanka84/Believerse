"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import * as tus from "tus-js-client";
import Link from "next/link";

export default function GlimpsesPage() {
  const [mounted, setMounted] = useState(false);
  const [glimpses, setGlimpses] = useState([]);
  const [user, setUser] = useState(null);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [newGlimpseCaption, setNewGlimpseCaption] = useState("");
  const fileInputRef = useRef(null);
  
  const [blessModalUser, setBlessModalUser] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null); 
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
      .select(`*, profiles(id, full_name, avatar_url, upi_id), amens(user_id)`)
      .eq('type', 'Glimpse')
      .order('created_at', { ascending: false });

    if (data) {
      const formatted = data.map(p => ({
        ...p,
        amenCount: p.amens?.length || 0,
        hasAmened: p.amens?.some(a => a.user_id === userId) || false
      }));
      setGlimpses(formatted);
       
      if (formatted.length > 0) {
        setActiveGlimpseId(formatted[0].id);
      }
    }
  }

  async function handleFileUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setUploadProgress(0);
     
    try {
      const response = await fetch('/api/video/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newGlimpseCaption || "Glimpse" })
      });

      if (!response.ok) throw new Error("Failed to init upload");
       
      const { videoId, libraryId, signature, expirationTime } = await response.json();

      const uploadedUrl = await new Promise((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: "https://video.bunnycdn.com/tusupload",
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            AuthorizationSignature: signature,
            AuthorizationExpire: expirationTime,
            VideoId: videoId,
            LibraryId: libraryId,
          },
          onError: (error) => reject(error),
          onProgress: (bytesUploaded, bytesTotal) => {
            setUploadProgress(Number(((bytesUploaded / bytesTotal) * 100).toFixed(0)));
          },
          onSuccess: () => resolve(`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`),
        });
        upload.start();
      });

      await supabase.from('posts').insert({
        user_id: user.id,
        content: newGlimpseCaption,
        type: "Glimpse",
        media_url: uploadedUrl,
        media_type: "video"
      });

      alert("✅ Glimpse Uploaded!");
      setIsUploadModalOpen(false); 
      setNewGlimpseCaption("");
      loadGlimpses(user.id);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(glimpseId) {
    if(!confirm("Permanently delete this Glimpse?")) return;
    const { error } = await supabase.from('posts').delete().eq('id', glimpseId);
    if (!error) {
        setGlimpses(prev => prev.filter(g => g.id !== glimpseId));
        setOpenMenuId(null); 
    }
  }

  async function handleAmen(glimpse, currentStatus) {
    setGlimpses(prev => prev.map(g => g.id === glimpse.id ? { ...g, hasAmened: !currentStatus, amenCount: currentStatus ? g.amenCount - 1 : g.amenCount + 1 } : g));
    if (currentStatus) await supabase.from('amens').delete().match({ user_id: user.id, post_id: glimpse.id });
    else await supabase.from('amens').insert({ user_id: user.id, post_id: glimpse.id });
  }

  if (!mounted) return null;

  return (
    <div style={{ background: "#000", height: "100dvh", width: "100vw", display: "flex", flexDirection: "column", alignItems:'center', position: "relative", overflow: "hidden" }}>
       
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }}>
        <h2 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight:'bold' }}>⚡ Glimpses</h2>
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
           <button onClick={() => setIsUploadModalOpen(true)} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid white", color: "white", padding: "6px 15px", borderRadius: "20px", fontSize:'13px', cursor: "pointer", fontWeight:'bold' }}>+ Upload</button>
           <Link href="/dashboard" style={{color:'white', fontSize:'24px', textDecoration:'none'}}>✕</Link>
        </div>
      </div>

      <div id="glimpses-scroll-container" style={{ width: '100%', maxWidth: '480px', height: '100%', overflowY: "scroll", scrollSnapType: "y mandatory", scrollbarWidth: 'none' }}>
        {glimpses.map((glimpse) => (
          <GlimpseItem 
            key={glimpse.id} 
            glimpse={glimpse} 
            user={user}
            isActive={glimpse.id === activeGlimpseId}
            setActiveGlimpseId={setActiveGlimpseId}
            onAmen={handleAmen}
            setBlessModalUser={setBlessModalUser}
            onDelete={handleDelete}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
          />
        ))}
      </div>
       
      {/* UPLOAD MODAL - Fixed Visibility */}
      {isUploadModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '350px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, color: '#0b2e4a' }}>Upload New Glimpse</h3>
            <textarea 
              value={newGlimpseCaption} 
              onChange={e => setNewGlimpseCaption(e.target.value)} 
              placeholder="Add a caption..." 
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px', color:'#333' }} 
            />
            <input type="file" ref={fileInputRef} accept="video/*" style={{ marginBottom: '20px', width: '100%' }} />
            {uploading && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '6px', overflow: 'hidden', marginBottom: '5px' }}>
                  <div style={{ width: `${uploadProgress}%`, background: '#2e8b57', height: '100%', transition: 'width 0.3s' }}></div>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Uploading: {uploadProgress}%</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleFileUpload} disabled={uploading} style={{ flex: 1, padding: '10px', background: '#2e8b57', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>{uploading ? 'Processing...' : 'Upload'}</button>
              <button onClick={() => setIsUploadModalOpen(false)} style={{ flex: 1, padding: '10px', background: '#f0f0f0', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* BLESS MODAL */}
      {blessModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
           <div style={{ background: 'white', padding: '25px', borderRadius: '16px', width: '85%', maxWidth: '320px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#0b2e4a' }}>Bless {blessModalUser.full_name}</h3>
            <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '12px', marginBottom: '15px' }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${blessModalUser.upi_id}&pn=${encodeURIComponent(blessModalUser.full_name)}&cu=INR`)}`} style={{ width: '100%', height: 'auto' }} />
            </div>
            <button onClick={() => setBlessModalUser(null)} style={{ width: '100%', padding: '10px', background: '#ccc', border: 'none', borderRadius: '8px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function GlimpseItem({ glimpse, user, isActive, setActiveGlimpseId, onAmen, setBlessModalUser, onDelete, openMenuId, setOpenMenuId }) {
  const containerRef = useRef(null);

  const getEmbedUrl = (url) => {
    if (url.includes('/play/')) return url.replace('/play/', '/embed/');
    return url;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActiveGlimpseId(glimpse.id); }, 
      { threshold: 0.6 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [glimpse.id, setActiveGlimpseId]);

  const embedUrl = getEmbedUrl(glimpse.media_url);
  const isOwner = user && user.id === glimpse.user_id;

  return (
    <div ref={containerRef} style={{ height: "100%", width: "100%", scrollSnapAlign: "start", position: "relative", background:'#000' }}>
      
      {/* VIDEO SECTION - PADDING-BOTTOM HACK RETAINED */}
      <div style={{ position: "relative", paddingTop: "177.77%", height: 0, overflow:'hidden' }}>
        <iframe 
          key={`glimpse-${glimpse.id}-${isActive}`} // AUDIO FIX: Force kill on scroll
          src={embedUrl + (isActive ? "?autoplay=true&loop=true&muted=false" : "?autoplay=false&muted=true")}
          loading="lazy"
          style={{ border: 'none', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
        />
      </div>

      {/* SOCIAL SIDEBAR OVERLAY */}
      <div style={{ position: "absolute", right: "15px", bottom: "100px", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", zIndex: 10 }}>
        <Link href={`/profile/${glimpse.user_id}`}>
            <img src={glimpse.profiles?.avatar_url || '/images/default-avatar.png'} style={{ width: 45, height: 45, borderRadius: "50%", border: "2px solid white", objectFit:'cover' }} />
        </Link>
        
        <div style={{ textAlign: "center" }}>
          <button onClick={() => onAmen(glimpse, glimpse.hasAmened)} style={{ background: "rgba(0,0,0,0.4)", borderRadius:'50%', width:'45px', height:'45px', border: "none", fontSize: "24px", color:'white', cursor:'pointer' }}>{glimpse.hasAmened ? "🙏" : "👐"}</button>
          <div style={{ color: "white", fontSize: "12px", fontWeight: "bold", marginTop:'2px' }}>{glimpse.amenCount}</div>
        </div>

        <button onClick={() => setBlessModalUser(glimpse.profiles)} style={{ background: "rgba(0,0,0,0.4)", borderRadius:'50%', width:'45px', height:'45px', border: "none", fontSize: "24px", cursor:'pointer' }}>✨</button>
        
        <button onClick={() => { navigator.share({url: window.location.href}).catch(() => alert("Link copied!")); }} style={{ background: "rgba(0,0,0,0.4)", borderRadius:'50%', width:'45px', height:'45px', border: "none", fontSize: "24px", cursor:'pointer' }}>📢</button>
        
        <div style={{ position:'relative' }}>
          <button onClick={() => setOpenMenuId(openMenuId === glimpse.id ? null : glimpse.id)} style={{ background: "rgba(0,0,0,0.4)", borderRadius:'50%', width:'40px', height:'40px', border: "none", fontSize: "20px", color:'white', cursor:'pointer' }}>⋮</button>
          {openMenuId === glimpse.id && (
            <div style={{ position: 'absolute', right: 50, bottom: 0, background: 'white', borderRadius: '12px', width: '150px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
              {isOwner ? (
                <button onClick={() => onDelete(glimpse.id)} style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', color: 'red', fontWeight:'bold' }}>🗑️ Delete</button>
              ) : (
                <button onClick={() => { alert("Reported to moderators."); setOpenMenuId(null); }} style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: 'white', cursor: 'pointer', color: 'orange', fontWeight:'bold' }}>🚩 Report</button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* CAPTION OVERLAY */}
      <div style={{ position: "absolute", bottom: "30px", left: "20px", right: "20px", color: 'white', zIndex: 5, textShadow: '2px 2px 4px rgba(0,0,0,0.8)', pointerEvents:'none' }}>
        <Link href={`/profile/${glimpse.user_id}`} style={{textDecoration:'none', pointerEvents:'auto'}}>
            <h3 style={{ margin: '0 0 5px 0', color:'white' }}>@{glimpse.profiles?.full_name}</h3>
        </Link>
        <p style={{ margin: 0 }}>{glimpse.content}</p>
      </div>
    </div>
  );
}