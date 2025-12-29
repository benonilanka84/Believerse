"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LiveStudioPage() {
  const [title, setTitle] = useState("");
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleGoLive() {
    if (!title.trim()) return alert("Please name your fellowship.");
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
      
      // We save 'channel_arn' in Supabase to track active resources
      await supabase.from('live_streams').insert({
        host_id: user.id,
        title: title,
        playback_url: data.playbackUrl, 
        channel_arn: data.channelArn,
        stream_key: data.streamKey,
        status: 'live'
      });

      // streamData now holds the channelArn for the Stop function
      setStreamData(data);
    } catch (err) {
      alert("Studio Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStopFellowship() {
    if (!window.confirm("Are you sure you want to end this fellowship? This will stop the broadcast for everyone.")) return;
    setLoading(true);

    try {
      // 1. Tell AWS to delete the channel using the stored ARN
      const res = await fetch("/api/live/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelArn: streamData.channelArn })
      });

      if (!res.ok) throw new Error("Could not stop AWS channel");

      // 2. Update Supabase status so it leaves the "Live Now" list
      await supabase
        .from('live_streams')
        .update({ status: 'offline' })
        .eq('channel_arn', streamData.channelArn);

      setStreamData(null);
      setTitle("");
      alert("Fellowship ended. God bless you!");
    } catch (err) {
      alert("Error stopping stream: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafd", padding: "40px 20px" }}>
      <div style={{ maxWidth: "550px", margin: "0 auto", background: "white", padding: "40px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
        
        <Link href="/dashboard" style={{ color: "#666", textDecoration: "none", fontSize: "14px", fontWeight: "bold", display: "inline-block", marginBottom: "15px" }}>
          ⬅ Back to Dashboard
        </Link>
        
        <h2 style={{ color: "#0b2e4a", marginBottom: "10px", fontSize: "1.8rem" }}>Broadcaster Studio</h2>
        <p style={{ color: "#666", marginBottom: "30px", fontSize: "14px" }}>Start a live fellowship on the AWS global network.</p>
        
        {!streamData ? (
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#0b2e4a" }}>Fellowship Title</label>
            <input 
              type="text" 
              placeholder="What are we talking about today?" 
              style={{ width: "100%", padding: "15px", borderRadius: "10px", border: "2px solid #eee", fontSize: "16px", marginBottom: "20px", color: "#333", outline: "none" }}
              onChange={(e) => setTitle(e.target.value)}
              value={title}
            />
            <button 
              onClick={handleGoLive}
              disabled={loading}
              style={{ width: "100%", padding: "15px", background: "#ef4444", color: "white", borderRadius: "10px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "16px" }}
            >
              {loading ? "Opening Gates..." : "🔴 Go Live Now"}
            </button>
          </div>
        ) : (
          <div style={{ background: "#f0fdf4", padding: "25px", borderRadius: "15px", border: "1px solid #bbf7d0" }}>
            <h4 style={{ color: "#166534", margin: "0 0 10px 0", fontSize: "1.2rem" }}>✅ Connected to Amazon IVS!</h4>
            <p style={{ fontSize: "14px", color: "#444", marginBottom: "20px" }}>Use these secure RTMPS credentials in OBS Studio:</p>
            
            <div style={{ marginBottom: "15px" }}>
               <small style={{ fontWeight: "bold", color: "#666", display: "block", marginBottom: "5px" }}>Server URL:</small>
               <div style={{ background: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", color: "#333", fontSize: "13px", fontFamily: "monospace", wordBreak: "break-all" }}>
                 rtmps://{streamData.ingestEndpoint}:443/app/
               </div>
            </div>

            <div>
               <small style={{ fontWeight: "bold", color: "#666", display: "block", marginBottom: "5px" }}>Stream Key (Keep Private):</small>
               <div style={{ background: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", fontWeight: "bold", color: "#333", fontSize: "13px", fontFamily: "monospace", wordBreak: "break-all" }}>
                 {streamData.streamKey}
               </div>
            </div>

            <button 
              onClick={handleStopFellowship}
              disabled={loading}
              style={{ 
                marginTop: "25px", width: "100%", padding: "12px", 
                background: "white", color: "#ef4444", border: "2px solid #ef4444", 
                borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "14px"
              }}
            >
              {loading ? "Stopping..." : "⏹ Stop Fellowship"}
            </button>

            <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: "1px solid #dcfce7" }}>
              <p style={{ fontSize: "12px", color: "#166534", fontStyle: "italic", lineHeight: "1.5" }}>
                Once you click "Stop Fellowship", the cloud channel will be deleted to ensure you are not billed for idle time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}