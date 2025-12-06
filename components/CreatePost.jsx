"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CreatePost({ user, profile, onPostCreated }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("Testimony");

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content,
      type: type,
    });

    setLoading(false);

    if (error) {
      alert("Error sharing: " + error.message);
    } else {
      setContent("");
      onPostCreated();
    }
  };

  return (
    <div style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #e0e0e0" }}>
      <div style={{display: 'flex', gap: 10, marginBottom: 10}}>
        {['Testimony', 'Prayer', 'Scripture'].map(t => (
          <button 
            key={t}
            onClick={() => setType(t)}
            style={{
              padding: "5px 10px", 
              borderRadius: "15px", 
              border: "1px solid #ddd",
              background: type === t ? "#e8f5e9" : "white",
              color: type === t ? "#2e8b57" : "#666",
              fontSize: "12px",
              cursor: "pointer"
            }}
          >
            {t}
          </button>
        ))}
      </div>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`Share your ${type.toLowerCase()} with the family...`}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          minHeight: "80px",
          fontFamily: "inherit",
          resize: "vertical"
        }}
      />
      
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
        <button
          onClick={handlePost}
          disabled={loading || !content.trim()}
          style={{
            background: "#2e8b57",
            color: "white",
            padding: "8px 20px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Sharing..." : "Spread 📢"}
        </button>
      </div>
    </div>
  );
}