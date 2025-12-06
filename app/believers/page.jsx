"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function BelieversPage() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("suggestions");
  const [believers, setBelievers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        loadBelievers();
        loadConnections(data.user.id);
      }
    }
    loadUser();
  }, []);

  async function loadBelievers() {
    // Load all profiles from database
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(20);

    if (data) {
      setBelievers(data);
    }
  }

  async function loadConnections(userId) {
    // This will be implemented with a connections table later
    // For now, we'll use localStorage
    const saved = localStorage.getItem(`connections_${userId}`);
    if (saved) {
      setConnections(JSON.parse(saved));
    }
  }

  function handleConnect(believerId) {
    if (!user) return;
    
    const newConnections = [...connections, believerId];
    setConnections(newConnections);
    localStorage.setItem(`connections_${user.id}`, JSON.stringify(newConnections));
    alert("✅ Connected! You're now connected with this believer.");
  }

  function handleDisconnect(believerId) {
    if (!user) return;
    
    const newConnections = connections.filter(id => id !== believerId);
    setConnections(newConnections);
    localStorage.setItem(`connections_${user.id}`, JSON.stringify(newConnections));
    alert("Disconnected from this believer.");
  }

  function isConnected(believerId) {
    return connections.includes(believerId);
  }

  const filteredBelievers = believers.filter(b => 
    b.id !== user?.id && 
    (b.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     b.church?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const connectedBelievers = believers.filter(b => connections.includes(b.id));
  const suggestedBelievers = filteredBelievers.filter(b => !connections.includes(b.id));

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)",
        padding: "30px",
        borderRadius: "16px",
        color: "white",
        marginBottom: "30px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ margin: 0, fontSize: "2.2rem" }}>🤝 Believers</h1>
        <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "1.1rem" }}>
          Connect with believers from around the world
        </p>
      </div>

      {/* Search Bar */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <input
          type="text"
          placeholder="🔍 Seek believers by name or church..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 20px",
            borderRadius: "10px",
            border: "2px solid #e0e0e0",
            fontSize: "16px",
            outline: "none"
          }}
        />
      </div>

      {/* Tabs */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "10px",
        marginBottom: "20px",
        display: "flex",
        gap: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <button
          onClick={() => setActiveTab("suggestions")}
          style={{
            flex: 1,
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            background: activeTab === "suggestions" ? "#2e8b57" : "transparent",
            color: activeTab === "suggestions" ? "white" : "#666",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          ✨ Suggestions ({suggestedBelievers.length})
        </button>
        <button
          onClick={() => setActiveTab("connected")}
          style={{
            flex: 1,
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            background: activeTab === "connected" ? "#2e8b57" : "transparent",
            color: activeTab === "connected" ? "white" : "#666",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          🤝 Connected ({connectedBelievers.length})
        </button>
      </div>

      {/* Believers Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "20px"
      }}>
        {(activeTab === "suggestions" ? suggestedBelievers : connectedBelievers).map((believer) => (
          <div
            key={believer.id}
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
            }}
          >
            {/* Avatar */}
            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: believer.avatar_url 
                  ? `url(${believer.avatar_url}) center/cover`
                  : "linear-gradient(135deg, #2e8b57, #1d5d3a)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "32px",
                fontWeight: "bold",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}>
                {!believer.avatar_url && (believer.full_name?.[0] || "B")}
              </div>
            </div>

            {/* Info */}
            <h3 style={{
              margin: "0 0 5px 0",
              textAlign: "center",
              color: "#0b2e4a",
              fontSize: "1.2rem"
            }}>
              {believer.full_name || "Believer"}
            </h3>
            
            {believer.church && (
              <p style={{
                margin: "0 0 10px 0",
                textAlign: "center",
                color: "#666",
                fontSize: "14px"
              }}>
                ⛪ {believer.church}
              </p>
            )}

            {believer.about && (
              <p style={{
                margin: "10px 0",
                color: "#666",
                fontSize: "14px",
                lineHeight: "1.5",
                maxHeight: "60px",
                overflow: "hidden"
              }}>
                {believer.about}
              </p>
            )}

            {/* Action Button */}
            <button
              onClick={() => {
                if (isConnected(believer.id)) {
                  handleDisconnect(believer.id);
                } else {
                  handleConnect(believer.id);
                }
              }}
              style={{
                width: "100%",
                padding: "10px",
                border: "none",
                borderRadius: "8px",
                background: isConnected(believer.id) ? "#f0f0f0" : "#2e8b57",
                color: isConnected(believer.id) ? "#666" : "white",
                fontWeight: "600",
                cursor: "pointer",
                marginTop: "10px",
                transition: "all 0.2s"
              }}
            >
              {isConnected(believer.id) ? "✓ Connected" : "➕ Connect"}
            </button>
          </div>
        ))}

        {/* Empty State */}
        {(activeTab === "suggestions" ? suggestedBelievers : connectedBelievers).length === 0 && (
          <div style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            padding: "60px 20px",
            color: "#666"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "20px" }}>
              {activeTab === "suggestions" ? "🔍" : "🤝"}
            </div>
            <h3 style={{ color: "#0b2e4a", marginBottom: "10px" }}>
              {activeTab === "suggestions" 
                ? "No believers found" 
                : "No connections yet"}
            </h3>
            <p>
              {activeTab === "suggestions"
                ? "Try a different search or check back later"
                : "Start connecting with believers to see them here"}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}