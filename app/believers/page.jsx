"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function BelieversPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("seek"); // 'seek' or 'requests'
  const [believers, setBelievers] = useState([]);
  const [requests, setRequests] = useState([]);
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
      loadBelievers(data.user.id);
      loadRequests(data.user.id);
    }
  }

  // TAB 1: Find People
  async function loadBelievers(userId) {
    setLoading(true);
    // Fetch profiles that are NOT me
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId || '')
      .limit(50);
    
    if (data) setBelievers(data);
    setLoading(false);
  }

  // TAB 2: Load Incoming Requests
  async function loadRequests(userId) {
    // I am user_b (receiver), status is pending
    const { data: reqs } = await supabase
      .from('connections')
      .select('*, profiles:user_a(*)') // Fetch sender profile
      .eq('user_b', userId)
      .eq('status', 'pending');
    
    if (reqs) setRequests(reqs);
  }

  async function handleSearch() {
    setLoading(true);
    const query = supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.id);

    if (searchQuery.trim()) {
      query.ilike('full_name', `%${searchQuery}%`);
    } else {
      query.limit(50);
    }

    const { data } = await query;
    if (data) setBelievers(data);
    setLoading(false);
  }

  // Action: Send Request
  async function handleConnect(targetUserId) {
    if (!user) return;
    
    // Check if exists
    const { data: existing } = await supabase.from('connections').select('*')
      .or(`and(user_a.eq.${user.id},user_b.eq.${targetUserId}),and(user_a.eq.${targetUserId},user_b.eq.${user.id})`);
    
    if (existing && existing.length > 0) {
      const status = existing[0].status;
      if (status === 'connected') alert("Already connected!");
      else if (status === 'pending') alert("Request already pending!");
      return;
    }

    // Insert PENDING request
    const { error } = await supabase.from('connections').insert({
      user_a: user.id,
      user_b: targetUserId,
      status: 'pending' 
    });
    
    if (error) alert("Error: " + error.message);
    else alert("✅ Request Sent! Waiting for them to accept.");
  }

  // Action: Accept Request
  async function handleAccept(connectionId) {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'connected' })
      .eq('id', connectionId);

    if (!error) {
      alert("✅ Connected!");
      loadRequests(user.id); // Refresh
    }
  }

  if (!mounted) return null;

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "30px", borderRadius: "16px", color: "white", marginBottom: "30px" }}>
        <h1 style={{ margin: 0 }}>🤝 Believers</h1>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button onClick={() => setActiveTab("seek")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: activeTab === "seek" ? "#0b2e4a" : "white", color: activeTab === "seek" ? "white" : "#333", fontWeight: "bold", cursor:'pointer' }}>🔍 Seek</button>
        <button onClick={() => setActiveTab("requests")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: activeTab === "requests" ? "#0b2e4a" : "white", color: activeTab === "requests" ? "white" : "#333", fontWeight: "bold", cursor:'pointer' }}>📩 Requests ({requests.length})</button>
      </div>

      {activeTab === "seek" ? (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <input type="text" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} style={{ flex: 1, padding: "15px", borderRadius: "12px", border: "1px solid #ddd", fontSize: "16px" }} />
            <button onClick={handleSearch} style={{ padding: "0 25px", background: "#0b2e4a", color: "white", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "bold" }}>Seek</button>
          </div>

          {loading ? <p>Loading...</p> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
              {believers.map(b => (
                <div key={b.id} style={{ background: "white", padding: "20px", borderRadius: "12px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  {b.avatar_url ? <img src={b.avatar_url} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px auto" }} /> : <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#e8f5e9", color: "#2e8b57", fontSize: "30px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px auto" }}>{b.full_name?.[0]}</div>}
                  <h3 style={{ fontSize: "16px", margin: "0 0 5px 0", color: "#0b2e4a" }}>{b.full_name}</h3>
                  <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                    <button onClick={() => handleConnect(b.id)} style={{ padding: "8px", background: "#2e8b57", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>➕ Request</button>
                    <Link href={`/chat?uid=${b.id}`} style={{ padding: "8px", background: "#f0f0f0", color: "#333", borderRadius: "6px", textDecoration:'none', fontSize:'13px', fontWeight:'bold' }}>💬 Message</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // REQUESTS TAB
        <div>
          {requests.length === 0 ? <p style={{textAlign:'center', color:'#666'}}>No pending requests.</p> : (
            <div style={{ display: "grid", gap: "15px" }}>
              {requests.map(req => (
                <div key={req.id} style={{ background: "white", padding: "15px", borderRadius: "12px", display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#ccc", display:'flex', alignItems:'center', justifyContent:'center' }}>{req.profiles?.full_name?.[0]}</div>
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