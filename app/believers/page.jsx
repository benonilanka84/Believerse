"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function BelieversContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'requests' ? 'requests' : 'connected'); 
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]); 
  const [relationshipMap, setRelationshipMap] = useState({}); 

  useEffect(() => { loadInitialData(); }, []);

  // Fix redirection: Sync tab with URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'requests' || tab === 'connected') setActiveTab(tab);
  }, [searchParams]);

  async function loadInitialData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    setCurrentUser(user);
    await fetchMyNetwork(user.id);
    setLoading(false);
  }

  async function fetchMyNetwork(userId) {
    // Fetch all requests involving the user
    const { data: reqs, error } = await supabase
      .from('connection_requests')
      .select(`
        *,
        sender:sender_id(id, full_name, avatar_url, username),
        receiver:receiver_id(id, full_name, avatar_url, username)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) console.error("Fetch Error:", error);

    const relMap = {};
    const connectedList = [];
    const incomingRequests = [];

    if (reqs) {
      reqs.forEach(r => {
        const isIWasSender = r.sender_id === userId;
        const otherProfile = isIWasSender ? r.receiver : r.sender;
        const otherId = otherProfile?.id;

        if (!otherId) return;

        if (r.status === 'accepted') {
          relMap[otherId] = 'connected';
          connectedList.push(otherProfile);
        } else if (r.status === 'pending') {
          if (isIWasSender) {
            relMap[otherId] = 'sent';
          } else {
            relMap[otherId] = 'received';
            incomingRequests.push({ ...otherProfile, connection_id: r.id });
          }
        }
      });
    }

    setRelationshipMap(relMap);
    setConnectedUsers(connectedList);
    setPendingRequests(incomingRequests);
  }

  async function acceptRequest(requestId) {
    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (!error) {
      alert("Connected!");
      await fetchMyNetwork(currentUser.id); // Refresh counts immediately
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#bfdbfe", paddingBottom: "40px" }}>
      <div style={{ background: "#15803d", padding: "30px 20px", color: "white", marginBottom: "30px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ fontSize: "2.5rem" }}>🤝</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>Believers</h1>
            <p style={{ margin: 0, fontSize: "1rem", opacity: 0.9 }}>Connecting the Body of Christ</p>
          </div>
          <Link href="/dashboard" style={{ marginLeft: "auto", color: "white", fontSize: "14px", textDecoration: "none", background: "rgba(0,0,0,0.2)", padding: "8px 15px", borderRadius: "20px", fontWeight: "bold" }}>⬅ Dashboard</Link>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px" }}>
        {/* TABS HEADER */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button onClick={() => setActiveTab('connected')} style={{ flex: 1, padding: "15px", fontWeight: "bold", border: "none", cursor: "pointer", borderRadius: "10px", background: activeTab === 'connected' ? "white" : "rgba(255,255,255,0.5)", color: activeTab === 'connected' ? "#15803d" : "#64748b" }}>
            Connected ({connectedUsers.length})
          </button>
          <button onClick={() => setActiveTab('requests')} style={{ flex: 1, padding: "15px", fontWeight: "bold", border: "none", cursor: "pointer", borderRadius: "10px", background: activeTab === 'requests' ? "white" : "rgba(255,255,255,0.5)", color: activeTab === 'requests' ? "#15803d" : "#64748b" }}>
            Requests ({pendingRequests.length})
          </button>
        </div>

        <div style={{ background: "white", padding: "20px", borderRadius: "16px", minHeight: "300px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          {activeTab === 'connected' ? (
            connectedUsers.length === 0 ? <div style={{textAlign:'center', padding:'40px', color:'#888'}}><p>No connections yet.</p></div> :
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "15px" }}>
              {connectedUsers.map(user => (
                <div key={user.id} style={{ padding: "15px", borderRadius: "12px", border: "1px solid #eee", display:'flex', alignItems:'center', gap:'15px', background:'#f8fafd' }}>
                  <img src={user.avatar_url || '/images/default-avatar.png'} style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit:"cover" }} />
                  <div><div style={{ fontWeight: "bold", color: "#0b2e4a" }}>{user.full_name}</div><Link href={`/profile/${user.id}`} style={{ fontSize: "12px", color: "#15803d", textDecoration:'none', fontWeight:'bold' }}>View Profile</Link></div>
                </div>
              ))}
            </div>
          ) : (
            pendingRequests.length === 0 ? <div style={{textAlign:'center', padding:'40px', color:'#888'}}><p>No pending requests.</p></div> :
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
              {pendingRequests.map(user => (
                <div key={user.id} style={{ padding: "20px", borderRadius: "12px", border: "1px solid #eee", textAlign: "center", background:'#f8fafd' }}>
                  <img src={user.avatar_url || '/images/default-avatar.png'} style={{ width: "60px", height: "60px", borderRadius: "50%", margin:'0 auto 10px auto', objectFit:"cover" }} />
                  <div style={{ fontWeight: "bold", color: "#0b2e4a" }}>{user.full_name}</div>
                  <button onClick={() => acceptRequest(user.connection_id)} style={{ width:'100%', marginTop:'10px', padding: "10px", background: "#15803d", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold" }}>Accept</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BelieversPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BelieversContent />
    </Suspense>
  );
}