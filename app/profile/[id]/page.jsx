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

  // --- MUTUAL CONNECTION STATES ---
  const [connectionStatus, setConnectionStatus] = useState('none'); 
  const [connectionCount, setConnectionCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadProfileData() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    const { data: profileData, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error || !profileData) return router.push("/dashboard");
    setProfile(profileData);

    // 1. Determine Mutual Connection Status
    if (user && user.id !== id) {
      const { data: request } = await supabase
        .from('connection_requests') // Using the table from your SQL
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

    // 2. Fetch Mutual Connection Count
    const { count } = await supabase
      .from('connection_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`sender_id.eq.${id},receiver_id.eq.${id}`);
    
    setConnectionCount(count || 0);

    const { data: postData } = await supabase.from('posts').select('*, amens(count)').eq('user_id', id).order('created_at', { ascending: false });
    setPosts(postData || []);
    setLoading(false);
  }

  useEffect(() => { loadProfileData(); }, [id]);

  async function handleConnectionToggle() {
    if (!currentUser) return alert("Please log in.");
    setActionLoading(true);

    try {
      if (connectionStatus === 'none') {
        // "A request has been sent"
        await supabase.from('connection_requests').insert({ sender_id: currentUser.id, receiver_id: id });
        alert("A request has been sent!");
        setConnectionStatus('pending_sent');
      } 
      else if (connectionStatus === 'pending_received') {
        // Accept incoming request
        await supabase.from('connection_requests').update({ status: 'accepted' }).match({ sender_id: id, receiver_id: currentUser.id });
        setConnectionStatus('connected');
      } 
      else {
        // Disconnect or Cancel
        await supabase.from('connection_requests').delete().or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${currentUser.id})`);
        setConnectionStatus('none');
      }
      loadProfileData();
    } catch (err) {
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
      const fileName = `${currentUser.id}-${Date.now()}`;
      await supabase.storage.from('covers').upload(fileName, file);
      const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName);
      await supabase.from('profiles').update({ cover_url: publicUrl }).eq('id', currentUser.id);
      loadProfileData();
    } catch (e) { alert("Cover upload failed."); }
    finally { setCoverUploading(false); }
  }

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>;

  const isOwner = currentUser?.id === profile.id;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafd", paddingBottom: "40px" }}>
      {/* HEADER / COVER PHOTO */}
      <div style={{ height: "400px", background: profile.cover_url ? `url(${profile.cover_url}) center/cover` : "linear-gradient(135deg, #0b2e4a, #2e8b57)", position: "relative" }}>
        <Link href="/dashboard" style={{ position: "absolute", top: "20px", left: "20px", background: "rgba(0,0,0,0.5)", color: "white", padding: "8px 16px", borderRadius: "20px", textDecoration: "none", fontSize: "14px", zIndex: 10 }}>
          ⬅ Back to Dashboard
        </Link>
        {isOwner && (
          <label style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(0,0,0,0.5)", color: "white", padding: "8px 16px", borderRadius: "20px", cursor: "pointer", zIndex: 10 }}>
            📷 {coverUploading ? "Uploading..." : "Update Cover"}
            <input type="file" hidden onChange={handleCoverUpload} />
          </label>
        )}
      </div>

      {/* PROFILE INFO */}
      <div style={{ maxWidth: "800px", margin: "-60px auto 0", padding: "0 20px", position: "relative" }}>
        <div style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", textAlign: "center" }}>
          <img src={profile.avatar_url || '/images/default-avatar.png'} style={{ width: 120, height: 120, borderRadius: "50%", border: "4px solid white", marginTop: "-80px", objectFit: "cover" }} />
          <h1 style={{ color: "#0b2e4a", margin: "10px 0" }}>{profile.full_name}</h1>
          
          <div style={{ display: "flex", justifyContent: "center", gap: "30px", margin: "20px 0", borderTop: "1px solid #eee", padding: "15px 0" }}>
            <div><strong>{posts.length}</strong><br/><small>Posts</small></div>
            <div><strong>{connectionCount}</strong><br/><small>Connections</small></div>
          </div>

          {!isOwner && (
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button 
                onClick={handleConnectionToggle} 
                disabled={actionLoading}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: "bold", color: "white", cursor: "pointer", 
                  background: connectionStatus === 'connected' ? "#ff4d4d" : connectionStatus === 'pending_sent' ? "#ffc107" : "#2e8b57" 
                }}
              >
                {actionLoading ? "Wait..." : 
                 connectionStatus === 'connected' ? "Disconnect" : 
                 connectionStatus === 'pending_sent' ? "Waiting for Approval" : "Connect"}
              </button>
              <Link href={`/chat?uid=${profile.id}`} style={{ padding: "10px 20px", background: "#f0f0f0", borderRadius: "8px", textDecoration: "none", color: "#333", fontWeight: "bold" }}>Message</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}