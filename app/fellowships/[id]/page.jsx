"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import CreatePost from "@/components/CreatePost";
import Link from "next/link";

export default function FellowshipDetails() {
  const { id } = useParams();
  const router = useRouter();
  
  // Data States
  const [fellowship, setFellowship] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Role States
  const [myRole, setMyRole] = useState(null); // 'admin', 'member', or null
  const [activeTab, setActiveTab] = useState("feed"); // 'feed', 'members', 'about'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPageData();
  }, [id]);

  async function loadPageData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    // 1. Fetch Fellowship Info
    const { data: fsData, error } = await supabase.from('fellowships').select('*').eq('id', id).single();
    if (error) { alert("Fellowship not found"); router.push('/fellowships'); return; }
    setFellowship(fsData);

    // 2. Check My Role
    if (user) {
      const { data: memberData } = await supabase
        .from('fellowship_members')
        .select('role')
        .match({ fellowship_id: id, user_id: user.id })
        .single();
      if (memberData) setMyRole(memberData.role);
    }

    // 3. Fetch Posts (Only for this fellowship)
    fetchPosts();
    
    // 4. Fetch Members
    const { data: mems } = await supabase
      .from('fellowship_members')
      .select('*, profiles(*)')
      .eq('fellowship_id', id);
    setMembers(mems || []);

    setLoading(false);
  }

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(full_name, avatar_url, id)')
      .eq('fellowship_id', id)
      .order('created_at', { ascending: false });
    setPosts(data || []);
  }

  // --- ADMIN ACTIONS ---

  async function handleJoin() {
    await supabase.from('fellowship_members').insert({ fellowship_id: id, user_id: currentUser.id, role: 'member' });
    setMyRole('member');
    loadPageData();
  }

  async function handleLeave() {
    if(!confirm("Leave this fellowship?")) return;
    await supabase.from('fellowship_members').delete().match({ fellowship_id: id, user_id: currentUser.id });
    setMyRole(null);
    loadPageData();
  }

  async function handleDeletePost(postId) {
    if(!confirm("Admin: Delete this post permanently?")) return;
    await supabase.from('posts').delete().eq('id', postId);
    setPosts(posts.filter(p => p.id !== postId));
  }

  async function promoteMember(userId) {
    await supabase.from('fellowship_members').update({ role: 'admin' }).match({ fellowship_id: id, user_id: userId });
    alert("User promoted to Admin.");
    loadPageData();
  }

  async function removeMember(userId) {
    if(!confirm("Remove this user from the fellowship?")) return;
    await supabase.from('fellowship_members').delete().match({ fellowship_id: id, user_id: userId });
    loadPageData();
  }

  async function handleReport(postId) {
    const reason = prompt("Reason for reporting this post:");
    if (!reason) return;
    await supabase.from('reports').insert({ post_id: postId, reporter_id: currentUser.id, reason: reason });
    alert("Report sent to Admins.");
  }

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>Loading Fellowship...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafd", paddingBottom: "40px" }}>
      
      {/* HEADER BANNER */}
      <div style={{ background: "#0b2e4a", color: "white", padding: "40px 20px", textAlign: "center" }}>
        <h1 style={{ margin: 0 }}>{fellowship.name}</h1>
        <p style={{ opacity: 0.8 }}>{fellowship.description || "A community of believers."}</p>
        <div style={{ marginTop: "20px" }}>
          {!myRole ? (
            <button onClick={handleJoin} style={{ padding: "10px 25px", background: "#2e8b57", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>Join Fellowship</button>
          ) : (
            <span style={{ padding: "8px 15px", background: "rgba(255,255,255,0.2)", borderRadius: "20px" }}>
              ✅ You are a {myRole}
            </span>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: "white", borderBottom: "1px solid #eee", padding: "0 20px", display: "flex", justifyContent: "center", gap: "20px" }}>
        {['feed', 'members', 'about'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              padding: "15px", background: "none", border: "none", 
              borderBottom: activeTab === tab ? "3px solid #0b2e4a" : "3px solid transparent",
              fontWeight: "bold", color: activeTab === tab ? "#0b2e4a" : "#888", cursor: "pointer", textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: "800px", margin: "20px auto", padding: "0 20px" }}>
        
        {/* --- FEED TAB --- */}
        {activeTab === 'feed' && (
          <div>
            {/* Create Post (Only if Member) */}
            {myRole && (
              <CreatePost 
                user={currentUser} 
                onPostCreated={fetchPosts} 
                fellowshipId={id}  // <--- Pass ID so it posts HERE, not Global Feed
              />
            )}

            {/* Post List */}
            {posts.map(post => (
              <div key={post.id} style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "15px" }}>
                
                {/* Post Header */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img src={post.profiles?.avatar_url || '/images/default-avatar.png'} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                    <div>
                      <div style={{ fontWeight: "bold", color: "#0b2e4a" }}>{post.profiles?.full_name}</div>
                      <div style={{ fontSize: "12px", color: "#888" }}>{new Date(post.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Actions (Delete for Admin/Owner, Report for others) */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    {/* Delete: Visible if I am Admin OR I wrote the post */}
                    {(myRole === 'admin' || post.user_id === currentUser?.id) && (
                      <button onClick={() => handleDeletePost(post.id)} style={{ border: "none", background: "none", color: "red", cursor: "pointer", fontSize: "12px" }}>🗑️ Delete</button>
                    )}
                    {/* Report: Visible if I did NOT write the post */}
                    {post.user_id !== currentUser?.id && (
                      <button onClick={() => handleReport(post.id)} style={{ border: "none", background: "none", color: "#d4af37", cursor: "pointer", fontSize: "12px" }}>🚩 Report</button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <h4 style={{ margin: "0 0 5px 0" }}>{post.title}</h4>
                <p style={{ margin: 0, color: "#333" }}>{post.content}</p>
                {post.media_url && <img src={post.media_url} style={{ width: "100%", marginTop: "10px", borderRadius: "8px" }} />}
              
              </div>
            ))}
            {posts.length === 0 && <div style={{textAlign:'center', color:'#999'}}>No posts yet. Be the first!</div>}
          </div>
        )}

        {/* --- MEMBERS TAB --- */}
        {activeTab === 'members' && (
          <div style={{ background: "white", borderRadius: "12px", padding: "20px" }}>
            <h3>Members ({members.length})</h3>
            {members.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img src={m.profiles?.avatar_url || '/images/default-avatar.png'} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                  <div>
                    <div style={{ fontWeight: "bold" }}>
                      {m.profiles?.full_name} 
                      {m.role === 'admin' && <span style={{marginLeft:'5px', fontSize:'12px', background:'#e0f2f1', color:'#00695c', padding:'2px 6px', borderRadius:'10px'}}>Admin</span>}
                    </div>
                  </div>
                </div>

                {/* Admin Controls (Only if I am Admin AND not acting on myself) */}
                {myRole === 'admin' && m.user_id !== currentUser.id && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    {m.role !== 'admin' && (
                      <button onClick={() => promoteMember(m.user_id)} style={{ fontSize: "12px", padding: "5px 10px", background: "#f0f0f0", border: "none", borderRadius: "5px", cursor: "pointer" }}>Make Admin</button>
                    )}
                    <button onClick={() => removeMember(m.user_id)} style={{ fontSize: "12px", padding: "5px 10px", background: "#ffebee", color: "red", border: "none", borderRadius: "5px", cursor: "pointer" }}>Remove</button>
                  </div>
                )}
              </div>
            ))}
            
            {myRole && (
              <button onClick={handleLeave} style={{ marginTop: "20px", width: "100%", padding: "10px", background: "#fff1f0", color: "red", border: "1px solid red", borderRadius: "8px", cursor: "pointer" }}>
                Leave Fellowship
              </button>
            )}
          </div>
        )}

        {/* --- ABOUT TAB --- */}
        {activeTab === 'about' && (
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", lineHeight: "1.6" }}>
            <h3>About {fellowship.name}</h3>
            <p>{fellowship.description || "No description provided."}</p>
            <p style={{ marginTop: "20px", color: "#666", fontSize: "14px" }}>Created on: {new Date(fellowship.created_at).toLocaleDateString()}</p>
          </div>
        )}

      </div>
    </div>
  );
}