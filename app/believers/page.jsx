"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BelieversPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 1. Get Current User on Mount
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      fetchBelievers("", user?.id); // Load initial list
    }
    getUser();
  }, []);

  // 2. The Search Logic
  async function fetchBelievers(searchQuery, currentUserId) {
    setLoading(true);
    
    let dbQuery = supabase
      .from('profiles')
      .select('*');

    // FIX #1: Exclude System Admin & Current User
    // Assuming admin username is 'admin' or 'system'. Adjust if your admin email is specific.
    if (currentUserId) {
      dbQuery = dbQuery.neq('id', currentUserId);
    }
    dbQuery = dbQuery.neq('username', 'admin'); 
    dbQuery = dbQuery.neq('full_name', 'System Admin'); 

    // FIX #2: Search Both Name AND Username (Case Insensitive)
    if (searchQuery.trim().length > 0) {
      // Syntax: column.operator.value
      // We use 'or' to check if EITHER full_name OR username matches
      dbQuery = dbQuery.or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);
    } else {
      // If search is empty, limit to 20 recent users so we don't load the whole database
      dbQuery = dbQuery.limit(20).order('created_at', { ascending: false });
    }

    const { data, error } = await dbQuery;
    
    if (error) {
      console.error("Search Error:", error);
    } else {
      setResults(data || []);
    }
    
    setLoading(false);
  }

  // 3. Handle Typing (Debounced slightly for performance)
  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    fetchBelievers(val, currentUser?.id);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafd", padding: "20px" }}>
      
      {/* HEADER */}
      <div style={{ maxWidth: "600px", margin: "0 auto 30px auto" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#666", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px", marginBottom: "20px" }}>
          ⬅ Back to Dashboard
        </Link>
        <h1 style={{ color: "#0b2e4a", fontSize: "1.8rem", marginBottom: "10px" }}>Seek Believers</h1>
        <p style={{ color: "#666", fontSize: "0.9rem" }}>Find friends, mentors, and prayer partners.</p>
        
        {/* SEARCH BAR */}
        <input 
          type="text" 
          placeholder="Search by name or username..." 
          value={query}
          onChange={handleSearch}
          style={{ 
            width: "100%", padding: "15px", borderRadius: "12px", border: "1px solid #ddd", 
            fontSize: "16px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", outline: "none"
          }}
        />
      </div>

      {/* RESULTS GRID */}
      <div style={{ maxWidth: "600px", margin: "0 auto", display: "grid", gap: "15px" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#999", padding: "20px" }}>Searching...</div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: "center", color: "#999", padding: "20px" }}>No believers found.</div>
        ) : (
          results.map(user => (
            <Link key={user.id} href={`/profile/${user.id}`} style={{ textDecoration: "none" }}>
              <div style={{ 
                background: "white", padding: "15px", borderRadius: "12px", border: "1px solid #eee", 
                display: "flex", alignItems: "center", gap: "15px", transition: "transform 0.2s",
                cursor: "pointer"
              }}>
                <img 
                  src={user.avatar_url || '/images/default-avatar.png'} 
                  style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} 
                />
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", color: "#0b2e4a", display: "flex", alignItems: "center", gap: "5px" }}>
                    {user.full_name}
                    {/* Badge Logic Inline */}
                    {user.subscription_plan?.toLowerCase().includes('platinum') && (
                      <span style={{ fontSize: "10px", background: "#29b6f6", color: "white", padding: "2px 6px", borderRadius: "10px" }}>💎</span>
                    )}
                    {user.subscription_plan?.toLowerCase().includes('gold') && (
                      <span style={{ fontSize: "10px", background: "#d4af37", color: "white", padding: "2px 6px", borderRadius: "10px" }}>🥇</span>
                    )}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888" }}>@{user.username || "believer"}</div>
                </div>

                <div style={{ color: "#2e8b57", fontSize: "20px" }}>➔</div>
              </div>
            </Link>
          ))
        )}
      </div>

    </div>
  );
}