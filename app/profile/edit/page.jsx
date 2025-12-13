"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", username: "", church: "", avatar_url: "" });
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
      } else {
        router.push("/login");
      }
    };
    getProfile();
  }, []);

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file || !user) return;

    setLoading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    
    // Upload
    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);
    if (uploadError) { 
      alert("Upload failed: " + uploadError.message); 
      setLoading(false); 
      return; 
    }

    // Get URL
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    
    // Save
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
    
    setProfile({ ...profile, avatar_url: urlData.publicUrl });
    setLoading(false);
    alert("Profile picture updated!");
    window.location.reload(); 
  }

  async function handleUpdate() {
    setLoading(true);
    
    // 1. Check if username is taken (if changed)
    if (profile.username) {
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', profile.username)
            .neq('id', user.id) // Exclude current user
            .single();
            
        if (existing) {
            alert("Username is already taken. Please choose another.");
            setLoading(false);
            return;
        }
    }

    // 2. Update Profile
    const { error } = await supabase.from("profiles").update({ 
      full_name: profile.full_name, 
      username: profile.username,
      church: profile.church 
    }).eq("id", user.id);

    setLoading(false);
    if (!error) {
      alert("Profile updated successfully!");
      router.refresh();
      router.push("/dashboard"); 
    } else {
      alert("Error updating profile: " + error.message);
    }
  }

  if (!user) return null;

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "30px", background: "white", borderRadius: "12px", border: "1px solid #eaeaea" }}>
      <h1 style={{ color: "#0b2e4a", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "30px" }}>Edit Profile</h1>

      {/* Avatar Section */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "1px solid #ddd" }}>
          <img src={profile.avatar_url || "/images/default-avatar.png"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <button onClick={() => fileInputRef.current.click()} style={{ padding: "8px 16px", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
            {loading ? "Uploading..." : "Change Photo"}
          </button>
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
        </div>
      </div>

      {/* Fields */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#555" }}>Full Name</label>
        <input type="text" value={profile.full_name || ""} onChange={e => setProfile({...profile, full_name: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#555" }}>Username (Unique)</label>
        <input type="text" value={profile.username || ""} onChange={e => setProfile({...profile, username: e.target.value.toLowerCase().replace(/\s/g, '')})} placeholder="e.g. benonilanka" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", background:'#f9f9f9' }} />
      </div>

      <div style={{ marginBottom: "30px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#555" }}>Church / Ministry</label>
        <input type="text" value={profile.church || ""} onChange={e => setProfile({...profile, church: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
      </div>

      <button onClick={handleUpdate} disabled={loading} style={{ width: "100%", padding: "14px", background: "#2e8b57", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}