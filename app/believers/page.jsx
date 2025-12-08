"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function BelieversPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("my_believers"); // 'my_believers', 'seek', 'requests'
  
  // Data
  const [myBelievers, setMyBelievers] = useState([]);
  const [seekResults, setSeekResults] = useState([]);
  const [requests, setRequests] = useState([]);
  
  // Status Map (To fix the "Already Connected" issue)
  // Format: { 'userId': 'connected' | 'pending' | 'none' }
  const [connectionStatus, setConnectionStatus] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      loadMyBelievers(data.user.id);
      loadRequests(data.user.id);
      loadSeek(data.user.id); // Initial load of suggestions
    }
  }

  // --- 1. LOAD MY BELIEVERS (Connected Friends) ---
  async function loadMyBelievers(userId) {
    const { data: conns } = await supabase
      .from('connections')
      .select('*')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .eq('status', 'connected');

    if (!conns) return;

    const friendIds = conns.map(c => c.user_a === userId ? c.user_b : c.user_a);
    if (friendIds.length > 0) {
      const { data: friends } = await supabase.from('profiles').select('*').in('id', friendIds);
      setMyBelievers(friends || []);
    } else {
      setMyBelievers([]);
    }
  }

  // --- 2. LOAD SEEK (Directory with Status Check) ---
  async function loadSeek(userId, queryTerm = "") {
    setLoading(true);
    
    // A. Fetch All Connections first (to determine status)
    const { data: myConns } = await supabase
      .from('connections')
      .select('*')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);
    
    // Create a Status Map for quick lookup
    const statusMap = {};
    if (myConns) {
      myConns.forEach(c => {
        const otherId = c.user_a === userId ? c.user_b : c.user_a;
        statusMap[otherId] = c.status; // 'connected' or 'pending'
      });
    }
    setConnectionStatus(statusMap);

    // B. Build Profile Query
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .limit(50);

    if (queryTerm) {
      // Search Name, Username, Email, Church
      query = query.or(`full_name.ilike.%${queryTerm}%,username.ilike.%${queryTerm}%,email.ilike.%${queryTerm}%,church.ilike.%${queryTerm}%`);
    }

    const { data: profiles } = await query;
    setSeekResults(profiles || []);
    setLoading(false);
  }

  // --- 3. LOAD REQUESTS ---
  async function loadRequests(userId) {
    const { data: reqs } = await supabase
      .from('connections')
      .select('*, profiles:user_a(*)') // Fetch sender details
      .eq('user_b', userId)
      .eq('status', 'pending');
    
    if (reqs) setRequests(reqs);
  }

  // --- ACTIONS ---

  async function handleSearch() {
    if (!user) return;
    loadSeek(user.id, searchQuery);
  }

  async function handleConnect(targetUserId) {
    if (!user) return;
    
    // Optimistic Update
    setConnectionStatus(prev => ({ ...prev, [targetUserId]: 'pending' }));

    const { error } = await supabase.from('connections').insert({
      user_a: user.id,
      user_b: targetUserId,
      status: 'pending' 
    });
    
    if (error) {
      alert("Error: " + error.message);
      // Revert on error
      setConnectionStatus(prev => ({ ...prev, [targetUserId]: 'none' }));
    }
  }

  async function handleAccept(connectionId) {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'connected' })
      .eq('id', connectionId);

    if (!error) {
      alert("✅ Connected!");
      loadRequests(user.id); // Remove from requests
      loadMyBelievers(user.id); // Add to friends
    }
  }

  if (!mounted) return null;

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "30px", borderRadius: "16px", color: "white", marginBottom: "30px" }}>
        <h1 style={{ margin: 0 }}>🤝 Believers</h1>
        <p style={{ opacity: 0.9 }}>Connect with the family of God</p>
      </div>

      {/* 3 TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button onClick={() => setActiveTab("my_believers")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: activeTab === "my_believers" ? "#0b2e4a" : "white", color: activeTab === "my_believers" ? "white" : "#333", fontWeight: "bold", cursor:'pointer' }}>
          👥 My Believers ({myBelievers.length})
        </button>
        <button onClick={() => setActiveTab("seek")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: activeTab === "seek" ? "#0b2e4a" : "white", color: activeTab === "seek" ? "white" : "#333", fontWeight: "bold", cursor:'pointer' }}>
          🔍 Seek
        </button>
        <button onClick={() => setActiveTab("requests")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: activeTab === "requests" ? "#0b2e4a" : "white", color: activeTab === "requests" ? "white" : "#333", fontWeight: "bold", cursor:'pointer' }}>
          📩 Requests ({requests.length})
        </button>
      </div>

      {/* TAB CONTENT: MY BELIEVERS */}
      {activeTab === "my_believers" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
          {myBelievers.length === 0 ? <p style={{gridColumn:'1/-1', textAlign:'center', color:'#666'}}>You haven't connected with anyone yet.</p> : 
            myBelievers.map(b => (
              <div key={b.id} style={{ background: "white", padding: "20px", borderRadius: "12px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <img src={b.avatar_url || "/images/default-avatar.png"} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px auto" }} />
                <h3 style={{ fontSize: "16px", margin: "0 0 5px 0", color: "#0b2e4a" }}>{b.full_name}</h3>
                <Link href={`/chat?uid=${b.id}`} style={{ display:'block', padding:'8px', background:'#f0f0f0', borderRadius:'6px', textDecoration:'none', color:'#333', fontSize:'13px', fontWeight:'bold' }}>💬 Message</Link>
              </div>
            ))
          }
        </div>
      )}

      {/* TAB CONTENT: SEEK */}
      {activeTab === "seek" && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <input 
              type="text" 
              placeholder="Search by Name, Username, Email, or Church Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1, padding: "15px", borderRadius: "12px", border: "1px solid #ddd", fontSize: "16px" }}
            />
            <button onClick={handleSearch} style={{ padding: "0 25px", background: "#0b2e4a", color: "white", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "bold" }}>Search</button>
          </div>

          {loading ? <p>Loading...</p> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
              {seekResults.map(b => {
                const status = connectionStatus[b.id]; // 'connected', 'pending', or undefined
                return (
                  <div key={b.id} style={{ background: "white", padding: "20px", borderRadius: "12px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <img src={b.avatar_url || "/images/default-avatar.png"} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px auto" }} />
                    <h3 style={{ fontSize: "16px", margin: "0 0 5px 0", color: "#0b2e4a" }}>{b.full_name}</h3>
                    <p style={{fontSize:'12px', color:'#666', marginBottom:'10px'}}>{b.church || "Believer"}</p>
                    
                    {/* BUTTON LOGIC */}
                    {status === 'connected' ? (
                      <button disabled style={{ width:'100%', padding: "8px", background: "#e8f5e9", color: "#2e8b57", border: "none", borderRadius: "6px", fontWeight: "bold", cursor:'default' }}>✅ Connected</button>
                    ) : status === 'pending' ? (
                      <button disabled style={{ width:'100%', padding: "8px", background: "#fff9c4", color: "#fbc02d", border: "none", borderRadius: "6px", fontWeight: "bold", cursor:'default' }}>🕒 Pending</button>
                    ) : (
                      <button onClick={() => handleConnect(b.id)} style={{ width:'100%', padding: "8px", background: "#2e8b57", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>➕ Connect</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT: REQUESTS */}
      {activeTab === "requests" && (
        <div>
          {requests.length === 0 ? <p style={{textAlign:'center', color:'#666'}}>No pending requests.</p> : (
            <div style={{ display: "grid", gap: "15px" }}>
              {requests.map(req => (
                <div key={req.id} style={{ background: "white", padding: "15px", borderRadius: "12px", display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#2e8b57", display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold' }}>
                      {req.profiles?.full_name?.[0]}
                    </div>
                    <span style={{fontWeight:'bold'}}>{req.profiles?.full_name}</span>
                  </div>
                  <button onClick={() => handleAccept(req.id)} style={{ padding: "8px 16px", background: "#2e8b57", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>✅ Accept</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}