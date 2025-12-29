"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

export default function LiveViewerPage() {
  const { id } = useParams(); // Now represents our internal stream reference
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreamInfo() {
      // Find stream by id or playback_url reference
      const { data, error } = await supabase
        .from('live_streams')
        .select('*, host:profiles(full_name, avatar_url)')
        .eq('id', id)
        .single();
      
      if (data) setStream(data);
      setLoading(false);
    }
    fetchStreamInfo();
  }, [id]);

  if (loading) return <div style={{ textAlign: "center", padding: "100px", color: "#0b2e4a" }}>Joining Fellowship...</div>;
  if (!stream) return <div style={{ textAlign: "center", padding: "100px" }}>This fellowship stream is no longer active.</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0b2e4a", color: "white", paddingBottom: "50px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", display: "grid", gridTemplateColumns: "1fr 350px", gap: "20px" }}>
        
        <div>
          <div style={{ position: "relative", paddingTop: "56.25%", background: "black", borderRadius: "15px", overflow: "hidden" }}>
            {/* Amazon IVS Universal Embed Player */}
            <iframe 
              src={`https://player.live-video.net/1.24.0/embed.html?url=${encodeURIComponent(stream.playback_url)}&autoplay=true`}
              allow="autoplay; fullscreen"
              allowFullScreen
              style={{ border: "none", position: "absolute", top: 0, height: "100%", width: "100%" }}
            ></iframe>
          </div>

          <div style={{ marginTop: "25px", display: "flex", alignItems: "center", gap: "20px" }}>
            <img src={stream.host?.avatar_url || "/images/default-avatar.png"} style={{ width: "60px", height: "60px", borderRadius: "50%", border: "2px solid white" }} />
            <div>
              <h1 style={{ fontSize: "1.8rem", margin: 0, fontWeight: "bold" }}>{stream.title}</h1>
              <p style={{ margin: 0, opacity: 0.7 }}>Broadcast by {stream.host?.full_name}</p>
            </div>
            <div style={{ marginLeft: "auto", background: "#ef4444", padding: "8px 15px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", background: "white", borderRadius: "50%" }}></span> LIVE
            </div>
          </div>
        </div>

        {/* Chat remains the same */}
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "15px", border: "1px solid rgba(255,255,255,0.1)", height: "80vh", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", fontWeight: "bold" }}>Fellowship Chat</div>
          <div style={{ flex: 1, padding: "20px", overflowY: "auto", fontSize: "14px" }}>
            <p><span style={{ color: "#d4af37", fontWeight: "bold" }}>System:</span> Welcome to the live fellowship!</p>
          </div>
          <div style={{ padding: "20px" }}>
            <input type="text" placeholder="Say something..." style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "rgba(255,255,255,0.1)", color: "white" }} />
          </div>
        </div>

      </div>
    </div>
  );
}