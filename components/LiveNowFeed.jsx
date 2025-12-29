"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LiveNowFeed() {
  const [activeBroadcasts, setActiveBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Memoize the fetch function to prevent unnecessary re-renders during real-time updates
  const getLiveStreams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select(`
          id, 
          title, 
          playback_url,
          host:profiles(full_name, avatar_url)
        `)
        .eq('status', 'live'); // AWS-based streams are now marked 'live'

      if (error) throw error;
      setActiveBroadcasts(data || []);
    } catch (err) {
      console.error("Feed Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getLiveStreams();

    /**
     * REAL-TIME BROADCAST UPDATES
     * Listens for any status changes (live -> offline) and updates the feed instantly.
     */
    const channel = supabase
      .channel('live_broadcast_updates')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          table: 'live_streams',
          schema: 'public' 
        }, 
        () => {
          // Re-fetch data when any stream starts or stops
          getLiveStreams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [getLiveStreams]);

  if (loading) return (
    <div style={{ padding: "20px", color: "#666", fontSize: "14px", fontStyle: "italic" }}>
      Searching for active broadcasts...
    </div>
  );

  // If no one is live, the section disappears to keep the dashboard clean
  if (activeBroadcasts.length === 0) return null;

  return (
    <div style={{ marginBottom: "40px", animation: "fadeIn 0.6s ease-out" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        {/* Pulsing indicator for "Live" status */}
        <div className="live-pulse"></div>
        <h3 style={{ color: "#0b2e4a", margin: 0, fontSize: "1.2rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Live Now
        </h3>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
        gap: "24px" 
      }}>
        {activeBroadcasts.map((stream) => (
          <div key={stream.id} style={{ 
            background: "white", 
            borderRadius: "20px", 
            padding: "24px", 
            border: "1px solid #e1e8ed",
            boxShadow: "0 10px 25px rgba(11, 46, 74, 0.05)",
            transition: "transform 0.3s ease",
            cursor: "default"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
              <img 
                src={stream.host?.avatar_url || "/images/default-avatar.png"} 
                alt={stream.host?.full_name}
                style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover", border: "2px solid #f0f4f8" }} 
              />
              <div>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0b2e4a" }}>
                  {stream.host?.full_name}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#5a7184", fontWeight: "500" }}>
                  Ministering Now
                </p>
              </div>
            </div>

            <h4 style={{ color: "#0b2e4a", fontSize: "17px", marginBottom: "24px", lineHeight: "1.5", fontWeight: "600" }}>
              {stream.title}
            </h4>

            <Link href={`/live/${stream.id}`} style={{ 
              display: "block",
              textAlign: "center",
              padding: "14px",
              background: "#0b2e4a",
              color: "white",
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "14px",
              boxShadow: "0 4px 12px rgba(11, 46, 74, 0.2)",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.target.style.background = "#1d5d3a"} // Changes to a deep green on hover
            onMouseOut={(e) => e.target.style.background = "#0b2e4a"}
            >
              Watch Live
            </Link>
          </div>
        ))}
      </div>

      <style jsx>{`
        .live-pulse {
          width: 12px;
          height: 12px;
          background: #e63946;
          border-radius: 50%;
          box-shadow: 0 0 0 rgba(230, 57, 70, 0.4);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(230, 57, 70, 0); }
          100% { box-shadow: 0 0 0 0 rgba(230, 57, 70, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}