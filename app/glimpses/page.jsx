"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import * as tus from "tus-js-client";

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
          onSuccess: () => resolve(`https://iframe.mediadelivery.net/play/${libraryId}/${videoId}`),
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
      loadGlimpses(user.id);

    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div style={{ background: "#000", height: "100dvh", width: "100vw", display: "flex", flexDirection: "column", alignItems:'center', position: "relative", overflow: "hidden" }}>
       
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
        <h2 style={{ color: "white", margin: 0, fontSize: "20px" }}>⚡ Glimpses</h2>
        <button onClick={() => setIsUploadModalOpen(true)} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid white", color: "white", padding: "6px 15px", borderRadius: "20px", cursor: "pointer" }}>+ Upload</button>
      </div>

      <div id="glimpses-scroll-container" style={{ width: '100%', maxWidth: '480px', height: '100%', overflowY: "scroll", scrollSnapType: "y mandatory", scrollbarWidth: 'none' }}>
        {glimpses.map((glimpse) => (
          <GlimpseItem 
            key={glimpse.id} 
            glimpse={glimpse} 
            isActive={glimpse.id === activeGlimpseId}
            setActiveGlimpseId={setActiveGlimpseId}
          />
        ))}
      </div>
       
      {isUploadModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '350px' }}>
            <h3>Upload New Glimpse</h3>
            <textarea value={newGlimpseCaption} onChange={e => setNewGlimpseCaption(e.target.value)} placeholder="Add a caption..." style={{ width: '100%', padding: '10px', marginBottom: '15px' }} />
            <input type="file" ref={fileInputRef} accept="video/*" style={{ marginBottom: '20px' }} />
            {uploading && <div style={{ marginBottom: '10px' }}>Uploading: {uploadProgress}%</div>}
            <button onClick={handleFileUpload} disabled={uploading}>Upload</button>
            <button onClick={() => setIsUploadModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function GlimpseItem({ glimpse, isActive, setActiveGlimpseId }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setActiveGlimpseId(glimpse.id); }, { threshold: 0.6 });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [glimpse.id, setActiveGlimpseId]);

  return (
    <div ref={containerRef} style={{ height: "100%", width: "100%", scrollSnapAlign: "start", position: "relative", background:'black', overflow:'hidden' }}>
      <iframe 
        src={glimpse.media_url + "?autoplay=true&loop=true&muted=false"}
        style={{ 
          border: 'none', 
          width: '100.5%', 
          height: '100.5%', 
          position: 'absolute', 
          top: '-0.25%', 
          left: '-0.25%', 
          objectFit: 'cover' 
        }}
        allow="accelerometer; autoplay; encrypted-media;"
        allowFullScreen
      />
      
      <div style={{ position: "absolute", bottom: "30px", left: "20px", color: 'white', zIndex: 5 }}>
        <h3>@{glimpse.profiles?.full_name}</h3>
        <p>{glimpse.content}</p>
      </div>
    </div>
  );
}