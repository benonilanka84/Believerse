"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LiveStudioPage() {
  const [title, setTitle] = useState("");
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * START BROADCAST
   */
  async function handleGoLive() {
    if (!title.trim()) return alert("Please name your broadcast.");
    setLoading(true);

    try {
      const res = await fetch("/api/live/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AWS Connection Failed");

      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('live_streams').insert({
        host_id: user.id,
        title: title,
        playback_url: data.playbackUrl, 
        channel_arn: data.channelArn,
        stream_key: data.streamKey,
        status: 'live'
      });

      setStreamData(data);
    } catch (err) {
      alert("Studio Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * END BROADCAST
   */
  async function handleEndBroadcast() {
    if (!window.confirm("Are you sure you want to end this broadcast? This will disconnect all current viewers.")) return;
    setLoading(true);

    try {
      const res = await fetch("/api/live/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelArn: streamData.channelArn })
      });

      if (!res.ok) throw new Error("Could not stop AWS channel");

      await supabase
        .from('live_streams')
        .update({ status: 'offline' })
        .eq('channel_arn', streamData.channelArn);

      setStreamData(null);
      setTitle("");
      alert("Broadcast ended successfully. God bless you!");
    } catch (err) {
      alert("Error ending broadcast: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", padding: "60px 20px", fontFamily: "inherit" }}>
      <div style={{ 
        maxWidth: "600px", 
        margin: "0 auto", 
        background: "white", 
        padding: "50px", 
        borderRadius: "24px", 
        boxShadow: "0 20px 40px rgba(11, 46, 74, 0.08)",
        border: "1px solid #e1e8ed"
      }}>
        
        {/* Navigation */}
        <Link href="/dashboard" style={{ 
          color: "#0b2e4a", 
          textDecoration: "none", 
          fontSize: "14px", 
          fontWeight: "600", 
          display: "flex", 
          alignItems: "center", 
          gap: "8px",
          marginBottom: "25px",
          opacity: 0.7
        }}>
          ← Back to Dashboard
        </Link>
        
        <header style={{ marginBottom: "40px" }}>
          <h2 style={{ color: "#0b2e4a", marginBottom: "8px", fontSize: "2.2rem", letterSpacing: "-0.5px" }}>
            Broadcaster Studio
          </h2>
          <div style={{ width: "50px", height: "4px", background: "#d4af37", borderRadius: "2px", marginBottom: "15px" }}></div>
          <p style={{ color: "#5a7184", fontSize: "16px", lineHeight: "1.6" }}>
            Share your message with the global Believerse community in real-time.
          </p>
        </header>
        
        {!streamData ? (
          <section>
            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "10px", fontWeight: "700", color: "#0b2e4a", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Broadcast Title
              </label>
              <input 
                type="text" 
                placeholder="Ex: Morning Prayer & Fellowship" 
                style={{ 
                  width: "100%", 
                  padding: "18px", 
                  borderRadius: "12px", 
                  border: "2px solid #e1e8ed", 
                  fontSize: "16px", 
                  color: "#0b2e4a", 
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box"
                }}
                onChange={(e) => setTitle(e.target.value)}
                value={title}
              />
            </div>
            
            <button 
              onClick={handleGoLive}
              disabled={loading}
              style={{ 
                width: "100%", 
                padding: "18px", 
                background: "#e63946", 
                color: "white", 
                borderRadius: "12px", 
                fontWeight: "700", 
                border: "none", 
                cursor: "pointer", 
                fontSize: "16px",
                boxShadow: "0 10px 20px rgba(230, 57, 70, 0.2)",
                transition: "transform 0.2s, opacity 0.2s"
              }}
            >
              {loading ? "Preparing Global Gates..." : "🔴 Go Live Now"}
            </button>
          </section>
        ) : (
          <section style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{ 
              background: "#f0fdf4", 
              padding: "30px", 
              borderRadius: "18px", 
              border: "1px solid #bbf7d0",
              marginBottom: "30px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                <div style={{ width: "10px", height: "10px", background: "#22c55e", borderRadius: "50%", animation: "pulse 1.5s infinite" }}></div>
                <h4 style={{ color: "#166534", margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>Broadcast is Ready</h4>
              </div>
              
              <p style={{ fontSize: "15px", color: "#374151", marginBottom: "25px", lineHeight: "1.5" }}>
                Please paste these secure credentials into your streaming software (like <strong>OBS Studio</strong>) to begin your ministry:
              </p>
              
              <div style={{ marginBottom: "20px" }}>
                 <label style={{ fontWeight: "700", color: "#4b5563", display: "block", marginBottom: "8px", fontSize: "12px", textTransform: "uppercase" }}>
                   RTMPS Server URL
                 </label>
                 <div style={{ 
                   background: "white", 
                   padding: "14px", 
                   borderRadius: "10px", 
                   border: "1px solid #d1d5db", 
                   color: "#1f2937", 
                   fontSize: "13px", 
                   fontFamily: "monospace", 
                   wordBreak: "break-all" 
                 }}>
                   rtmps://{streamData.ingestEndpoint}:443/app/
                 </div>
              </div>

              <div style={{ marginBottom: "10px" }}>
                 <label style={{ fontWeight: "700", color: "#4b5563", display: "block", marginBottom: "8px", fontSize: "12px", textTransform: "uppercase" }}>
                   Secure Stream Key
                 </label>
                 <div style={{ 
                   background: "white", 
                   padding: "14px", 
                   borderRadius: "10px", 
                   border: "1px solid #d1d5db", 
                   fontWeight: "700", 
                   color: "#1f2937", 
                   fontSize: "13px", 
                   fontFamily: "monospace", 
                   wordBreak: "break-all" 
                 }}>
                   {streamData.streamKey}
                 </div>
              </div>
            </div>

            <button 
              onClick={handleEndBroadcast}
              disabled={loading}
              style={{ 
                width: "100%", 
                padding: "16px", 
                background: "transparent", 
                color: "#e63946", 
                border: "2px solid #e63946", 
                borderRadius: "12px", 
                fontWeight: "700", 
                cursor: "pointer", 
                fontSize: "15px",
                transition: "all 0.2s"
              }}
            >
              {loading ? "Ending Stream..." : "⏹ End Broadcast"}
            </button>

            <footer style={{ marginTop: "30px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#6b7280", fontStyle: "italic", lineHeight: "1.6" }}>
                Your broadcast is now live. Remember to end the broadcast here when you are finished to maintain community order and efficiency.
              </p>
            </footer>
          </section>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}