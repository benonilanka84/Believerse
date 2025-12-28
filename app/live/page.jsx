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
      const res = await fetch("/api/live/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bunny.net API rejected the request.");

      // Record in Supabase to show "Live Now" in the dashboard
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('live_streams').insert({
        host_id: user.id,
        title: title,
        bunny_stream_id: data.guid,
        stream_key: data.streamKey,
        status: 'live'
      });

      setStreamInfo(data);
    } catch (err) {
      alert("Studio Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafd", padding: "40px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", background: "white", borderRadius: "20px", padding: "40px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
        <h1 style={{ color: "#0b2e4a", fontSize: "1.8rem" }}>Broadcaster Studio</h1>
        
        {!streamInfo ? (
          <div>
            <input 
              type="text" 
              placeholder="Stream Title..." 
              style={{ width: "100%", padding: "15px", borderRadius: "12px", border: "2px solid #eee", fontSize: "16px", marginBottom: "20px" }}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button 
              onClick={handleCreateStream}
              style={{ width: "100%", padding: "15px", background: "#ef4444", color: "white", borderRadius: "12px", fontWeight: "bold" }}
            >
              {loading ? "Preparing Studio..." : "🔴 Go Live Now"}
            </button>
          </div>
        ) : (
          <div style={{ background: "#f0fdf4", padding: "25px", borderRadius: "15px", border: "1px solid #bbf7d0" }}>
            <h3 style={{ color: "#166534" }}>Studio Ready</h3>
            <p><strong>Server:</strong> rtmp://publish.bunnycdn.com/live</p>
            <p><strong>Stream Key:</strong> {streamInfo.streamKey}</p>
          </div>
        )}
      </div>
    </div>
  );
}