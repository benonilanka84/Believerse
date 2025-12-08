"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CreatePost({ user, onPostCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Testimony");
  const [loading, setLoading] = useState(false);
  
  // Future fields for Bunny.net / UPI
  const [mediaFile, setMediaFile] = useState(null);
  const [upiId, setUpiId] = useState(""); // For "Bless" button

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);

    // TODO: Upload mediaFile to Bunny.net here in Phase 2
    // For now, we simulate a post creation
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      title: title,
      content: content,
      type: type,
      // We will save 'upi_id' to profiles table usually, but for now specific to post context? 
      // Better: Save UPI to profile, but here implies enabling it.
    });

    setLoading(false);
    if (error) {
      alert("Error: " + error.message);
    } else {
      setContent("");
      setTitle("");
      setIsOpen(false);
      if (onPostCreated) onPostCreated();
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
        <option value="Sermon">🎥 Sermon (Video)</option>
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

      {/* Media & UPI Placeholders */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
        <div style={{ padding: "10px", border: "1px dashed #ccc", borderRadius: "8px", textAlign: "center", color: "#666", fontSize: "13px", cursor: "pointer" }}>
          📷 Add Image/Video
        </div>
        <input 
          type="text" 
          placeholder="Your UPI ID (e.g. name@okhdfcbank)" 
          value={upiId} 
          onChange={e => setUpiId(e.target.value)}
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}
        />
      </div>

      <div style={{ textAlign: "right" }}>
        <button
          onClick={handlePost}
          disabled={loading || !content.trim()}
          style={{
            background: "#2e8b57", color: "white", padding: "10px 25px", borderRadius: "8px", border: "none", fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Posting..." : "Spread 📢"}
        </button>
      </div>
    </div>
  );
}