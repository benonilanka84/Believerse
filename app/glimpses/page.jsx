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
            <h3 style={{ marginTop: 0 }}>Upload New Glimpse</h3>
            <textarea 
              value={newGlimpseCaption} 
              onChange={e => setNewGlimpseCaption(e.target.value)} 
              placeholder="Add a caption..." 
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px' }} 
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
              <button 
                onClick={handleFileUpload} 
                disabled={uploading}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  background: '#2e8b57', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.7 : 1,
                  fontWeight: 'bold'
                }}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  background: '#f0f0f0', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GlimpseItem({ glimpse, isActive, setActiveGlimpseId }) {
  const containerRef = useRef(null);

  const getEmbedUrl = (url) => {
    if (url.includes('/play/')) {
      return url.replace('/play/', '/embed/');
    }
    return url;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { 
        if (entry.isIntersecting) setActiveGlimpseId(glimpse.id); 
      }, 
      { threshold: 0.6 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [glimpse.id, setActiveGlimpseId]);

  const embedUrl = getEmbedUrl(glimpse.media_url);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: "100%", 
        width: "100%", 
        scrollSnapAlign: "start", 
        position: "relative", 
        background:'#000'
      }}
    >
      <div style={{ position: "relative", paddingTop: "177.77%", height: 0 }}>
        <iframe 
          // The key prop is the fix: it forces the browser to kill the audio of the previous glimpse
          key={`glimpse-frame-${glimpse.id}-${isActive}`}
          src={embedUrl + (isActive ? "?autoplay=true&loop=true&muted=false" : "?autoplay=false&muted=true")}
          loading="lazy"
          style={{ 
            border: 'none', 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%', 
            height: '100%'
          }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen={true}
        />
      </div>
      
      <div style={{ 
        position: "absolute", 
        bottom: "30px", 
        left: "20px", 
        right: "20px",
        color: 'white', 
        zIndex: 5,
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        <h3 style={{ margin: '0 0 5px 0' }}>@{glimpse.profiles?.full_name}</h3>
        <p style={{ margin: 0 }}>{glimpse.content}</p>
      </div>
    </div>
  );
}