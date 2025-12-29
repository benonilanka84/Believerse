"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LiveNowFeed() {
  const [activeBroadcasts, setActiveBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getLiveStreams() {
      // Fetch only streams marked as 'live'
      const { data, error } = await supabase
        .from('live_streams')
        .select(`
          id, 
          title, 
          playback_url,
          host:profiles(full_name, avatar_url)
        `)
        .eq('status', 'live');

      if (!error) setActiveBroadcasts(data);
      setLoading(false);
    }

    getLiveStreams();

    // Optional: Set up a realtime subscription to update the feed automatically
    const subscription = supabase
      .channel('live_updates')
      .on('postgres_changes', { event: '*', table: 'live_streams' }, getLiveStreams)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) return <div style={{ color: "#666", fontSize: "14px" }}>Looking for live broadcasts...</div>;
  if (activeBroadcasts.length === 0) return null; // Hide the section if no one is live

  return (
    <div style={{ marginBottom: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div style={{ width: "10px", height: "10px", background: "#e63946", borderRadius: "50%", animation: "pulse 1.5s infinite" }}></div>
        <h3 style={{ color: "#0b2e4a", margin: 0, fontSize: "1.2rem", fontWeight: "700" }}>Live Now</h3>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {activeBroadcasts.map((stream) => (
          <div key={stream.id} style={{ 
            background: "white", 
            borderRadius: "16px", 
            padding: "20px", 
            border: "1px solid #e1e8ed",
            boxShadow: "0 4px 12px rgba(11, 46, 74, 0.05)",
            transition: "transform 0.2s"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "15px" }}>
              <img 
                src={stream.host?.avatar_url || "/images/default-avatar.png"} 
                style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "2px solid #f0f4f8" }} 
              />
              <div>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0b2e4a" }}>{stream.host?.full_name}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#5a7184" }}>Broadcasting Now</p>
              </div>
            </div>

            <h4 style={{ color: "#0b2e4a", fontSize: "16px", marginBottom: "20px", lineHeight: "1.4" }}>{stream.title}</h4>

            <Link href={`/live/${stream.id}`} style={{ 
              display: "block",
              textAlign: "center",
              padding: "12px",
              background: "#0b2e4a",
              color: "white",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "14px"
            }}>
              Watch Live
            </Link>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}