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
  
  // --- CONNECTION STATE ---
  const [connectionStatus, setConnectionStatus] = useState('none'); // 'none', 'pending_sent', 'pending_received', 'connected'
  const [connectionCount, setConnectionCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadProfileData() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (!profileData) return router.push("/dashboard");
    setProfile(profileData);

    // 1. Determine Connection Status
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
      }
    }

    // 2. Load Counts & Posts
    const { count } = await supabase.from('connection_requests').select('*', { count: 'exact', head: true }).eq('status', 'accepted').or(`sender_id.eq.${id},receiver_id.eq.${id}`);
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
        // Send Request
        await supabase.from('connection_requests').insert({ sender_id: currentUser.id, receiver_id: id });
        alert("Request sent!");
      } else {
        // Disconnect or Cancel Request
        await supabase.from('connection_requests').delete().or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${currentUser.id})`);
      }
      loadProfileData();
    } catch (err) {
      alert("Action failed.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  const isOwner = currentUser?.id === profile.id;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafd" }}>
      <div style={{ height: "400px", background: profile.cover_url ? `url(${profile.cover_url}) center/cover` : "#0b2e4a" }} />
      <div style={{ maxWidth: "800px", margin: "-60px auto 0", textAlign: "center", background: "white", borderRadius: "16px", padding: "20px" }}>
        <img src={profile.avatar_url || '/images/default-avatar.png'} style={{ width: 120, height: 120, borderRadius: "50%", border: "4px solid white", marginTop: "-80px" }} />
        <h1>{profile.full_name}</h1>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", margin: "20px 0" }}>
          <div><strong>{posts.length}</strong> Posts</div>
          <div><strong>{connectionCount}</strong> Connections</div>
        </div>

        {!isOwner && (
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button 
              onClick={handleConnectionToggle} 
              disabled={actionLoading}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", 
                background: connectionStatus === 'connected' ? '#ff4d4d' : connectionStatus === 'pending_sent' ? '#ffc107' : '#2e8b57',
                color: 'white'
              }}
            >
              {actionLoading ? 'Wait...' : 
               connectionStatus === 'connected' ? 'Disconnect' : 
               connectionStatus === 'pending_sent' ? 'Waiting for Approval' : 
               connectionStatus === 'pending_received' ? 'Accept Request' : 'Connect'}
            </button>
            <Link href={`/chat?uid=${profile.id}`} style={{ padding: "10px 20px", background: "#f0f0f0", borderRadius: "8px", textDecoration: "none", color: "#333" }}>Message</Link>
          </div>
        )}
      </div>
    </div>
  );
}