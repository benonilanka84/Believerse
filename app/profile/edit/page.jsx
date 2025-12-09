"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";

export default function EditProfile() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [profile, setProfile] = useState({
    full_name: "",
    dob: "",
    gender: "",
    church: "",
    about: "",
    faith_journey: "",
    avatar_url: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) {
          router.push("/");
          return;
        }
        setUser(auth.user);

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", auth.user.id)
          .single();

        if (data) {
          setProfile({
            full_name: data.full_name || "",
            dob: data.dob || "",
            gender: data.gender || "",
            church: data.church || "",
            about: data.about || "",
            faith_journey: data.faith_journey || "",
            avatar_url: data.avatar_url || "",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  // Upload Logic
  async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      await updateProfileAvatar(urlData.publicUrl);

    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  }

  // Remove Logic
  async function removeAvatar() {
    if (!confirm("Remove profile photo?")) return;
    await updateProfileAvatar(null);
  }

  async function updateProfileAvatar(url) {
    setProfile(prev => ({ ...prev, avatar_url: url }));
    
    // Save to DB immediately
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: url, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) alert("Error updating profile: " + error.message);
  }

  // Save All Fields
  async function saveProfile() {
    if (!user) return;
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        updated_at: new Date().toISOString(),
        full_name: profile.full_name,
        dob: profile.dob || null, // Handle empty strings
        gender: profile.gender || null,
        church: profile.church,
        about: profile.about,
        faith_journey: profile.faith_journey,
        avatar_url: profile.avatar_url
      });

      if (error) throw error;
      alert("✅ Profile saved!");
      router.push("/dashboard");
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  }

  if (loading) return <div style={{padding:'40px', textAlign:'center'}}>Loading Profile...</div>;

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "20px", color: "#0b2e4a" }}>Edit Profile</h1>
      
      <div style={{ background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        
        {/* Avatar Section */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: "#f0f0f0", margin: "0 auto 15px auto", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #ddd" }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "40px", color: "#ccc" }}>📷</span>
            )}
          </div>
          
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button onClick={() => fileRef.current.click()} style={{ padding: "8px 16px", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
              Change Photo
            </button>
            {profile.avatar_url && (
              <button onClick={removeAvatar} style={{ padding: "8px 16px", background: "#fff1f0", border: "1px solid #ffccc7", color: "#cf1322", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
                Remove
              </button>
            )}
          </div>
          <input type="file" ref={fileRef} accept="image/*" onChange={uploadAvatar} style={{ display: "none" }} />
        </div>

        {/* Fields */}
        <div style={{ display: "grid", gap: "20px" }}>
          
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>Full Name</label>
            <input type="text" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>Date of Birth</label>
              <input type="date" value={profile.dob} onChange={e => setProfile({...profile, dob: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>Gender</label>
              <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>Church / Ministry</label>
            <input type="text" placeholder="Where do you worship?" value={profile.church} onChange={e => setProfile({...profile, church: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>About Me</label>
            <textarea placeholder="Short bio..." value={profile.about} onChange={e => setProfile({...profile, about: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", minHeight: "80px" }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>Faith Journey</label>
            <textarea placeholder="Share your testimony..." value={profile.faith_journey} onChange={e => setProfile({...profile, faith_journey: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", minHeight: "100px" }} />
          </div>

        </div>

        <div style={{ marginTop: "30px", display: "flex", justifyContent: "flex-end", gap: "15px" }}>
          <button onClick={() => router.push("/dashboard")} style={{ padding: "12px 24px", background: "#f5f5f5", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
          <button onClick={saveProfile} style={{ padding: "12px 30px", background: "#2e8b57", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Save Changes</button>
        </div>

      </div>
    </div>
  );
}