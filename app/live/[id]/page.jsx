"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export default function LiveViewerPage() {
  const { id } = useParams(); 
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // CHAT STATES
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [user, setUser] = useState(null);
  const chatEndRef = useRef(null);

  /**
   * 1. INITIALIZATION: FETCH STREAM & USER
   */
  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user);

      const { data, error } = await supabase
        .from('live_streams')
        .select('*, host:profiles(full_name, avatar_url)')
        .eq('id', id)
        .single();
      
      if (data) {
        setStream(data);
        fetchMessages();
        setupChatListener();
      }
      setLoading(false);
    }
    init();
  }, [id]);

  /**
   * 2. CHAT LOGIC: FETCH & REAL-TIME
   */
  async function fetchMessages() {
    const { data } = await supabase
      .from('live_chat')
      .select('*, profiles(full_name)')
      .eq('stream_id', id)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    scrollToBottom();
  }

  function setupChatListener() {
    const channel = supabase
      .channel(`chat:${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'live_chat', 
        filter: `stream_id=eq.${id}` 
      }, (payload) => {
        // Optimistic refresh: fetch full data to get profile names
        fetchMessages(); 
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  async function sendChatMessage(e) {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !user) return;

    const { error } = await supabase.from('live_chat').insert({
      stream_id: id,
      user_id: user.id,
      content: chatInput
    });

    if (!error) setChatInput("");
  }

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0b2e4a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "white", fontSize: "1.2rem" }}>Entering Broadcast...</p>
    </div>
  );

  if (!stream) return (
    <div style={{ minHeight: "100vh", background: "#0b2e4a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "white", fontSize: "1.2rem" }}>This broadcast has ended. God bless you!</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#061a2b", color: "white", paddingBottom: "50px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px", display: "grid", gridTemplateColumns: "1fr 380px", gap: "30px" }}>
        
        {/* LEFT: CINEMATIC VIDEO PLAYER */}
        <div>
          <div style={{ 
            position: "relative", 
            width: "100%",
            aspectRatio: "16/9", // Forced cinematic ratio to eliminate black side bars
            background: "black", 
            borderRadius: "20px", 
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)" 
          }}>
            <iframe 
              src={`https://player.live-video.net/1.24.0/embed.html?url=${encodeURIComponent(stream.playback_url)}&autoplay=true`}
              allow="autoplay; fullscreen"
              allowFullScreen
              style={{ border: "none", position: "absolute", top: 0, left: 0, height: "100%", width: "100%" }}
            ></iframe>
          </div>

          <div style={{ marginTop: "30px", display: "flex", alignItems: "center", gap: "20px" }}>
            <img 
              src={stream.host?.avatar_url || "/images/default-avatar.png"} 
              style={{ width: "65px", height: "65px", borderRadius: "50%", border: "3px solid #d4af37" }} 
            />
            <div>
              <h1 style={{ fontSize: "2rem", margin: 0, fontWeight: "800", letterSpacing: "-0.5px" }}>{stream.title}</h1>
              <p style={{ margin: "5px 0 0 0", color: "#b4dcff", fontSize: "1.1rem", opacity: 0.9 }}>
                Ministering: <strong>{stream.host?.full_name}</strong>
              </p>
            </div>
            <div style={{ marginLeft: "auto", background: "#e63946", padding: "10px 20px", borderRadius: "30px", fontWeight: "800", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 0 15px rgba(230, 57, 70, 0.4)" }}>
              <span style={{ width: "10px", height: "10px", background: "white", borderRadius: "50%", animation: "pulse 1.5s infinite" }}></span> LIVE
            </div>
          </div>
        </div>

        {/* RIGHT: REAL-TIME BROADCAST CHAT */}
        <div style={{ 
          background: "rgba(255,255,255,0.03)", 
          borderRadius: "20px", 
          border: "1px solid rgba(255,255,255,0.1)", 
          height: "85vh", 
          display: "flex", 
          flexDirection: "column",
          backdropFilter: "blur(10px)"
        }}>
          <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", fontWeight: "800", color: "#d4af37", textTransform: "uppercase", fontSize: "13px", letterSpacing: "1px" }}>
            Broadcast Chat
          </div>
          
          <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ background: "rgba(212, 175, 55, 0.1)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(212, 175, 55, 0.2)" }}>
              <p style={{ margin: 0, color: "#d4af37", fontSize: "13px", textAlign: "center" }}>
                Welcome to the live broadcast! Keep your words encouraging and filled with grace.
              </p>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} style={{ animation: "fadeIn 0.3s ease" }}>
                <span style={{ color: "#d4af37", fontWeight: "800", fontSize: "13px" }}>{msg.profiles?.full_name}: </span>
                <span style={{ color: "#e1e8ed", fontSize: "14px", lineHeight: "1.5" }}>{msg.content}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendChatMessage} style={{ padding: "20px", background: "rgba(0,0,0,0.2)" }}>
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a word of encouragement..." 
              style={{ 
                width: "100%", 
                padding: "15px", 
                borderRadius: "12px", 
                border: "1px solid rgba(255,255,255,0.1)", 
                background: "rgba(255,255,255,0.05)", 
                color: "white",
                outline: "none",
                fontSize: "14px"
              }} 
            />
          </form>
        </div>

      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}