"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState({ users: 0, posts: 0, prayers: 0 });
  const [users, setUsers] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const router = useRouter();

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/"); return; }

    // Security Check: Is this user actually an admin?
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      alert("⛔ Access Denied. You are not an Admin.");
      router.push("/dashboard");
      return;
    }

    setAuthorized(true);
    loadData();
  }

  async function loadData() {
    setLoading(true);
    
    // 1. Stats
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
    const { count: prayerCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('type', 'Prayer');
    
    setStats({ users: userCount || 0, posts: postCount || 0, prayers: prayerCount || 0 });

    // 2. Users
    const { data: userData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
    setUsers(userData || []);

    // 3. Posts
    const { data: postData } = await supabase.from('posts').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(20);
    setRecentPosts(postData || []);

    setLoading(false);
  }

  // --- ADMIN ACTIONS ---
  async function forceDeletePost(postId) {
    if(!confirm("⚠️ ADMIN: Permanently delete this content?")) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) {
        setRecentPosts(prev => prev.filter(p => p.id !== postId));
        alert("Content wiped.");
    } else {
        alert("Error: " + error.message);
    }
  }

  async function banUser(userId) {
    // Ideally we'd have a 'status' column. For now, we can perhaps wipe their bio as a warning or implement a real block list table later.
    // This is a placeholder for the ban logic.
    if(!confirm("⚠️ Ban functionality requires a 'status' column in DB. Proceed to log ID?")) return;
    console.log("Ban User ID:", userId);
    alert("User ID copied to console. Update 'status' to 'banned' in SQL.");
  }

  if (!authorized) return <div style={{padding:50, textAlign:'center', color:'#666'}}>🔒 Verifying Admin Access...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', minHeight: '100vh', background: '#f4f6f8' }}>
      
      {/* SIDEBAR */}
      <div style={{ background: '#1a202c', color: 'white', padding: '20px' }}>
        <div style={{ marginBottom:'30px', paddingBottom:'20px', borderBottom:'1px solid #333' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>🛡️ Command Center</h2>
          <p style={{ margin: '5px 0 0 0', fontSize:'12px', color:'#888' }}>admin@thebelieverse.com</p>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button onClick={() => setActiveTab('overview')} style={{ textAlign: 'left', padding: '12px', background: activeTab==='overview' ? '#2d3748' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight:'500' }}>📊 Overview</button>
          <button onClick={() => setActiveTab('users')} style={{ textAlign: 'left', padding: '12px', background: activeTab==='users' ? '#2d3748' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight:'500' }}>👥 User Management</button>
          <button onClick={() => setActiveTab('posts')} style={{ textAlign: 'left', padding: '12px', background: activeTab==='posts' ? '#2d3748' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight:'500' }}>📝 Content Moderation</button>
        </nav>

        <button onClick={() => router.push("/dashboard")} style={{ marginTop:'auto', textAlign: 'left', padding: '12px', background: 'transparent', color: '#fc8181', border: 'none', cursor: 'pointer', fontWeight:'bold', fontSize:'13px', position:'absolute', bottom:'20px' }}>⬅️ Exit to App</button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ padding: '40px', overflowY:'auto', maxHeight:'100vh' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <h1 style={{ margin:'0 0 20px 0', color:'#2d3748' }}>Dashboard Overview</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '13px', color: '#718096', fontWeight:'600', textTransform:'uppercase' }}>Total Believers</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2b6cb0', marginTop:'5px' }}>{stats.users}</div>
              </div>
              <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '13px', color: '#718096', fontWeight:'600', textTransform:'uppercase' }}>Total Content</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2f855a', marginTop:'5px' }}>{stats.posts}</div>
              </div>
              <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '13px', color: '#718096', fontWeight:'600', textTransform:'uppercase' }}>Prayer Requests</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#d69e2e', marginTop:'5px' }}>{stats.prayers}</div>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <h1 style={{ margin:'0 0 20px 0', color:'#2d3748' }}>User Database</h1>
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f7fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize:'12px', color:'#4a5568', textTransform:'uppercase' }}>User</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize:'12px', color:'#4a5568', textTransform:'uppercase' }}>Details</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize:'12px', color:'#4a5568', textTransform:'uppercase' }}>Role</th>
                    <th style={{ padding: '15px', textAlign: 'right', fontSize:'12px', color:'#4a5568', textTransform:'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '15px', display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{width:'32px', height:'32px', borderRadius:'50%', background:'#cbd5e0', overflow:'hidden'}}>
                           {u.avatar_url && <img src={u.avatar_url} style={{width:'100%', height:'100%'}} />}
                        </div>
                        <div>
                          <div style={{fontWeight:'bold', color:'#2d3748'}}>{u.full_name}</div>
                          <div style={{fontSize:'12px', color:'#718096'}}>{u.email}</div>
                        </div>
                      </td>
                      <td style={{ padding: '15px', color:'#4a5568', fontSize:'14px' }}>
                        {u.church ? `Church: ${u.church}` : 'No Church Listed'}
                        <div style={{fontSize:'12px', color:'#a0aec0'}}>Joined: {new Date(u.created_at).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'bold', background: u.role==='admin'?'#2b6cb0':'#c6f6d5', color: u.role==='admin'?'white':'#22543d' }}>
                          {u.role || 'MEMBER'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        <button onClick={() => banUser(u.id)} style={{ padding: '6px 12px', border: '1px solid #feb2b2', background: 'transparent', color: '#c53030', borderRadius: '6px', cursor: 'pointer', fontSize:'12px', fontWeight:'bold' }}>Ban User</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          <div>
            <h1 style={{ margin:'0 0 20px 0', color:'#2d3748' }}>Content Moderation</h1>
            <div style={{ display: 'grid', gap: '15px' }}>
              {recentPosts.map(p => (
                <div key={p.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: `4px solid ${p.type === 'Glimpse' ? '#805ad5' : '#38a169'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'white', background: p.type === 'Glimpse' ? '#805ad5' : '#38a169', padding:'2px 8px', borderRadius:'4px' }}>{p.type.toUpperCase()}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>{p.profiles?.full_name}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#a0aec0' }}>{new Date(p.created_at).toLocaleString()}</span>
                  </div>
                  
                  <div style={{ marginBottom: '15px', color: '#4a5568', fontSize:'14px', lineHeight:'1.5' }}>
                    {p.content || <span style={{fontStyle:'italic', color:'#a0aec0'}}>No text content (Media only)</span>}
                  </div>
                  
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    {p.media_url ? (
                      <a href={p.media_url} target="_blank" style={{ fontSize: '13px', color: '#3182ce', textDecoration:'none', fontWeight:'500' }}>📎 View Attached Media</a>
                    ) : <span></span>}
                    
                    <button onClick={() => forceDeletePost(p.id)} style={{ padding: '8px 16px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight:'bold' }}>
                      🗑️ Force Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}