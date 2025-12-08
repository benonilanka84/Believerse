"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function BelieversPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [believers, setBelievers] = useState([]);
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
      loadBelievers();
    }
  }

  async function loadBelievers() {
    setLoading(true);
    // Fetch all profiles except mine
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.id || '')
      .limit(50);
    
    if (data) setBelievers(data);
    setLoading(false);
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      loadBelievers();
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.id)
      .ilike('full_name', `%${searchQuery}%`);
    
    if (data) setBelievers(data);
    setLoading(false);
  }

  async function handleConnect(targetUserId) {
    if (!user) return;
    
    // Check if already connected/requested
    const { data: existing } = await supabase.from('connections').select('*').or(`and(user_a.eq.${user.id},user_b.eq.${targetUserId}),and(user_a.eq.${targetUserId},user_b.eq.${user.id})`);
    
    if (existing && existing.length > 0) {
      alert("Already connected or request pending!");
      return;
    }

    const { error } = await supabase.from('connections').insert({
      user_a: user.id,
      user_b: targetUserId,
      status: 'connected' // Auto-connect for now (simpler for beta)
    });
    
    if (error) alert("Error: " + error.message);
    else alert("✅ Connected! You can now invite them to events.");
  }

  if (!mounted) return null;

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "30px", borderRadius: "16px", color: "white", marginBottom: "30px" }}>
        <h1 style={{ margin: 0 }}>🤝 Believers</h1>
        <p style={{ opacity: 0.9 }}>Connect with the family of God</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Search by name..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ flex: 1, padding: "15px", borderRadius: "12px", border: "1px solid #ddd", fontSize: "16px" }}
        />
        <button onClick={handleSearch} style={{ padding: "0 25px", background: "#0b2e4a", color: "white", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
          🔍 Seek
        </button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
          {believers.map(b => (
            <div key={b.id} style={{ background: "white", padding: "20px", borderRadius: "12px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              {b.avatar_url ? (
                <img src={b.avatar_url} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px auto" }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#e8f5e9", color: "#2e8b57", fontSize: "30px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px auto" }}>
                  {b.full_name?.[0] || "B"}
                </div>
              )}
              
              <h3 style={{ fontSize: "16px", margin: "0 0 5px 0", color: "#0b2e4a" }}>{b.full_name}</h3>
              <p style={{ fontSize: "12px", color: "#666", marginBottom: "15px" }}>{b.church || "Believer"}</p>
              
              <button onClick={() => handleConnect(b.id)} style={{ width:'100%', padding: "8px", background: "#2e8b57", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>
                ➕ Connect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}