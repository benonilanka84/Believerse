"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function CreatePost({ user, onPostCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Testimony");
  const [loading, setLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const fileInputRef = useRef(null);

  const handlePost = async () => {
    if (!content.trim() && !mediaFile) return;
    setLoading(true);

    let mediaUrl = null;
    let mediaType = null;

    // 1. Upload Media if present
    if (mediaFile) {
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const bucket = "posts"; // Ensure this bucket exists in Supabase Storage

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, mediaFile);

      if (uploadError) {
        alert("Upload Error: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      mediaUrl = urlData.publicUrl;
      mediaType = mediaFile.type.startsWith('image') ? 'image' : 'video';
    }

    // 2. Insert Post
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      title: title,
      content: content,
      type: type,
      media_url: mediaUrl,
      // You might need to add a 'media_type' column to your posts table if not present:
      // alter table posts add column media_type text;
    });

    setLoading(false);
    if (error) {
      alert("Error creating post: " + error.message);
    } else {
      setContent("");
      setTitle("");
      setMediaFile(null);
      setIsOpen(false);
      if (onPostCreated) onPostCreated(); // Refresh feed
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
        value={type} onChange={e => setType(e.target.value)}
        style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd", marginBottom: "10px", fontSize: "14px" }}
      >
        <option value="Testimony">💬 Testimony</option>
        <option value="Prayer">🙏 Prayer Request</option>
        <option value="Scripture">📖 Scripture</option>
        <option value="Sermon">🎥 Sermon</option>
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

      {/* Media Upload */}
      <div style={{ marginBottom: "15px" }}>
        <input 
          type="file" 
          accept="image/*,video/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }}
          onChange={(e) => setMediaFile(e.target.files[0])}
        />
        <div 
          onClick={() => fileInputRef.current.click()}
          style={{ padding: "10px", border: "1px dashed #ccc", borderRadius: "8px", textAlign: "center", color: "#666", fontSize: "13px", cursor: "pointer", background: mediaFile ? "#e8f5e9" : "transparent" }}
        >
          {mediaFile ? `✅ ${mediaFile.name}` : "📷 Add Image/Video"}
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <button
          onClick={handlePost}
          disabled={loading || (!content.trim() && !mediaFile)}
          style={{
            background: "#2e8b57", color: "white", padding: "10px 25px", borderRadius: "8px", border: "none", fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}