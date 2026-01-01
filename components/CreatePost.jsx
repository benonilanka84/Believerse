"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import * as tus from "tus-js-client";
import Link from "next/link";

export default function CreatePost({ user, onPostCreated, fellowshipId = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Testimony");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0); // Track duration for tier checks
  const [errorMsg, setErrorMsg] = useState(null); // Empathic error messages
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  // Sync Tier Data from User Profile
  const userTier = user?.subscription_tier?.toLowerCase() || "free";

  useEffect(() => {
    if (!mediaFile) {
      setPreviewUrl(null);
      setVideoDuration(0);
      setErrorMsg(null);
      return;
    }

    const objectUrl = URL.createObjectURL(mediaFile);
    setPreviewUrl(objectUrl);

    // Metadata check for videos
    if (mediaFile.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        setVideoDuration(video.duration);
      };
      video.src = objectUrl;
    }

    return () => URL.revokeObjectURL(objectUrl);
  }, [mediaFile]);

  const validateLimits = async () => {
    // 1. Video Duration Check
    if (mediaFile && mediaFile.type.startsWith("video/")) {
      const mins = videoDuration / 60;
      if (userTier === "free" && mins > 10) {
        setErrorMsg("What a wonderful message! Community uploads are limited to 10 minutes. Support the ministry as a Gold Supporter to share up to 60 minutes.");
        return false;
      }
      if (userTier === "gold" && mins > 60) {
        setErrorMsg("This is a powerful sermon! You've reached the 60-minute limit for Gold Supporters. Become a Platinum Partner to share journeys up to 3 hours.");
        return false;
      }
      if (userTier === "platinum" && mins > 180) {
        setErrorMsg("To maintain our sanctuary's quality, videos are limited to 3 hours. Please consider sharing this in parts.");
        return false;
      }
    }

    // 2. Glimpse Count Check (Last 30 Days)
    if (type === "Glimpse") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'Glimpse')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) console.error("Limit check error:", error);

      if (userTier === "free" && count >= 15) {
        setErrorMsg("You've shared so much light! You've reached your limit of 15 Glimpses this month. Upgrade to Gold for unlimited Glimpses.");
        return false;
      }
      if (userTier === "gold" && count >= 60) {
        setErrorMsg("Your light is shining bright! You've reached your limit of 60 Glimpses. Explore Platinum Partnership for unlimited sharing.");
        return false;
      }
    }

    return true;
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaFile) return;
    setErrorMsg(null);

    const isAllowed = await validateLimits();
    if (!isAllowed) return;

    setLoading(true);
    setUploadProgress(0);

    let uploadedUrl = null; 

    try {
      if (mediaFile) {
        const isVideo = mediaFile.type.startsWith("video/");
        if (isVideo) {
          const response = await fetch('/api/video/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title || "New Post", tier: userTier })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to initialize video upload");
          }
           
          const { videoId, libraryId, signature, expirationTime } = await response.json();

          uploadedUrl = await new Promise((resolve, reject) => {
            const upload = new tus.Upload(mediaFile, {
              endpoint: "https://video.bunnycdn.com/tusupload",
              retryDelays: [0, 3000, 5000, 10000, 20000],
              headers: {
                AuthorizationSignature: signature,
                AuthorizationExpire: expirationTime,
                VideoId: videoId,
                LibraryId: libraryId,
              },
              metadata: {
                filetype: mediaFile.type,
                title: title || "Untitled",
                userId: user.id 
              },
              onError: (error) => reject(error),
              onProgress: (bytesUploaded, bytesTotal) => {
                const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(0);
                setUploadProgress(Number(percentage));
              },
              onSuccess: () => {
                const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
                resolve(embedUrl);
              },
            });
            upload.start();
          });

        } else {
          const fileExt = mediaFile.name.split('.').pop();
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from("posts").upload(fileName, mediaFile);
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from("posts").getPublicUrl(fileName);
          uploadedUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content,
        title: title,
        media_url: uploadedUrl,
        type: type,
        fellowship_id: fellowshipId 
      });

      if (error) throw error;
      setIsOpen(false);
      if (onPostCreated) onPostCreated();

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) {
    return (
      <div onClick={() => setIsOpen(true)} style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "15px", cursor: "pointer" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>✍️</div>
        <div style={{ color: "#888", fontSize: "16px", fontWeight: "500" }}>What's in your heart today?</div>
      </div>
    );
  }

  return (
    <div style={{ background: "white", padding: "25px", borderRadius: "12px", marginBottom: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
        <h3 style={{ margin: 0, color: "#0b2e4a" }}>Create Post</h3>
        <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#666" }}>×</button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
        <select value={type} onChange={e => setType(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e0e0e0", fontSize: "14px", background: "#f9f9f9" }}>
          <option value="Testimony">💬 Testimony</option>
          <option value="Prayer">🙏 Prayer Request</option>
          <option value="Scripture">📖 Scripture</option>
          <option value="Sermon">🎥 Sermon</option>
          <option value="Glimpse">⚡ Glimpse</option>
        </select>
        
        {userTier === "free" && (
          <div style={{ fontSize: "12px", background: "#fff9db", color: "#856404", padding: "8px 12px", borderRadius: "8px", display: "flex", alignItems: "center" }}>
            ⭐ Gold members get 1080p uploads & Fellowships
          </div>
        )}
      </div>

      <input type="text" placeholder="Post Title (Optional)" value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e0e0e0", marginBottom: "12px" }} />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your message..." style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e0e0e0", minHeight: "120px", marginBottom: "15px", fontFamily: "inherit" }} />

      {errorMsg && (
        <div style={{ background: "#fff5f5", borderLeft: "4px solid #c62828", padding: "15px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
          <p style={{ margin: "0 0 10px 0", color: "#c62828", lineHeight: "1.5" }}>{errorMsg}</p>
          <Link href="/pricing" style={{ color: "#2d6be3", fontWeight: "bold", textDecoration: "underline" }}>View Support Plans</Link>
        </div>
      )}

      {/* Media Upload UI (Same as before) */}
      <div style={{ marginBottom: "20px" }}>
         <input type="file" accept="image/*,video/*" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => setMediaFile(e.target.files[0])} />
         {!mediaFile ? (
           <div onClick={() => fileInputRef.current.click()} style={{ padding: "30px", border: "2px dashed #e0e0e0", borderRadius: "12px", textAlign: "center", cursor: "pointer", background: "#fafafa", color: "#666" }}>
             📷 Add Photo or Video
           </div>
         ) : (
           <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", background: "#000" }}>
             {mediaFile.type.startsWith("video/") ? (
                <video src={previewUrl} style={{ width: "100%", maxHeight: "400px" }} controls />
             ) : (
                <img src={previewUrl} style={{ width: "100%", maxHeight: "400px", objectFit: "contain" }} alt="Preview" />
             )}
             <button onClick={() => setMediaFile(null)} style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer" }}>×</button>
           </div>
         )}
      </div>

      {loading && uploadProgress > 0 && (
        <div style={{ width: "100%", height: "8px", background: "#eee", borderRadius: "10px", marginBottom: "20px", overflow: "hidden" }}>
          <div style={{ width: `${uploadProgress}%`, height: "100%", background: "#2e8b57", transition: "width 0.3s" }} />
        </div>
      )}

      <div style={{ textAlign: "right" }}>
        <button onClick={handlePost} disabled={loading || (!content.trim() && !mediaFile)} style={{ background: "#2e8b57", color: "white", padding: "12px 30px", borderRadius: "8px", border: "none", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(46,139,87,0.2)" }}>
          {loading ? (uploadProgress > 0 ? `Uploading ${uploadProgress}%` : "Sharing...") : "Post"}
        </button>
      </div>
    </div>
  );
}