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
  // New state for cover photo upload
  const [coverUploading, setCoverUploading] = useState(false);

  // 1. Fetch Data Wrapper
  async function loadProfileData() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

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

    const { data: postData } = await supabase
      .from('posts')
      .select('*, amens(count)')
      .eq('user_id', id)
      .order('created_at', { ascending: false });
    
    if (postData) setPosts(postData);
    setLoading(false);
  }

  useEffect(() => {
    loadProfileData();
  }, [id]);

  // --- NEW: HANDLE COVER PHOTO UPLOAD ---
  async function handleCoverUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setCoverUploading(true);
    try {
      // 1. Upload to 'covers' bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      // 3. Update Profile in Database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      alert("Cover photo updated successfully!");
      loadProfileData(); // Refresh the page data

    } catch (error) {
      console.error(error);
      alert("Error uploading cover photo: " + error.message);
    } finally {
      setCoverUploading(false);
    }
  }

  // --- BADGE HELPER ---
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
      
      {/* --- HEADER / COVER PHOTO --- */}
      <div style={{ 
        height: "400px", // UPDATED: Increased height
        background: profile.cover_url ? `url(${profile.cover_url}) center/cover` : "linear-gradient(135deg, #0b2e4a, #2e8b57)",
        position: "relative"
      }}>
        {/* Back Button (Top Left) */}
        <Link href="/dashboard" style={{ position: "absolute", top: "20px", left: "20px", background: "rgba(0,0,0,0.5)", color: "white", padding: "8px 16px", borderRadius: "20px", textDecoration: "none", fontSize: "14px", zIndex: 10 }}>
          ⬅ Back to Dashboard
        </Link>

        {/* UPDATED: Upload Cover Button (Top Right - Owner Only) */}
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
              style={{ display: "none" }} // Hide the actual file input
            />
          </label>
        )}
      </div>

      {/* --- PROFILE INFO --- */}
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
            <div><div style={{ fontWeight: "800", fontSize: "1.2rem", color: "#0b2e4a" }}>0</div><div style={{ fontSize: "12px", color: "#888" }}>Connections</div></div>
          </div>

          {!isOwner && (
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button style={{ padding: "10px 20px", background: "#2e8b57", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Connect</button>
              <Link href={`/chat?uid=${profile.id}`} style={{ padding: "10px 20px", background: "#f0f0f0", color: "#333", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", textDecoration: "none" }}>Message</Link>
            </div>
          )}
           
          {/* UPDATED: Removed the "Edit Profile" button */}
        </div>
      </div>

      {/* --- CONTENT TABS --- */}
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