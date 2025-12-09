"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import CreatePost from "@/components/CreatePost";
import Link from "next/link";

export default function FellowshipsPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  
  // Views: 'discover' | 'active_group'
  const [view, setView] = useState("discover"); 
  const [activeGroup, setActiveGroup] = useState(null);

  // Data
  const [allFellowships, setAllFellowships] = useState([]);
  const [myMemberships, setMyMemberships] = useState([]); // Group IDs I'm in
  const [groupPosts, setGroupPosts] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      loadFellowships(data.user.id);
    }
  }

  // --- LOADERS ---
  async function loadFellowships(userId) {
    // 1. Get All Groups
    const { data: groups } = await supabase
      .from('fellowships')
      .select('*')
      .order('created_at', { ascending: false });
    
    // 2. Get My Memberships
    const { data: members } = await supabase
      .from('fellowship_members')
      .select('fellowship_id')
      .eq('user_id', userId);
    
    const myIds = members?.map(m => m.fellowship_id) || [];
    
    setAllFellowships(groups || []);
    setMyMemberships(myIds);
  }

  async function openGroup(group) {
    setActiveGroup(group);
    setView("active_group");
    loadGroupData(group.id);
  }

  async function loadGroupData(groupId) {
    // Load Posts
    const { data: posts } = await supabase
      .from('posts')
      .select(`*, profiles(full_name, avatar_url), amens(user_id)`)
      .eq('fellowship_id', groupId)
      .order('created_at', { ascending: false });
    
    const formatted = posts?.map(p => ({
      ...p,
      author: p.profiles,
      amenCount: p.amens.length,
      hasAmened: p.amens.some(a => a.user_id === user.id)
    })) || [];
    setGroupPosts(formatted);

    // Load Members
    const { data: mems } = await supabase
      .from('fellowship_members')
      .select('profiles(full_name, avatar_url, church)')
      .eq('fellowship_id', groupId)
      .limit(10);
    setGroupMembers(mems?.map(m => m.profiles) || []);
  }

  // --- ACTIONS ---
  async function handleCreateGroup(e) {
    e.preventDefault();
    const { data, error } = await supabase.from('fellowships').insert({
      created_by: user.id,
      name: newGroup.name,
      description: newGroup.description
    }).select().single();

    if (error) alert("Error: " + error.message);
    else {
      // Auto-join creator
      await supabase.from('fellowship_members').insert({ fellowship_id: data.id, user_id: user.id, role: 'admin' });
      alert("✅ Fellowship Created!");
      setShowCreate(false);
      loadFellowships(user.id);
    }
  }

  // NEW: Delete Fellowship (Creator Only)
  async function handleDeleteFellowship(groupId) {
    if (!confirm("Are you sure you want to delete this Fellowship? This cannot be undone and all posts will be lost.")) return;

    const { error } = await supabase.from('fellowships').delete().eq('id', groupId);
    
    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      alert("Fellowship deleted.");
      // Refresh local state
      setAllFellowships(prev => prev.filter(f => f.id !== groupId));
      setView("discover");
      setActiveGroup(null);
    }
  }

  async function toggleJoin(groupId) {
    const isMember = myMemberships.includes(groupId);
    if (isMember) {
      // Leave
      if(!confirm("Leave this Fellowship?")) return;
      await supabase.from('fellowship_members').delete().match({ fellowship_id: groupId, user_id: user.id });
      setMyMemberships(myMemberships.filter(id => id !== groupId));
      if(activeGroup?.id === groupId) setView("discover");
    } else {
      // Join
      await supabase.from('fellowship_members').insert({ fellowship_id: groupId, user_id: user.id });
      setMyMemberships([...myMemberships, groupId]);
      alert("You have joined the Fellowship!");
    }
  }

  if (!mounted) return null;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px", alignItems:'start' }}>
      
      {/* LEFT SIDEBAR: MY GROUPS */}
      <div style={{ background: "white", padding: "20px", borderRadius: "12px", height: 'fit-content', boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <h2 style={{ margin: "0 0 15px 0", color: "#0b2e4a", fontSize: "18px" }}>👥 Fellowships</h2>
        
        <button onClick={() => setView("discover")} style={{ width: '100%', padding: '10px', textAlign: 'left', background: view === 'discover' ? '#e8f5e9' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#2e8b57', marginBottom: '5px' }}>
          🔍 Discover All
        </button>

        <h3 style={{ fontSize: "14px", color: "#666", marginTop: "20px", marginBottom: "10px" }}>My Fellowships</h3>
        {allFellowships.filter(g => myMemberships.includes(g.id)).map(g => (
          <div key={g.id} onClick={() => openGroup(g)} style={{ padding: '10px', cursor: 'pointer', background: activeGroup?.id === g.id ? '#f0f0f0' : 'transparent', borderRadius: '8px', marginBottom: '5px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{g.name}</div>
          </div>
        ))}

        <button onClick={() => setShowCreate(true)} style={{ width: "100%", padding: "10px", marginTop: "20px", background: "#0b2e4a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
          + Create New
        </button>
      </div>

      {/* CENTER CONTENT */}
      <div>
        
        {/* VIEW: DISCOVER */}
        {view === "discover" && (
          <div>
            <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "30px", borderRadius: "16px", color: "white", marginBottom: "20px" }}>
              <h1 style={{ margin: 0 }}>Find Your Tribe</h1>
              <p style={{ opacity: 0.9 }}>Join a fellowship to grow together in Christ.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "15px" }}>
              {allFellowships.map(g => {
                const isMember = myMemberships.includes(g.id);
                return (
                  <div key={g.id} style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee" }}>
                    <div style={{width:50, height:50, borderRadius:'8px', background:'#eee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', marginBottom:'10px'}}>🏛️</div>
                    <h3 style={{ margin: "0 0 5px 0", color: "#0b2e4a" }}>{g.name}</h3>
                    <p style={{ fontSize: "13px", color: "#666", height: "40px", overflow: "hidden" }}>{g.description}</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <button onClick={() => openGroup(g)} style={{ flex: 1, padding: "8px", background: "#f0f0f0", border: "none", borderRadius: "6px", cursor: "pointer" }}>View</button>
                      <button onClick={() => toggleJoin(g.id)} style={{ flex: 1, padding: "8px", background: isMember ? "#fff" : "#2e8b57", color: isMember ? "red" : "white", border: isMember ? "1px solid red" : "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                        {isMember ? "Leave" : "Join"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW: ACTIVE GROUP */}
        {view === "active_group" && activeGroup && (
          <div>
            {/* Header */}
            <div style={{ background: "white", padding: "25px", borderRadius: "16px", marginBottom: "20px", borderLeft: "5px solid #2e8b57" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h1 style={{ margin: "0 0 5px 0", color: "#0b2e4a" }}>{activeGroup.name}</h1>
                  <p style={{ color: "#666" }}>{activeGroup.description}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Join/Leave Button */}
                  {myMemberships.includes(activeGroup.id) ? (
                    <button onClick={() => toggleJoin(activeGroup.id)} style={{ padding: "8px 20px", background: "white", color: "red", border: "1px solid red", borderRadius: "6px", cursor: "pointer", fontWeight: 'bold' }}>
                      Leave Fellowship
                    </button>
                  ) : (
                    <button onClick={() => toggleJoin(activeGroup.id)} style={{ padding: "8px 20px", background: "#2e8b57", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                      Join Fellowship
                    </button>
                  )}

                  {/* Creator Delete Button */}
                  {user?.id === activeGroup.created_by && (
                    <button onClick={() => handleDeleteFellowship(activeGroup.id)} style={{ padding: "8px 20px", background: "#d32f2f", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight:'bold' }}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
              
              {/* Members Preview */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                {groupMembers.map((m, i) => (
                  <img key={i} src={m.avatar_url || '/images/default-avatar.png'} style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid white' }} title={m.full_name} />
                ))}
                <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>{groupMembers.length} Members active</span>
              </div>
            </div>

            {/* Content Area */}
            {myMemberships.includes(activeGroup.id) ? (
              <>
                <CreatePost user={user} onPostCreated={() => loadGroupData(activeGroup.id)} fellowshipId={activeGroup.id} />
                
                {groupPosts.length === 0 ? <p style={{textAlign:'center', padding:20, color:'#666'}}>No posts in this fellowship yet.</p> : 
                  groupPosts.map(post => (
                    <div key={post.id} style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #eee" }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <img src={post.author?.avatar_url || '/images/default-avatar.png'} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#0b2e4a' }}>{post.author?.full_name}</div>
                          <div style={{ fontSize: '12px', color: '#999' }}>{new Date(post.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <p>{post.content}</p>
                      {post.media_url && <img src={post.media_url} style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }} />}
                    </div>
                  ))
                }
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px' }}>
                🔒 <h3>Join this Fellowship to see posts and interact.</h3>
              </div>
            )}
          </div>
        )}

      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '400px' }}>
            <h3 style={{ marginTop: 0 }}>Create Fellowship</h3>
            <input type="text" placeholder="Fellowship Name" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
            <textarea placeholder="Description" value={newGroup.description} onChange={e => setNewGroup({...newGroup, description: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateGroup} style={{ padding: '8px 16px', background: '#2e8b57', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Create</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}