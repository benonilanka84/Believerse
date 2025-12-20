"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import * as tus from "tus-js-client";

export default function CreatePost({ user, onPostCreated, fellowshipId = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Testimony");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [mediaFile, setMediaFile] = useState(null);
  
  // State for the preview URL
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const fileInputRef = useRef(null);

  // Effect to generate preview URL when file is selected
  useEffect(() => {
    if (!mediaFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(mediaFile);
    setPreviewUrl(objectUrl);

    // Cleanup memory when file changes or component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  }, [mediaFile]);

  const handlePost = async () => {
    if (!content.trim() && !mediaFile) return;
    setLoading(true);
    setUploadProgress(0);

    let uploadedUrl = null; 

    try {
      // ---------------------------------------------------------
      // 1. HANDLE MEDIA UPLOAD
      // ---------------------------------------------------------
      if (mediaFile) {
        const isVideo = mediaFile.type.startsWith("video/");

        if (isVideo) {
          // A. Call internal API to get Signature
          const response = await fetch('/api/video/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title || "New Post" })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to initialize video upload");
          }
          
          const { videoId, libraryId, signature, expirationTime } = await response.json();

          // B. Perform the TUS Upload
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

        } else {
          // IMAGE UPLOAD TO SUPABASE
          const fileExt = mediaFile.name.split('.').pop();
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from("posts")
            .upload(fileName, mediaFile);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from("posts").getPublicUrl(fileName);
          uploadedUrl = urlData.publicUrl;
        }
      }

      // ---------------------------------------------------------
      // 2. INSERT POST INTO DATABASE
      // ---------------------------------------------------------
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content,
        title: title,
        media_url: uploadedUrl,
        type: type,
        fellowship_id: fellowshipId 
      });

      if (error) throw error;

      // Success Reset
      setContent("");
      setTitle("");
      setMediaFile(null);
      setPreviewUrl(null); 
      setUploadProgress(0);
      setIsOpen(false);
      
      if (onPostCreated) onPostCreated();

    } catch (err) {
      console.error(err);
      alert("Error posting: " + err.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) {
    return (
      <div 
        onClick={() => setIsOpen(true)}
        style={{ 
          background: "white", padding: "20px", borderRadius: "12px", marginBottom: "20px", 
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "15px", cursor: "pointer" 
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ✏️
        </div>
        <div style={{ color: "#888", fontSize: "16px", fontWeight: "500" }}>
          What's in your heart today?
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "white", padding: "25px", borderRadius: "12px", marginBottom: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
        <h3 style={{ margin: 0, color: "#0b2e4a" }}>Create Post</h3>
        <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
      </div>

      <select 
        value={type}
        onChange={e => setType(e.target.value)}
        style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd", marginBottom: "10px", fontSize: "14px" }}
      >
        <option value="Testimony">💬 Testimony</option>
        <option value="Prayer">🙏 Prayer Request</option>
        <option value="Scripture">📖 Scripture</option>
        <option value="Sermon">🎥 Sermon</option>
        <option value="Glimpse">⚡ Glimpse</option>
        <option value="Others">📝 Others</option>
      </select>

      <input 
        type="text" 
        placeholder="Post Title (Optional)" 
        value={title} 
        onChange={e => setTitle(e.target.value)}
        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "10px", fontSize: "14px" }}
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your testimony, prayer, or message..."
        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", minHeight: "100px", fontFamily: "inherit", resize: "vertical", marginBottom: "15px" }}
      />

      {/* Media Upload & Preview Section */}
      <div style={{ marginBottom: "15px" }}>
        <input 
          type="file" 
          accept="image/*,video/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }}
          onChange={(e) => setMediaFile(e.target.files[0])}
        />
        
        {/* Toggle between Upload Button and Preview */}
        {!mediaFile ? (
          <div 
            onClick={() => fileInputRef.current.click()}
            style={{ padding: "10px", border: "1px dashed #ccc", borderRadius: "8px", textAlign: "center", color: "#666", fontSize: "13px", cursor: "pointer", background: "transparent" }}
          >
            📷 Add Image/Video
          </div>
        ) : (
          <div style={{ position: "relative", width: "100%" }}>
             {/* PREVIEW PLAYER: Natural width, rounded corners */}
            {mediaFile.type.startsWith("video/") ? (
                <div style={{ width: "100%", overflow: "hidden", borderRadius: "8px" }}>
                    <video 
                        src={previewUrl} 
                        controls 
                        style={{ width: "100%", height: "auto", display: "block" }} 
                    />
                </div>
            ) : (
                <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ width: "100%", height: "auto", borderRadius: "8px", display: "block" }} 
                />
            )}
            
            {/* Remove Button */}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setMediaFile(null);
                    setPreviewUrl(null);
                    fileInputRef.current.value = ""; 
                }}
                style={{ 
                    marginTop: "10px", width: "100%", padding: "8px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" 
                }}
            >
                ❌ Remove {mediaFile.type.startsWith("video/") ? "Video" : "Image"}
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {loading && uploadProgress > 0 && (
        <div style={{ width: "100%", background: "#f0f0f0", borderRadius: "4px", height: "8px", marginBottom: "15px" }}>
          <div style={{ width: `${uploadProgress}%`, background: "#2e8b57", height: "100%", borderRadius: "4px", transition: "width 0.3s ease" }}></div>
        </div>
      )}

      <div style={{ textAlign: "right" }}>
        <button
          onClick={handlePost}
          disabled={loading || (!content.trim() && !mediaFile)}
          style={{
            background: "#2e8b57", color: "white", padding: "10px 25px", borderRadius: "8px", border: "none", fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? (uploadProgress > 0 ? `Uploading ${uploadProgress}%` : "Posting...") : "Post"}
        </button>
      </div>
    </div>
  );
}