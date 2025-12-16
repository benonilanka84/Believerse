"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function BelieversPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    
    // 1. Get Current User ID
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    // 2. Fetch Profiles (Default: Latest 50 members)
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // 3. Exclude System Admin & Current User (Safety Filters)
    if (user) {
      query = query.neq('id', user.id);
    }
    query = query.neq('username', 'admin');
    // Add any other specific exclusions here if needed

    const { data, error } = await query;
    if (error) console.error("Error fetching believers:", error);
    else setUsers(data || []);
    
    setLoading(false);
  }

  // --- FILTER LOGIC (Client Side for speed) ---
  const filteredUsers = users.filter(u => {
    const term = search.toLowerCase();
    const nameMatch = u.full_name?.toLowerCase().includes(term);
    const usernameMatch = u.username?.toLowerCase().includes(term);
    return nameMatch || usernameMatch;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafd", padding: "20px" }}>
      
      {/* HEADER SECTION */}
      <div style={{ maxWidth: "800px", margin: "0 auto 30px auto" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#666", display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px', fontSize: '14px' }}>
          ⬅ Back to Dashboard
        </Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ color: "#0b2e4a", fontSize: "2rem", margin: "0 0 5px 0" }}>Believers</h1>
            <p style={{ color: "#666", margin: 0 }}>Discover the growing family of Christ.</p>
          </div>
          
          {/* SEARCH BAR */}
          <input 
            type="text" 
            placeholder="🔍 Find a friend..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              padding: "12px 20px", borderRadius: "30px", border: "1px solid #ddd", 
              width: "250px", outline: "none", boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
            }}
          />
        </div>
      </div>

      {/* BELIEVERS GRID */}
      <div style={{ 
        maxWidth: "800px", margin: "0 auto", 
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" 
      }}>
        
        {loading ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#999", padding: "40px" }}>Loading community...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#999", padding: "40px" }}>
            No believers found matching "{search}".
          </div>
        ) : (
          filteredUsers.map(profile => (
            <Link key={profile.id} href={`/profile/${profile.id}`} style={{ textDecoration: "none" }}>
              <div style={{ 
                background: "white", borderRadius: "16px", padding: "20px", 
                textAlign: "center", border: "1px solid #eee", transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.02)"
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.02)"; }}
              >
                {/* Avatar */}
                <img 
                  src={profile.avatar_url || '/images/default-avatar.png'} 
                  style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", marginBottom: "10px", border: "3px solid #f8fafd" }} 
                />
                
                {/* Name & Badge */}
                <h3 style={{ margin: "0 0 5px 0", color: "#0b2e4a", fontSize: "1.1rem", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  {profile.full_name}
                  {profile.subscription_plan?.toLowerCase().includes('platinum') && <span title="Platinum Partner" style={{fontSize:'14px'}}>💎</span>}
                  {profile.subscription_plan?.toLowerCase().includes('gold') && <span title="Gold Supporter" style={{fontSize:'14px'}}>🥇</span>}
                </h3>
                
                {/* Username */}
                <p style={{ color: "#999", fontSize: "0.9rem", margin: "0 0 15px 0" }}>@{profile.username || "believer"}</p>
                
                {/* Connect Button (Visual Only) */}
                <button style={{ 
                  width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #eee", 
                  background: "transparent", color: "#0b2e4a", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer" 
                }}>
                  View Profile
                </button>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}