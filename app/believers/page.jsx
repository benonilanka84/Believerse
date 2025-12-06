"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function BelieversPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("suggestions");
  const [believers, setBelievers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

useEffect(() => {
  if (mounted && user) {
    loadSuggestedBelievers();
  }
}, [mounted, user]);

async function loadSuggestedBelievers() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id)
      .limit(3);

    if (!error && data) {
      setSuggestedBelievers(data);
    }
  } catch (error) {
    console.error("Error loading suggested believers:", error);
  }
}

    async function loadUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Auth error:", error);
          setError("Authentication error");
          setLoading(false);
          return;
        }

        if (data?.user) {
          console.log("Current user:", data.user.id);
          setUser(data.user);
          
          await Promise.all([
            loadBelievers(data.user.id),
            loadConnections(data.user.id),
            loadConnectionRequests(data.user.id)
          ]);
        }
      } catch (err) {
        console.error("Error loading user:", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();
  }, [mounted]);

  // Load all believers with recommendation algorithm
  async function loadBelievers(currentUserId) {
    try {
      console.log("Loading believers, excluding:", currentUserId);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId);

      if (error) {
        console.error("Error loading believers:", error);
        throw error;
      }
      
      console.log("Loaded believers:", data?.length || 0);
      
      if (data && data.length > 0) {
        // Apply recommendation algorithm
        const scoredBelievers = data.map(believer => ({
          ...believer,
          score: calculateRecommendationScore(believer)
        }));

        // Sort by recommendation score (highest first)
        scoredBelievers.sort((a, b) => b.score - a.score);
        
        console.log("Scored believers:", scoredBelievers.length);
        setBelievers(scoredBelievers);
      } else {
        console.log("No believers found");
        setBelievers([]);
      }
    } catch (error) {
      console.error("Error in loadBelievers:", error);
      setError("Failed to load believers");
    }
  }

  // Recommendation algorithm
  function calculateRecommendationScore(believer) {
    let score = 0;

    // Recent members get higher score (joined in last 30 days)
    const daysSinceJoined = (Date.now() - new Date(believer.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceJoined < 30) {
      score += 50;
    } else if (daysSinceJoined < 90) {
      score += 30;
    }

    // Complete profiles get higher score
    if (believer.full_name && believer.full_name.trim()) score += 20;
    if (believer.church && believer.church.trim()) score += 15;
    if (believer.about && believer.about.trim()) score += 15;
    if (believer.faith_journey && believer.faith_journey.trim()) score += 20;
    if (believer.avatar_url) score += 10;

    // Has email
    if (believer.email) score += 10;

    return score;
  }

  // Load user's connections
  async function loadConnections(userId) {
    try {
      console.log("Loading connections for:", userId);
      
      const { data, error } = await supabase
        .from("connections")
        .select("connected_user_id")
        .eq("user_id", userId);

      if (error) {
        console.error("Connections table error:", error);
        // Fallback to localStorage
        const saved = localStorage.getItem(`connections_${userId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log("Using localStorage connections:", parsed.length);
          setConnections(parsed);
        } else {
          setConnections([]);
        }
        return;
      }

      if (data) {
        const connectionIds = data.map(conn => conn.connected_user_id);
        console.log("Loaded connections:", connectionIds.length);
        setConnections(connectionIds);
        
        // Sync with localStorage
        localStorage.setItem(`connections_${userId}`, JSON.stringify(connectionIds));
      } else {
        setConnections([]);
      }
    } catch (error) {
      console.error("Error loading connections:", error);
      setConnections([]);
    }
  }

  // Load connection requests
  async function loadConnectionRequests(userId) {
    try {
      console.log("Loading connection requests for:", userId);
      
      // Load pending requests received
      const { data: received, error: receivedError } = await supabase
        .from("connection_requests")
        .select(`
          *,
          sender:profiles!connection_requests_sender_id_fkey(*)
        `)
        .eq("receiver_id", userId)
        .eq("status", "pending");

      if (receivedError) {
        console.error("Error loading received requests:", receivedError);
        setPendingRequests([]);
      } else {
        console.log("Received requests:", received?.length || 0);
        setPendingRequests(received || []);
      }

      // Load sent requests
      const { data: sent, error: sentError } = await supabase
        .from("connection_requests")
        .select("receiver_id, status")
        .eq("sender_id", userId);

      if (sentError) {
        console.error("Error loading sent requests:", sentError);
        setSentRequests([]);
      } else {
        console.log("Sent requests:", sent?.length || 0);
        setSentRequests(sent || []);
      }
    } catch (error) {
      console.error("Error in loadConnectionRequests:", error);
      setPendingRequests([]);
      setSentRequests([]);
    }
  }

  // Send connection request
  async function sendConnectionRequest(receiverId) {
    if (!user || actionInProgress) return;
    
    setActionInProgress(receiverId);
    
    try {
      console.log("Sending connection request to:", receiverId);
      
      const { data, error } = await supabase
        .from("connection_requests")
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: "pending"
        })
        .select();

      if (error) {
        console.error("Error sending request:", error);
        
        if (error.code === '23505') {
          alert("You've already sent a request to this believer.");
        } else {
          throw error;
        }
      } else {
        console.log("Request sent successfully:", data);
        
        // Reload sent requests
        await loadConnectionRequests(user.id);
        alert("✅ Connection request sent!");
      }
      
    } catch (error) {
      console.error("Error in sendConnectionRequest:", error);
      alert("Failed to send request. Please try again.");
    } finally {
      setActionInProgress(null);
    }
  }

  // Accept connection request
  async function acceptConnectionRequest(requestId, senderId) {
    if (!user || actionInProgress) return;
    
    setActionInProgress(requestId);
    
    try {
      console.log("Accepting request:", requestId);
      
      // Update request status
      const { error: updateError } = await supabase
        .from("connection_requests")
        .update({ 
          status: "accepted", 
          updated_at: new Date().toISOString() 
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error updating request:", updateError);
        throw updateError;
      }

      // Create mutual connections
      const { error: conn1Error } = await supabase
        .from("connections")
        .insert({ 
          user_id: user.id, 
          connected_user_id: senderId 
        });

      if (conn1Error && conn1Error.code !== '23505') {
        console.error("Error creating connection 1:", conn1Error);
        throw conn1Error;
      }

      const { error: conn2Error } = await supabase
        .from("connections")
        .insert({ 
          user_id: senderId, 
          connected_user_id: user.id 
        });

      if (conn2Error && conn2Error.code !== '23505') {
        console.error("Error creating connection 2:", conn2Error);
        throw conn2Error;
      }

      console.log("Connection accepted successfully");

      // Reload data
      await loadConnections(user.id);
      await loadConnectionRequests(user.id);
      
      alert("✅ Connection accepted!");
      
    } catch (error) {
      console.error("Error in acceptConnectionRequest:", error);
      alert("Failed to accept request. Please try again.");
    } finally {
      setActionInProgress(null);
    }
  }

  // Reject connection request
  async function rejectConnectionRequest(requestId) {
    if (!user || actionInProgress) return;
    
    setActionInProgress(requestId);
    
    try {
      console.log("Rejecting request:", requestId);
      
      const { error } = await supabase
        .from("connection_requests")
        .update({ 
          status: "rejected", 
          updated_at: new Date().toISOString() 
        })
        .eq("id", requestId);

      if (error) {
        console.error("Error rejecting request:", error);
        throw error;
      }

      console.log("Request rejected successfully");
      await loadConnectionRequests(user.id);
      alert("Request declined.");
      
    } catch (error) {
      console.error("Error in rejectConnectionRequest:", error);
      alert("Failed to decline request. Please try again.");
    } finally {
      setActionInProgress(null);
    }
  }

// Cancel sent request
  async function cancelConnectionRequest(receiverId) {
    if (!user || actionInProgress) return;
    
    setActionInProgress(receiverId);
    
    try {
      console.log("Cancelling request to:", receiverId);
      
      const { error } = await supabase
        .from("connection_requests")
        .delete()
        .eq("sender_id", user.id)
        .eq("receiver_id", receiverId);

      if (error) {
        console.error("Error cancelling request:", error);
        throw error;
      }

      console.log("Request cancelled successfully");
      await loadConnectionRequests(user.id);
      alert("Request cancelled.");
      
    } catch (error) {
      console.error("Error in cancelConnectionRequest:", error);
      alert("Failed to cancel request. Please try again.");
    } finally {
      setActionInProgress(null);
    }
  }

  // Disconnect
  async function handleDisconnect(believerId) {
    if (!user || actionInProgress) return;
    
    if (!confirm("Are you sure you want to disconnect?")) return;
    
    setActionInProgress(believerId);
    
    try {
      console.log("Disconnecting from:", believerId);
      
      // Delete both connections (mutual)
      await supabase
        .from("connections")
        .delete()
        .eq("user_id", user.id)
        .eq("connected_user_id", believerId);

      await supabase
        .from("connections")
        .delete()
        .eq("user_id", believerId)
        .eq("connected_user_id", user.id);

      console.log("Disconnected successfully");
      await loadConnections(user.id);
      alert("Disconnected successfully.");
      
    } catch (error) {
      console.error("Error in handleDisconnect:", error);
      alert("Failed to disconnect. Please try again.");
    } finally {
      setActionInProgress(null);
    }
  }

  // Check connection status
  function getConnectionStatus(believerId) {
    if (connections.includes(believerId)) {
      return { status: "connected", label: "✓ Connected" };
    }
    
    const sentRequest = sentRequests.find(r => r.receiver_id === believerId && r.status === "pending");
    if (sentRequest) {
      return { status: "pending", label: "⏳ Pending" };
    }
    
    return { status: "none", label: "➕ Connect" };
  }

  // Get initials for avatar
  function getInitials(name) {
    if (!name) return "B";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Filter believers
  const filteredBelievers = believers.filter(b => 
    b.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.church?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.about?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const connectedBelievers = filteredBelievers.filter(b => connections.includes(b.id));
  const [suggestedBelievers, setSuggestedBelievers] = useState([]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div style={{
        minHeight: "calc(100vh - 100px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "15px" }}>🤝</div>
          <p style={{ color: "#0b2e4a" }}>Loading believers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "calc(100vh - 100px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center", color: "#d62828" }}>
          <div style={{ fontSize: "3rem", marginBottom: "15px" }}>⚠️</div>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: "15px",
              padding: "10px 20px",
              background: "#2e8b57",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
        {/* Debug info - remove in production */}
        <p style={{ margin: "8px 0 0 0", opacity: 0.7, fontSize: "0.9rem" }}>
          Total believers: {believers.length} | Connected: {connections.length} | Pending: {pendingRequests.length}
        </p>
      </div>

{/* Pending Requests Banner */}
      {pendingRequests.length > 0 && (
        <div style={{
          background: "#fff9e6",
          border: "2px solid #ffd700",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px"
        }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#d4af37" }}>
            🔔 Connection Requests ({pendingRequests.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "15px",
                  background: "white",
                  borderRadius: "10px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {request.sender?.avatar_url ? (
                    <img
                      src={request.sender.avatar_url}
                      alt={request.sender.full_name}
                      style={{
                        width: "45px",
                        height: "45px",
                        borderRadius: "50%",
                        objectFit: "cover"
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "45px",
                      height: "45px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #2e8b57, #1d5d3a)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "18px",
                      fontWeight: "bold"
                    }}>
                      {getInitials(request.sender?.full_name)}
                    </div>
                  )}
                  <div>
                    <strong style={{ color: "#0b2e4a" }}>
                      {request.sender?.full_name || "Believer"}
                    </strong>
                    <div style={{ fontSize: "13px", color: "#666" }}>
                      wants to connect with you
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => acceptConnectionRequest(request.id, request.sender_id)}
                    disabled={actionInProgress === request.id}
                    style={{
                      padding: "8px 16px",
                      background: actionInProgress === request.id ? "#ccc" : "#2e8b57",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: actionInProgress === request.id ? "not-allowed" : "pointer"
                    }}
                  >
                    {actionInProgress === request.id ? "..." : "Accept"}
                  </button>
                  <button
                    onClick={() => rejectConnectionRequest(request.id)}
                    disabled={actionInProgress === request.id}
                    style={{
                      padding: "8px 16px",
                      background: "#f0f0f0",
                      color: "#666",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: actionInProgress === request.id ? "not-allowed" : "pointer"
                    }}
                  >
                    {actionInProgress === request.id ? "..." : "Decline"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          onFocus={(e) => e.target.style.borderColor = "#2e8b57"}
          onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
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
        {suggestedBelievers.map((believer) => (
  <div key={believer.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
    <div style={{ display: "flex", alignItems: "center" }}>
      {believer.avatar_url ? (
        <img
          src={believer.avatar_url}
          alt={believer.full_name}
          style={{
            width: "35px",
            height: "35px",
            borderRadius: "50%",
            objectFit: "cover",
            marginRight: "10px"
          }}
        />
      ) : (
        <div style={{ 
          width: "35px", 
          height: "35px", 
          borderRadius: "50%", 
          background: "#2e8b57", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          color: "white", 
          fontSize: "14px", 
          fontWeight: "bold", 
          marginRight: "10px" 
        }}>
          {believer.full_name?.[0]?.toUpperCase() || "B"}
        </div>
      )}
      <div>
        <strong style={{ fontSize: "14px" }}>{believer.full_name || "Believer"}</strong>
        <div style={{ fontSize: "12px", color: "#666" }}>{believer.church || "Faith Community"}</div>
      </div>
    </div>
    <Link href="/believers">
      <button className="btn" style={{ padding: "6px 12px", fontSize: "12px" }}>➕ Connect</button>
    </Link>
  </div>
))}

{suggestedBelievers.length === 0 && (
  <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
    <p style={{ fontSize: "13px" }}>No suggestions yet</p>
  </div>
)}
          🤝 Connected ({connectedBelievers.length})
        </button>
      </div>

      {/* Believers Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "20px"
      }}>
        {(activeTab === "suggestions" ? suggestedBelievers : connectedBelievers).map((believer) => {
          const connectionStatus = getConnectionStatus(believer.id);
          
          return (
            <div
              key={believer.id}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                transition: "transform 0.2s, box-shadow 0.2s"
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
                {believer.avatar_url ? (
                  <img
                    src={believer.avatar_url}
                    alt={believer.full_name || "Believer"}
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const placeholder = e.target.nextElementSibling;
                      if (placeholder) placeholder.style.display = 'inline-flex';
                    }}
                  />
                ) : null}
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2e8b57, #1d5d3a)",
                  display: believer.avatar_url ? "none" : "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "32px",
                  fontWeight: "bold",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}>
                  {getInitials(believer.full_name)}
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
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>
                  {believer.about}
                </p>
              )}

              {/* Member since */}
              <p style={{
                margin: "10px 0",
                color: "#999",
                fontSize: "12px",
                textAlign: "center"
              }}>
                Member since {new Date(believer.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </p>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {connectionStatus.status === "connected" ? (
                  <button
                    onClick={() => handleDisconnect(believer.id)}
                    disabled={actionInProgress === believer.id}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "none",
                      borderRadius: "8px",
                      background: actionInProgress === believer.id ? "#ccc" : "#f0f0f0",
                      color: "#666",
                      fontWeight: "600",
                      cursor: actionInProgress === believer.id ? "not-allowed" : "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {actionInProgress === believer.id ? "..." : "✓ Connected"}
                  </button>
                ) : connectionStatus.status === "pending" ? (
                  <button
                    onClick={() => cancelConnectionRequest(believer.id)}
                    disabled={actionInProgress === believer.id}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "none",
                      borderRadius: "8px",
                      background: actionInProgress === believer.id ? "#ccc" : "#fff9e6",
                      color: "#d4af37",
                      fontWeight: "600",
                      cursor: actionInProgress === believer.id ? "not-allowed" : "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {actionInProgress === believer.id ? "..." : "⏳ Pending (Cancel)"}
                  </button>
                ) : (
                  <button
                    onClick={() => sendConnectionRequest(believer.id)}
                    disabled={actionInProgress === believer.id}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "none",
                      borderRadius: "8px",
                      background: actionInProgress === believer.id ? "#ccc" : "#2e8b57",
                      color: "white",
                      fontWeight: "600",
                      cursor: actionInProgress === believer.id ? "not-allowed" : "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {actionInProgress === believer.id ? "..." : "➕ Connect"}
                  </button>
                )}

                {/* View Profile Link */}
                <Link
                  href={`/believers/${believer.id}`}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "8px",
                    color: "#2d6be3",
                    fontSize: "14px",
                    textDecoration: "none",
                    fontWeight: "500"
                  }}
                >
                  View Profile →
                </Link>
              </div>
            </div>
          );
        })}

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
                ? searchQuery 
                  ? "No believers found matching your search" 
                  : "No believers found"
                : "No connections yet"}
            </h3>
            <p>
              {activeTab === "suggestions"
                ? searchQuery 
                  ? "Try a different search term"
                  : "Check back later for new believers to connect with"
                : "Start connecting with believers to see them here"}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

