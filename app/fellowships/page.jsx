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
  const [groupTab, setGroupTab] = useState("feed"); // 'feed' | 'members'

  // Data
  const [allFellowships, setAllFellowships] = useState([]);
  const [myMemberships, setMyMemberships] = useState([]); // Group IDs
  const [groupPosts, setGroupPosts] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  
  // Interactions
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState({});

  // Current User's Role in the Active Group ('admin' | 'member' | null)
  const [myRole, setMyRole] = useState(null);

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
    const { data: groups } = await supabase
      .from('fellowships')
      .select('*')
      .order('created_at', { ascending: false });
    
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
    setGroupTab("feed"); 
    loadGroupData(group.id);
  }

  async function loadGroupData(groupId) {
    // 1. Determine MY Role
    const { data: roleData } = await supabase
      .from('fellowship_members')
      .select('role')
      .match({ fellowship_id: groupId, user_id: user.id })
      .single();
    
    setMyRole(roleData?.role || null);

    // 2. Load Posts
    const { data: posts } = await supabase
      .from('posts')
      .select(`*, profiles(full_name, avatar_url, id), amens(user_id)`)
      .eq('fellowship_id', groupId)
      .order('created_at', { ascending: false });
    
    const formatted = posts?.map(p => ({
      ...p,
      author: p.profiles,
      amenCount: p.amens.length,
      hasAmened: p.amens.some(a => a.user_id === user.id)
    })) || [];
    setGroupPosts(formatted);

    // 3. Load Members
    const { data: mems } = await supabase
      .from('fellowship_members')
      .select('role, user_id, profiles(full_name, avatar_url, username)')
      .eq('fellowship_id', groupId);
    setGroupMembers(mems || []);
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
      await supabase.from('fellowship_members').insert({ fellowship_id: data.id, user_id: user.id, role: 'admin' });
      alert("✅ Fellowship Created!");
      setShowCreate(false);
      loadFellowships(user.id);
    }
  }

  async function handleDeleteFellowship(groupId) {
    if (!confirm("Are you sure? All posts and member data will be lost.")) return;
    const { error } = await supabase.from('fellowships').delete().eq('id', groupId);
    if (error) alert(error.message);
    else {
      setAllFellowships(prev => prev.filter(f => f.id !== groupId));
      setView("discover");
      setActiveGroup(null);
    }
  }

  async function toggleJoin(groupId) {
    const isMember = myMemberships.includes(groupId);
    if (isMember) {
      if(!confirm("Leave this Fellowship?")) return;
      await supabase.from('fellowship_members').delete().match({ fellowship_id: groupId, user_id: user.id });
      setMyMemberships(myMemberships.filter(id => id !== groupId));
      if(activeGroup?.id === groupId) setView("discover");
    } else {
      await supabase.from('fellowship_members').insert({ fellowship_id: groupId, user_id: user.id, role: 'member' });
      setMyMemberships([...myMemberships, groupId]);
      alert("You have joined the Fellowship!");
      if(activeGroup?.id === groupId) loadGroupData(groupId); 
    }
  }

  // --- INTERACTIONS (AMEN / COMMENT) ---
  async function handleAmen(post, currentlyAmened) {
    setGroupPosts(groupPosts.map(p => p.id === post.id ? { ...p, hasAmened: !currentlyAmened, amenCount: currentlyAmened ? p.amenCount - 1 : p.amenCount + 1 } : p));
    if (currentlyAmened) await supabase.from('amens').delete().match({ user_id: user.id, post_id: post.id });
    else await supabase.from('amens').insert({ user_id: user.id, post_id: post.id }); 
  }

  async function toggleComments(postId) {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    } else {
      setActiveCommentPostId(postId);
      if (!comments[postId]) {
        const { data } = await supabase
          .from('comments')
          .select('*, profiles(full_name, avatar_url)')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });
        setComments(prev => ({ ...prev, [postId]: data || [] }));
      }
    }
  }

  async function postComment(postId) {
    if (!newComment.trim()) return;
    const tempComment = { id: Date.now(), post_id: postId, content: newComment, created_at: new Date().toISOString(), profiles: { full_name: 'You', avatar_url: '' } }; // Simplistic optimistic update
    
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), tempComment] }));
    setNewComment("");

    await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content: tempComment.content });
    // Reload to get real profile data
    const { data } = await supabase.from('comments').select('*, profiles(full_name, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true });
    setComments(prev => ({ ...prev, [postId]: data || [] }));
  }

  // --- MODERATION ACTIONS ---
  async function deletePost(postId) {
    if(!confirm("Admin: Delete this post?")) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) {
      setGroupPosts(prev => prev.filter(p => p.id !== postId));
    }
  }

  async function reportPost(postId) {
    const reason = prompt("Why are you reporting this post?");
    if(reason) alert("Report sent to Fellowship Admins.");
  }

  async function promoteMember(targetUserId) {
    if(!confirm("Promote this user to Admin?")) return;
    const { error } = await supabase.from('fellowship_members').update({ role: 'admin' }).match({ fellowship_id: activeGroup.id, user_id: targetUserId });
    if(!error) { loadGroupData(activeGroup.id); alert("User promoted!"); }
  }

  async function kickMember(targetUserId) {
    if(!confirm("Remove this user from the Fellowship?")) return;
    const { error } = await supabase.from('fellowship_members').delete().match({ fellowship_id: activeGroup.id, user_id: targetUserId });
    if(!error) { loadGroupData(activeGroup.id); alert("User removed."); }
  }

  if (!mounted) return null;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px", alignItems:'start' }}>
      
      {/* LEFT SIDEBAR */}
      <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <h2 style={{ margin: "0 0 15px 0", color: "#0b2e4a", fontSize: "18px" }}>👥 Fellowships</h2>
        <button onClick={() => setView("discover")} style={{ width: '100%', padding: '10px', textAlign: 'left', background: view === 'discover' ? '#e8f5e9' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#2e8b57', marginBottom: '5px' }}>🔍 Discover All</button>
        <h3 style={{ fontSize: "14px", color: "#666", marginTop: "20px", marginBottom: "10px" }}>My Fellowships</h3>
        {allFellowships.filter(g => myMemberships.includes(g.id)).map(g => (
          <div key={g.id} onClick={() => openGroup(g)} style={{ padding: '10px', cursor: 'pointer', background: activeGroup?.id === g.id ? '#f0f0f0' : 'transparent', borderRadius: '8px', marginBottom: '5px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{g.name}</div>
          </div>
        ))}
        <button onClick={() => setShowCreate(true)} style={{ width: "100%", padding: "10px", marginTop: "20px", background: "#0b2e4a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>+ Create New</button>
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
                      <button onClick={() => toggleJoin(g.id)} style={{ flex: 1, padding: "8px", background: isMember ? "#fff" : "#2e8b57", color: isMember ? "red" : "white", border: isMember ? "1px solid red" : "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>{isMember ? "Leave" : "Join"}</button>
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
                <div><h1 style={{ margin: "0 0 5px 0", color: "#0b2e4a" }}>{activeGroup.name}</h1><p style={{ color: "#666" }}>{activeGroup.description}</p></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {myMemberships.includes(activeGroup.id) ? (
                    <button onClick={() => toggleJoin(activeGroup.id)} style={{ padding: "8px 20px", background: "white", color: "red", border: "1px solid red", borderRadius: "6px", cursor: "pointer", fontWeight: 'bold' }}>Leave</button>
                  ) : (
                    <button onClick={() => toggleJoin(activeGroup.id)} style={{ padding: "8px 20px", background: "#2e8b57", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>Join</button>
                  )}
                  {user?.id === activeGroup.created_by && <button onClick={() => handleDeleteFellowship(activeGroup.id)} style={{ padding: "8px 20px", background: "#d32f2f", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight:'bold' }}>Delete Group</button>}
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                 <button onClick={() => setGroupTab('feed')} style={{ border: 'none', background: 'none', borderBottom: groupTab === 'feed' ? '2px solid #2e8b57' : 'none', fontWeight: 'bold', color: groupTab === 'feed' ? '#2e8b57' : '#666', cursor: 'pointer', paddingBottom: '5px' }}>Feed</button>
                 <button onClick={() => setGroupTab('members')} style={{ border: 'none', background: 'none', borderBottom: groupTab === 'members' ? '2px solid #2e8b57' : 'none', fontWeight: 'bold', color: groupTab === 'members' ? '#2e8b57' : '#666', cursor: 'pointer', paddingBottom: '5px' }}>Members ({groupMembers.length})</button>
              </div>
            </div>

            {/* --- TAB: FEED --- */}
            {groupTab === 'feed' && (
              myMemberships.includes(activeGroup.id) ? (
                <>
                  <CreatePost user={user} onPostCreated={() => loadGroupData(activeGroup.id)} fellowshipId={activeGroup.id} />
                  
                  {groupPosts.length === 0 ? <p style={{textAlign:'center', padding:20, color:'#666'}}>No posts yet. Be the first!</p> : 
                    groupPosts.map(post => (
                      <div key={post.id} style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #eee" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <img src={post.author?.avatar_url || '/images/default-avatar.png'} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                            <div><div style={{ fontWeight: 'bold', color: '#0b2e4a' }}>{post.author?.full_name}</div><div style={{ fontSize: '12px', color: '#999' }}>{new Date(post.created_at).toLocaleDateString()}</div></div>
                          </div>
                          
                          <div style={{ display:'flex', gap:'10px' }}>
                            {(user.id === post.user_id || myRole === 'admin') && <button onClick={() => deletePost(post.id)} style={{ border:'none', background:'none', color:'red', cursor:'pointer', fontSize:'12px' }}>🗑️ Delete</button>}
                            {user.id !== post.user_id && <button onClick={() => reportPost(post.id)} style={{ border:'none', background:'none', color:'#d4af37', cursor:'pointer', fontSize:'12px' }}>🚩 Report</button>}
                          </div>
                        </div>

                        <p>{post.content}</p>
                        {post.media_url && <img src={post.media_url} style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }} />}

                        {/* FELLOWSHIP INTERACTIONS (AMEN / COMMENT) */}
                        <div style={{ display:'flex', gap:'20px', marginTop:'15px', borderTop:'1px solid #eee', paddingTop:'10px' }}>
                           <button onClick={() => handleAmen(post, post.hasAmened)} style={{background:'none', border:'none', color: post.hasAmened ? '#2e8b57' : '#666', fontWeight: post.hasAmened ? 'bold' : 'normal', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>🙏 Amen ({post.amenCount})</button>
                           <button onClick={() => toggleComments(post.id)} style={{background:'none', border:'none', color:'#666', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>💬 Comment</button>
                        </div>

                        {/* COMMENTS SECTION */}
                        {activeCommentPostId === post.id && (
                           <div style={{marginTop:'15px', background:'#f9f9f9', padding:'10px', borderRadius:'8px'}}>
                             <div style={{maxHeight:'200px', overflowY:'auto', marginBottom:'10px'}}>
                               {comments[post.id]?.length > 0 ? comments[post.id].map(c => (
                                 <div key={c.id} style={{display:'flex', gap:'10px', marginBottom:'8px'}}>
                                   <img src={c.profiles?.avatar_url || '/images/default-avatar.png'} style={{width:25, height:25, borderRadius:'50%'}} />
                                   <div style={{background:'white', padding:'5px 10px', borderRadius:'10px', fontSize:'13px', flex:1}}>
                                     <div style={{fontWeight:'bold', fontSize:'12px'}}>{c.profiles?.full_name}</div>
                                     {c.content}
                                   </div>
                                 </div>
                               )) : <p style={{fontSize:'12px', color:'#999'}}>No comments yet.</p>}
                             </div>
                             <div style={{display:'flex', gap:'10px'}}>
                               <input type="text" placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} style={{flex:1, padding:'8px', borderRadius:'20px', border:'1px solid #ddd', fontSize:'13px'}} onKeyDown={e => e.key === 'Enter' && postComment(post.id)} />
                               <button onClick={() => postComment(post.id)} style={{background:'#0b2e4a', color:'white', border:'none', borderRadius:'50%', width:'35px', height:'35px', cursor:'pointer'}}>➤</button>
                             </div>
                           </div>
                        )}

                      </div>
                    ))
                  }
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px' }}>🔒 <h3>Join to see posts</h3></div>
              )
            )}

            {/* --- TAB: MEMBERS --- */}
            {groupTab === 'members' && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
                {groupMembers.map(m => (
                  <div key={m.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={m.profiles?.avatar_url || '/images/default-avatar.png'} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>{m.profiles?.full_name} {m.role === 'admin' && <span style={{ marginLeft: '5px', fontSize: '10px', background: '#d4af37', color: 'white', padding: '2px 5px', borderRadius: '4px' }}>ADMIN</span>}</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>@{m.profiles?.username}</div>
                      </div>
                    </div>
                    {myRole === 'admin' && m.user_id !== user.id && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {m.role !== 'admin' && <button onClick={() => promoteMember(m.user_id)} style={{ fontSize:'12px', padding: '5px 10px', background: '#e0f2f1', color: '#00695c', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Promote</button>}
                        <button onClick={() => kickMember(m.user_id)} style={{ fontSize:'12px', padding: '5px 10px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                      </div>
                    )}
                  </div>
                ))}
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