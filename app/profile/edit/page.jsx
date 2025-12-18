"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    church: "",
    avatar_url: "",
    date_of_birth: "",
    gender: "",
    about: "",
    faith_journey: "",
    upi_id: "" // Added UPI ID to state
  });
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

  // Helper to get initials for fallback
  const getInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.trim().split(" ");
      if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
      return names[0].substring(0, 2).toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || "B";
  };

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file || !user) return;

    setLoading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);
    if (uploadError) { 
      alert("Upload failed: " + uploadError.message); 
      setLoading(false); 
      return; 
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
    
    setProfile({ ...profile, avatar_url: urlData.publicUrl });
    setLoading(false);
    alert("Profile picture updated!");
    router.refresh();
  }

  async function handleRemovePhoto() {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    
    if (!error) {
        setProfile({ ...profile, avatar_url: null });
        alert("Profile photo removed.");
        router.refresh();
    } else {
        alert("Error removing photo: " + error.message);
    }
    setLoading(false);
  }

  async function handleUpdate() {
    setLoading(true);
    
    // 1. Check if username is taken (if changed)
    if (profile.username) {
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', profile.username)
            .neq('id', user.id)
            .single();
            
        if (existing) {
            alert("Username is already taken. Please choose another.");
            setLoading(false);
            return;
        }
    }

    // 2. Update Profile with all new fields including UPI ID
    const { error } = await supabase.from("profiles").update({ 
      full_name: profile.full_name, 
      username: profile.username,
      church: profile.church,
      date_of_birth: profile.date_of_birth,
      gender: profile.gender,
      about: profile.about,
      faith_journey: profile.faith_journey,
      upi_id: profile.upi_id
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

  const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px" };
  const labelStyle = { display: "block", marginBottom: "8px", fontWeight: "600", color: "#555", fontSize: "14px" };

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", padding: "30px", background: "white", borderRadius: "16px", border: "1px solid #eaeaea", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
      <h1 style={{ color: "#0b2e4a", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "30px" }}>Edit Profile</h1>

      {/* Avatar Section */}
      <div style={{ display: "flex", alignItems: "center", gap: "25px", marginBottom: "35px" }}>
        <div style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", border: "3px solid #eee", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b2e4a", color: "white", fontWeight: "bold", fontSize: "28px" }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            getInitials()
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button onClick={() => fileInputRef.current.click()} style={{ padding: "10px 18px", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
            {loading ? "Uploading..." : "Change Photo"}
          </button>
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
          
          {profile.avatar_url && (
            <button onClick={handleRemovePhoto} disabled={loading} style={{ padding: "8px 18px", background: "transparent", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "14px", fontWeight: "500", textAlign: "left" }}>
              Remove Photo
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div>
          <label style={labelStyle}>Full Name</label>
          <input type="text" value={profile.full_name || ""} onChange={e => setProfile({...profile, full_name: e.target.value})} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Username (Unique)</label>
          <input type="text" value={profile.username || ""} onChange={e => setProfile({...profile, username: e.target.value.toLowerCase().replace(/\s/g, '')})} placeholder="e.g. johndoe" style={{ ...inputStyle, background:'#f9f9f9' }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div>
          <label style={labelStyle}>Date of Birth</label>
          <input type="date" value={profile.date_of_birth || ""} onChange={e => setProfile({...profile, date_of_birth: e.target.value})} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Gender</label>
          <select value={profile.gender || ""} onChange={e => setProfile({...profile, gender: e.target.value})} style={inputStyle}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Church / Ministry</label>
        <input type="text" value={profile.church || ""} onChange={e => setProfile({...profile, church: e.target.value})} style={inputStyle} />
      </div>

      {/* UPI ID Field */}
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>UPI ID (For Blessings)</label>
        <input 
            type="text" 
            placeholder="e.g. yourname@okhdfcbank" 
            value={profile.upi_id || ""} 
            onChange={(e) => setProfile({ ...profile, upi_id: e.target.value })}
            style={inputStyle} 
        />
        <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>Required to receive financial blessings from other believers.</p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>About</label>
        <textarea value={profile.about || ""} onChange={e => setProfile({...profile, about: e.target.value})} style={{ ...inputStyle, minHeight: "80px", resize: "vertical", fontFamily: "inherit" }} placeholder="Tell us a little bit about yourself..." />
      </div>

      <div style={{ marginBottom: "30px" }}>
        <label style={labelStyle}>Faith Journey</label>
        <textarea value={profile.faith_journey || ""} onChange={e => setProfile({...profile, faith_journey: e.target.value})} style={{ ...inputStyle, minHeight: "100px", resize: "vertical", fontFamily: "inherit" }} placeholder="Share your testimony or how you came to faith..." />
      </div>

      {/* Button Group */}
      <div style={{ display: "flex", gap: "15px" }}>
        <button onClick={() => router.back()} style={{ flex: 1, padding: "14px", background: "#f0f0f0", color: "#333", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={handleUpdate} disabled={loading} style={{ flex: 1, padding: "14px", background: "#2e8b57", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}