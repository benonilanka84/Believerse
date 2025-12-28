"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LiveStudioPage() {
  const [title, setTitle] = useState("");
  const [streamInfo, setStreamInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleCreateStream() {
    if (!title.trim()) return alert("Please enter a stream title.");
    setLoading(true);

    try {
      // 1. Generate stream in Bunny.net via our API
      const res = await fetch("/api/live/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      
      const bunnyData = await res.json();
      if (!res.ok) throw new Error(bunnyData.error || "Failed to create stream");

      // 2. Record the session in Supabase so it shows up in the "Live" feed for others
      const { data: { user } } = await supabase.auth.getUser();
      const { error: dbError } = await supabase.from('live_streams').insert({
        host_id: user.id,
        title: title,
        bunny_stream_id: bunnyData.guid,
        stream_key: bunnyData.streamKey,
        status: 'live'
      });

      if (dbError) throw dbError;

      setStreamInfo(bunnyData);
    } catch (err) {
      alert("Studio Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafd", padding: "40px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", background: "white", borderRadius: "20px", padding: "40px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
        <Link href="/dashboard" style={{ color: "#666", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>⬅ Back to Dashboard</Link>
        
        <h1 style={{ color: "#0b2e4a", marginTop: "15px", fontSize: "1.8rem" }}>Broadcaster Studio</h1>
        <p style={{ color: "#666", marginBottom: "30px" }}>Start a live broadcast to the entire Believerse community.</p>
        
        {!streamInfo ? (
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#0b2e4a" }}>Stream Title</label>
            <input 
              type="text" 
              placeholder="What are we talking about today?" 
              style={{ width: "100%", padding: "15px", borderRadius: "12px", border: "2px solid #eee", fontSize: "16px", marginBottom: "20px", outline: "none", color: "#333" }}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button 
              onClick={handleCreateStream}
              disabled={loading}
              style={{ width: "100%", padding: "15px", background: "#ef4444", color: "white", borderRadius: "12px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", border: "none", transition: "0.3s" }}
            >
              {loading ? "Preparing Studio..." : "🔴 Go Live Now"}
            </button>
          </div>
        ) : (
          <div style={{ background: "#f0fdf4", padding: "25px", borderRadius: "15px", border: "1px solid #bbf7d0" }}>
            <h3 style={{ color: "#166534", margin: "0 0 10px 0" }}>✅ Your Studio is Ready</h3>
            <p style={{ fontSize: "14px", color: "#444", lineHeight: "1.5" }}>Enter these credentials into your streaming software (like **OBS Studio**) to begin:</p>
            
            <div style={{ marginTop: "20px" }}>
              <small style={{ color: "#666", fontWeight: "bold" }}>Server / RTMP URL:</small>
              <div style={{ background: "white", padding: "12px", borderRadius: "8px", marginTop: "5px", fontSize: "14px", border: "1px solid #ddd", color: "#333" }}>rtmp://publish.bunnycdn.com/live</div>
            </div>

            <div style={{ marginTop: "15px" }}>
              <small style={{ color: "#666", fontWeight: "bold" }}>Stream Key:</small>
              <div style={{ background: "white", padding: "12px", borderRadius: "8px", marginTop: "5px", fontSize: "14px", border: "1px solid #ddd", color: "#333", fontWeight: "bold" }}>{streamInfo.streamKey}</div>
            </div>
            
            <div style={{ marginTop: "25px", paddingTop: "20px", borderTop: "1px solid #dcfce7" }}>
              <p style={{ fontSize: "13px", color: "#166534", fontStyle: "italic" }}>Tip: Do not share your Stream Key with anyone. Once you start streaming in OBS, your followers will see you live!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}