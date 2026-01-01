"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LiveStudioPage() {
  const [title, setTitle] = useState("");
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null); // Timer for Gold Tier
  const timerRef = useRef(null);

  /**
   * AUTH & TIER VERIFICATION
   */
  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);

      // SESSION RECOVERY
      const { data: activeSession } = await supabase
        .from('live_streams')
        .select('*')
        .eq('host_id', user.id)
        .eq('status', 'live')
        .single();

      if (activeSession) {
        setStreamData({
          channelArn: activeSession.channel_arn,
          streamKey: activeSession.stream_key,
          playbackUrl: activeSession.playback_url,
          ingestEndpoint: activeSession.server_url?.replace('rtmps://', '').replace(':443/app/', '') 
        });
        setTitle(activeSession.title);
        
        // Resume timer if Gold
        if (profile?.subscription_tier === 'gold') {
          calculateRemainingTime(activeSession.created_at);
        }
      }
    }
    getUserData();
  }, []);

  /**
   * GOLD TIMER LOGIC (60 Minute Limit)
   */
  const calculateRemainingTime = (startTime) => {
    const start = new Date(startTime).getTime();
    const limit = 60 * 60 * 1000; // 60 minutes in ms
    
    timerRef.current = setInterval(() => {
      const now = new Date().getTime();
      const elapsed = now - start;
      const remaining = limit - elapsed;

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        handleEndBroadcast(true); // Auto-end
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
  };

  const formatTime = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  /**
   * START BROADCAST
   */
  async function handleGoLive() {
    // TIER CHECK
    if (userProfile?.subscription_tier === 'free') {
      return alert("Sharing your live testimony is a beautiful calling reserved for our Gold Supporters who help sustain this ministry. Support the ministry to unlock Live features.");
    }

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
      
      const { data: newStream } = await supabase.from('live_streams').insert({
        host_id: user.id,
        title: title,
        playback_url: data.playbackUrl, 
        channel_arn: data.channelArn,
        stream_key: data.streamKey,
        server_url: `rtmps://${data.ingestEndpoint}:443/app/`,
        status: 'live'
      }).select().single();

      setStreamData(data);
      if (userProfile.subscription_tier === 'gold') {
        calculateRemainingTime(newStream.created_at);
      }
    } catch (err) {
      alert("Studio Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * END BROADCAST
   */
  async function handleEndBroadcast(isAuto = false) {
    if (!isAuto && !window.confirm("End this broadcast?")) return;
    setLoading(true);

    try {
      const res = await fetch("/api/live/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelArn: streamData.channelArn })
      });

      await supabase.from('live_streams').update({ status: 'offline' }).eq('channel_arn', streamData.channelArn);

      if (timerRef.current) clearInterval(timerRef.current);
      setStreamData(null);
      setTimeLeft(null);
      setTitle("");
      
      if (isAuto) alert("Your 60-minute ministry session has concluded. God bless you!");
      else alert("Broadcast ended successfully.");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- RENDER ---
  const isFree = userProfile?.subscription_tier === 'free';

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", padding: "60px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", background: "white", padding: "50px", borderRadius: "24px", boxShadow: "0 20px 40px rgba(11, 46, 74, 0.08)" }}>
        
        <Link href="/dashboard" style={{ color: "#0b2e4a", textDecoration: "none", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", marginBottom: "25px", opacity: 0.7 }}>
          ← Back to Dashboard
        </Link>
        
        <header style={{ marginBottom: "40px" }}>
          <h2 style={{ color: "#0b2e4a", fontSize: "2.2rem", margin: 0 }}>Broadcaster Studio</h2>
          <div style={{ width: "50px", height: "4px", background: "#d4af37", borderRadius: "2px", margin: "15px 0" }}></div>
          <p style={{ color: "#5a7184" }}>Share your message in real-time.</p>
        </header>
        
        {!streamData ? (
          <section>
            {isFree && (
              <div style={{ background: "#fff9db", padding: "15px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #fce588", color: "#856404", fontSize: "14px" }}>
                ⭐ <strong>Gold feature:</strong> Live streaming is reserved for Gold Supporters. <Link href="/pricing" style={{ color: "#0b2e4a" }}>Explore plans</Link>
              </div>
            )}

            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "10px", fontWeight: "700", fontSize: "12px", textTransform: "uppercase" }}>Broadcast Title</label>
              <input 
                type="text" 
                placeholder="Ex: Morning Prayer" 
                disabled={isFree}
                style={{ width: "100%", padding: "18px", borderRadius: "12px", border: "2px solid #e1e8ed", boxSizing: "border-box", opacity: isFree ? 0.5 : 1 }}
                onChange={(e) => setTitle(e.target.value)}
                value={title}
              />
            </div>
            
            <button 
              onClick={handleGoLive}
              disabled={loading || isFree}
              style={{ width: "100%", padding: "18px", background: isFree ? "#ccc" : "#e63946", color: "white", borderRadius: "12px", fontWeight: "700", border: "none", cursor: isFree ? "not-allowed" : "pointer" }}
            >
              {loading ? "Preparing..." : "🔴 Go Live Now"}
            </button>
          </section>
        ) : (
          <section>
            {timeLeft !== null && (
              <div style={{ background: timeLeft < 300000 ? "#fee2e2" : "#f0fdf4", padding: "15px", borderRadius: "12px", marginBottom: "20px", textAlign: "center", border: "1px solid #bbf7d0" }}>
                <span style={{ fontWeight: "700", color: timeLeft < 300000 ? "#b91c1c" : "#166534" }}>
                  Time Remaining: {formatTime(timeLeft)}
                </span>
              </div>
            )}

            <div style={{ background: "#f0fdf4", padding: "30px", borderRadius: "18px", border: "1px solid #bbf7d0", marginBottom: "30px" }}>
              <p style={{ fontSize: "14px", marginBottom: "20px" }}>Paste these into <strong>OBS Studio</strong>:</p>
              
              <div style={{ marginBottom: "15px" }}>
                 <label style={{ fontWeight: "700", fontSize: "11px", textTransform: "uppercase" }}>Server URL</label>
                 <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "12px", fontFamily: "monospace", wordBreak: "break-all" }}>
                   rtmps://{streamData.ingestEndpoint}:443/app/
                 </div>
              </div>

              <div>
                 <label style={{ fontWeight: "700", fontSize: "11px", textTransform: "uppercase" }}>Stream Key</label>
                 <div style={{ background: "white", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "12px", fontFamily: "monospace", fontWeight: "bold" }}>
                   {streamData.streamKey}
                 </div>
              </div>
            </div>

            <button 
              onClick={() => handleEndBroadcast(false)}
              disabled={loading}
              style={{ width: "100%", padding: "16px", background: "transparent", color: "#e63946", border: "2px solid #e63946", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}
            >
              {loading ? "Ending..." : "⏹ End Broadcast"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}