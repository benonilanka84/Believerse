"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [coverUploading, setCoverUploading] = useState(false);

  // --- CONNECTION STATES ---
  const [connectionStatus, setConnectionStatus] = useState('none'); // 'none', 'pending_sent', 'pending_received', 'connected'
  const [connectionCount, setConnectionCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadProfileData() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    // 1. Fetch Profile
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !profileData) {
      alert("User not found");
      router.push("/dashboard");
      return;
    }
    setProfile(profileData);

    // 2. Fetch Posts
    const { data: postData } = await supabase
      .from('posts')
      .select('*, amens(count)')
      .eq('user_id', id)
      .order('created_at', { ascending: false });
    
    if (postData) setPosts(postData);

    // 3. --- CHECK MUTUAL CONNECTION STATUS ---
    if (user && user.id !== id) {
      const { data: request } = await supabase
        .from('connection_requests')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`)
        .single();

      if (request) {
        if (request.status === 'accepted') setConnectionStatus('connected');
        else if (request.sender_id === user.id) setConnectionStatus('pending_sent');
        else setConnectionStatus('pending_received');
      } else {
        setConnectionStatus('none');
      }
    }

    // 4. --- FETCH ACCEPTED CONNECTION COUNT ---
    const { count } = await supabase
      .from('connection_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`sender_id.eq.${id},receiver_id.eq.${id}`);
    
    setConnectionCount(count || 0);

    setLoading(false);
  }

  useEffect(() => {
    loadProfileData();
  }, [id]);

  // --- HANDLE MUTUAL CONNECTION LOGIC ---
  async function handleConnectionToggle() {
    if (!currentUser) return alert("Please log in to connect.");
    setActionLoading(true);

    try {
      if (connectionStatus === 'none') {
        // Step 1: Send Request
        const { error } = await supabase
          .from('connection_requests')
          .insert({ sender_id: currentUser.id, receiver_id: id });

        if (error) throw error;
        alert("A request has been sent!");
        setConnectionStatus('pending_sent');
      } 
      else if (connectionStatus === 'pending_received') {
        // Step 2: Accept incoming request
        const { error } = await supabase
          .from('connection_requests')
          .update({ status: 'accepted' })
          .match({ sender_id: id, receiver_id: currentUser.id });

        if (error) throw error;
        setConnectionStatus('connected');
        setConnectionCount(prev => prev + 1);
      } 
      else {
        // Step 3: Disconnect or Cancel sent request
        const { error } = await supabase
          .from('connection_requests')
          .delete()
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${currentUser.id})`);

        if (error) throw error;
        if (connectionStatus === 'connected') setConnectionCount(prev => Math.max(0, prev - 1));
        setConnectionStatus('none');
      }
    } catch (err) {
      console.error(err);
      alert("Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCoverUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setCoverUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      alert("Cover photo updated successfully!");
      loadProfileData();

    } catch (error) {
      console.error(error);
      alert("Error uploading cover photo: " + error.message);
    } finally {
      setCoverUploading(false);
    }
  }

  const getBadgeUI = () => {
    if (!profile || !profile.subscription_plan) return null;
    const plan = profile.subscription_plan.trim().toLowerCase();
    
    if (plan.includes('platinum')) {
      return <span style={{ background: "linear-gradient(45deg, #29b6f6, #0288d1)", color: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px", marginLeft: "8px" }}>💎 Platinum Partner</span>;
    }
    if (plan.includes('gold')) {
      return <span style={{ background: "linear-gradient(45deg, #d4af37, #f9d976)", color: "#0b2e4a", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px", marginLeft: "8px" }}>🥇 Gold Supporter</span>;
    }
    return null;
  };

  const filteredPosts = posts.filter(p => {
    if (activeTab === 'glimpses') return p.type === 'Glimpse';
    if (activeTab === 'prayers') return p.type === 'Prayer';
    return p.type !== 'Glimpse';
  });

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Profile...</div>;

  const isOwner = currentUser && currentUser.id === profile.id;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafd", paddingBottom: "40px" }}>
      
      {/* HEADER / COVER PHOTO - KEPT INTACT */}
      <div style={{ 
        height: "400px", 
        background: profile.cover_url ? `url(${profile.cover_url}) center/cover` : "linear-gradient(135deg, #0b2e4a, #2e8b57)",
        position: "relative"
      }}>
        {/* KEPT: Back to Dashboard Button */}
        <Link href="/dashboard" style={{ position: "absolute", top: "20px", left: "20px", background: "rgba(0,0,0,0.5)", color: "white", padding: "8px 16px", borderRadius: "20px", textDecoration: "none", fontSize: "14px", zIndex: 10 }}>
          ⬅ Back to Dashboard
        </Link>

        {/* KEPT: Update Cover Button */}
        {isOwner && (
          <label style={{ 
            position: "absolute", 
            top: "20px", 
            right: "20px", 
            background: "rgba(0,0,0,0.5)", 
            color: "white", 
            padding: "8px 16px", 
            borderRadius: "20px", 
            cursor: coverUploading ? "not-allowed" : "pointer", 
            fontSize: "14px", 
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "5px"
          }}>
            <span style={{fontSize: '16px'}}>📷</span> 
            {coverUploading ? "Uploading..." : "Update Cover"}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleCoverUpload} 
              disabled={coverUploading}
              style={{ display: "none" }}
            />
          </label>
        )}
      </div>

      {/* PROFILE INFO CARD */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px", position: "relative", marginTop: "-60px" }}>
        <div style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", textAlign: "center" }}>
          
          <div style={{ marginTop: "-80px", marginBottom: "15px" }}>
            <img src={profile.avatar_url || '/images/default-avatar.png'} style={{ width: "120px", height: "120px", borderRadius: "50%", border: "4px solid white", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", objectFit: "cover", background: "white" }} />
          </div>

          <h1 style={{ margin: "0 0 5px 0", fontSize: "1.8rem", color: "#0b2e4a", display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
            {profile.full_name}
            {getBadgeUI()}
          </h1>
          <p style={{ color: "#666", fontSize: "0.95rem", margin: "0 0 20px 0" }}>@{profile.username || "believer"}</p>

          {profile.bio && <p style={{ color: "#333", fontStyle: "italic", marginBottom: "20px" }}>"{profile.bio}"</p>}

          <div style={{ display: "flex", justifyContent: "center", gap: "30px", marginBottom: "25px", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", padding: "15px 0" }}>
            <div><div style={{ fontWeight: "800", fontSize: "1.2rem", color: "#0b2e4a" }}>{posts.filter(p => p.type !== 'Glimpse').length}</div><div style={{ fontSize: "12px", color: "#888" }}>Posts</div></div>
            <div><div style={{ fontWeight: "800", fontSize: "1.2rem", color: "#0b2e4a" }}>{posts.filter(p => p.type === 'Glimpse').length}</div><div style={{ fontSize: "12px", color: "#888" }}>Glimpses</div></div>
            <div><div style={{ fontWeight: "800", fontSize: "1.2rem", color: "#0b2e4a" }}>{connectionCount}</div><div style={{ fontSize: "12px", color: "#888" }}>Connections</div></div>
          </div>

          {!isOwner && (
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              {/* UPDATED: Mutual Connection Button */}
              <button 
                onClick={handleConnectionToggle}
                disabled={actionLoading}
                style={{ 
                  padding: "10px 20px", 
                  background: connectionStatus === 'connected' ? "#ff4d4d" : 
                              connectionStatus === 'pending_sent' ? "#ffc107" : 
                              connectionStatus === 'pending_received' ? "#29b6f6" : "#2e8b57", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "8px", 
                  fontWeight: "bold", 
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  transition: "background 0.3s"
                }}
              >
                {actionLoading ? "Wait..." : 
                 connectionStatus === 'connected' ? "Disconnect" : 
                 connectionStatus === 'pending_sent' ? "Waiting for Approval" : 
                 connectionStatus === 'pending_received' ? "Accept Request" : "Connect"}
              </button>
              <Link href={`/chat?uid=${profile.id}`} style={{ padding: "10px 20px", background: "#f0f0f0", color: "#333", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", textDecoration: "none" }}>Message</Link>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT TABS - KEPT INTACT */}
      <div style={{ maxWidth: "800px", margin: "30px auto 0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", borderBottom: "2px solid #eee", marginBottom: "20px" }}>
          <button onClick={() => setActiveTab('all')} style={{ flex: 1, padding: "15px", background: "none", border: "none", borderBottom: activeTab === 'all' ? "3px solid #0b2e4a" : "3px solid transparent", color: activeTab === 'all' ? "#0b2e4a" : "#999", fontWeight: "bold", cursor: "pointer" }}>The Walk</button>
          <button onClick={() => setActiveTab('glimpses')} style={{ flex: 1, padding: "15px", background: "none", border: "none", borderBottom: activeTab === 'glimpses' ? "3px solid #0b2e4a" : "3px solid transparent", color: activeTab === 'glimpses' ? "#0b2e4a" : "#999", fontWeight: "bold", cursor: "pointer" }}>Glimpses</button>
          <button onClick={() => setActiveTab('prayers')} style={{ flex: 1, padding: "15px", background: "none", border: "none", borderBottom: activeTab === 'prayers' ? "3px solid #0b2e4a" : "3px solid transparent", color: activeTab === 'prayers' ? "#0b2e4a" : "#999", fontWeight: "bold", cursor: "pointer" }}>Prayers</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: activeTab === 'glimpses' ? "repeat(auto-fill, minmax(150px, 1fr))" : "1fr", gap: "15px" }}>
          {filteredPosts.length === 0 && <div style={{ textAlign: "center", padding: "40px", color: "#999", gridColumn: "1 / -1" }}>No content shared yet.</div>}
          {filteredPosts.map(post => (
            activeTab === 'glimpses' ? (
              <div key={post.id} style={{ aspectRatio: "9/16", background: "black", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
                 <video src={post.media_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                 <div style={{ position: "absolute", bottom: "5px", left: "5px", color: "white", fontSize: "10px", fontWeight: "bold" }}>▶ {post.amens?.[0]?.count || 0}</div>
              </div>
            ) : (
              <div key={post.id} style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "10px" }}>
                 <div style={{ fontSize: "12px", color: "#999", marginBottom: "5px" }}>{new Date(post.created_at).toDateString()}</div>
                 {post.title && <h3 style={{ margin: "0 0 10px 0", color: "#0b2e4a" }}>{post.title}</h3>}
                 <p style={{ margin: 0, color: "#333", lineHeight: "1.5" }}>{post.content}</p>
                 {post.media_url && post.type !== 'Glimpse' && <img src={post.media_url} style={{ width: "100%", borderRadius: "8px", marginTop: "15px" }} />}
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}