"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BelieversPage() {
  const router = useRouter();
  
  // UI States
  const [activeTab, setActiveTab] = useState("connected"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false); 
  const [loading, setLoading] = useState(true);

  // Data States
  const [currentUser, setCurrentUser] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]); 
  const [searchResults, setSearchResults] = useState([]);
  
  // Relationship Tracker
  const [relationshipMap, setRelationshipMap] = useState({}); 

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setCurrentUser(user);
    await fetchMyNetwork(user.id);
    setLoading(false);
  }

  async function fetchMyNetwork(userId) {
    // 1. UPDATED: Query using connection_requests schema
    const { data: reqs, error } = await supabase
      .from('connection_requests')
      .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) console.error("Network Fetch Error:", error);

    const relMap = {};
    const connectedList = [];
    const incomingRequests = [];

    if (reqs) {
      reqs.forEach(r => {
        const otherId = r.sender_id === userId ? r.receiver_id : r.sender_id;
        const otherProfile = r.sender_id === userId ? r.receiver : r.sender;
        
        if (r.status === 'accepted') {
          relMap[otherId] = 'connected';
          if (otherProfile) connectedList.push(otherProfile);
        } else if (r.status === 'pending') {
          if (r.sender_id === userId) {
             relMap[otherId] = 'sent'; 
          } else {
             relMap[otherId] = 'received'; 
             if (otherProfile) incomingRequests.push({ ...otherProfile, connection_id: r.id });
          }
        }
      });
    }

    setRelationshipMap(relMap);
    setConnectedUsers(connectedList);
    setPendingRequests(incomingRequests);
  }

  // --- ACTIONS ---

  async function handleSeek() {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }
    setLoading(true);
    setIsSearching(true); 

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUser.id)
      .neq('username', 'admin')
      .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
      .limit(20);

    if (!error && data) {
      // Filter out users who already have a connection or pending request
      const filteredResults = data.filter(user => !relationshipMap[user.id]);
      setSearchResults(filteredResults);
    }
    setLoading(false);
  }

  async function sendRequest(targetId) {
    const { error } = await supabase.from('connection_requests').insert({
      sender_id: currentUser.id,
      receiver_id: targetId,
      status: 'pending'
    });

    if (!error) {
      alert("Request Sent!");
      setRelationshipMap(prev => ({ ...prev, [targetId]: 'sent' }));
    } else {
      console.error(error);
      alert("Action failed: " + error.message);
    }
  }

  async function acceptRequest(requestId, userId) {
    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (!error) {
      alert("Connected!");
      // Local state cleanup for instant feedback
      const acceptedUser = pendingRequests.find(u => u.id === userId);
      setPendingRequests(prev => prev.filter(u => u.id !== userId));
      if (acceptedUser) setConnectedUsers(prev => [...prev, acceptedUser]);
      setRelationshipMap(prev => ({ ...prev, [userId]: 'connected' }));
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#bfdbfe", paddingBottom: "40px" }}>
      
      {/* 1. GREEN HEADER BAND - KEPT EXACTLY AS PER SCREENSHOT */}
      <div style={{ background: "#15803d", padding: "30px 20px", color: "white", marginBottom: "30px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ fontSize: "2.5rem" }}>🤝</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>Believers</h1>
            <p style={{ margin: 0, fontSize: "1rem", opacity: 0.9 }}>Connecting the Body of Christ</p>
          </div>
          
          <Link href="/dashboard" style={{ marginLeft: "auto", color: "white", fontSize: "14px", textDecoration: "none", background: "rgba(0,0,0,0.2)", padding: "8px 15px", borderRadius: "20px", fontWeight: "bold" }}>
             ⬅ Dashboard
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px" }}>

        {/* 2. SEEK BAR */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
          <input 
            type="text" 
            placeholder="Search by name to add new friends..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSeek()}
            style={{ 
              flex: 1, padding: "15px 20px", borderRadius: "12px", border: "2px solid white", 
              outline: "none", fontSize: "16px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" 
            }}
          />
          <button 
            onClick={handleSeek}
            style={{ 
              padding: "0 30px", background: "#0b2e4a", color: "white", borderRadius: "12px", 
              border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "16px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" 
            }}
          >
            Seek
          </button>
        </div>

        {isSearching ? (
          <div style={{ background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: "#0b2e4a" }}>Results for "{searchQuery}"</h3>
              <button onClick={() => { setIsSearching(false); setSearchQuery(""); }} style={{background:'none', border:'none', color:'#d4af37', cursor:'pointer', fontWeight:'bold', fontSize:'14px'}}>❌ Close</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
              {searchResults.length === 0 && <p style={{color:'#999', gridColumn:'1/-1', textAlign:'center'}}>No believers found.</p>}
              {searchResults.map(user => (
                  <div key={user.id} style={{ background: "#f8fafd", padding: "20px", borderRadius: "12px", border: "1px solid #eee", textAlign: "center" }}>
                    <img src={user.avatar_url || '/images/default-avatar.png'} style={{ width: "60px", height: "60px", borderRadius: "50%", margin: "0 auto 10px auto", objectFit:"cover" }} />
                    <div style={{ fontWeight: "bold", color: "#0b2e4a" }}>{user.full_name}</div>
                    <button onClick={() => sendRequest(user.id)} style={{ marginTop:'10px', width: '100%', padding: "8px", background: "#15803d", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight:'bold' }}>+ Request</button>
                  </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* 3. TABS HEADER */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button 
                onClick={() => setActiveTab('connected')}
                style={{ 
                  flex: 1, padding: "15px", fontWeight: "bold", border: "none", cursor: "pointer", borderRadius: "10px",
                  background: activeTab === 'connected' ? "white" : "rgba(255,255,255,0.5)",
                  color: activeTab === 'connected' ? "#15803d" : "#64748b",
                  boxShadow: activeTab === 'connected' ? "0 4px 6px rgba(0,0,0,0.05)" : "none"
                }}
              >
                Connected ({connectedUsers.length})
              </button>
              <button 
                onClick={() => setActiveTab('requests')}
                style={{ 
                  flex: 1, padding: "15px", fontWeight: "bold", border: "none", cursor: "pointer", borderRadius: "10px",
                  background: activeTab === 'requests' ? "white" : "rgba(255,255,255,0.5)",
                  color: activeTab === 'requests' ? "#15803d" : "#64748b",
                  boxShadow: activeTab === 'requests' ? "0 4px 6px rgba(0,0,0,0.05)" : "none"
                }}
              >
                Requests ({pendingRequests.length})
              </button>
            </div>

            {/* TAB CONTENT */}
            <div style={{ background: "white", padding: "20px", borderRadius: "16px", minHeight: "300px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
              {activeTab === 'connected' ? (
                connectedUsers.length === 0 ? 
                <div style={{textAlign:'center', padding:'40px', color:'#888'}}>
                  <p>No connections yet. Use the Seek bar to find believers!</p>
                </div> 
                :
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "15px" }}>
                  {connectedUsers.map(user => (
                    <div key={user.id} style={{ padding: "15px", borderRadius: "12px", border: "1px solid #eee", display:'flex', alignItems:'center', gap:'15px', background:'#f8fafd' }}>
                      <img src={user.avatar_url || '/images/default-avatar.png'} style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit:"cover" }} />
                      <div>
                        <div style={{ fontWeight: "bold", color: "#0b2e4a" }}>{user.full_name}</div>
                        <Link href={`/profile/${user.id}`} style={{ fontSize: "12px", color: "#15803d", textDecoration:'none', fontWeight:'bold' }}>View Profile</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                pendingRequests.length === 0 ? 
                <div style={{textAlign:'center', padding:'40px', color:'#888'}}>
                  <p>No pending requests.</p>
                </div>
                :
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
                  {pendingRequests.map(user => (
                    <div key={user.id} style={{ padding: "20px", borderRadius: "12px", border: "1px solid #eee", textAlign: "center", background:'#f8fafd' }}>
                      <img src={user.avatar_url || '/images/default-avatar.png'} style={{ width: "60px", height: "60px", borderRadius: "50%", margin:'0 auto 10px auto', objectFit:"cover" }} />
                      <div style={{ fontWeight: "bold", color: "#0b2e4a" }}>{user.full_name}</div>
                      <p style={{fontSize:'12px', color:'#666', marginBottom:'15px'}}>Sent you a request</p>
                      <button 
                        onClick={() => acceptRequest(user.connection_id, user.id)}
                        style={{ width:'100%', padding: "10px", background: "#15803d", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold" }}
                      >
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}