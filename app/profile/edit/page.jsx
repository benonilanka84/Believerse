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
    full_name: "", dob: "", gender: "", church: "", about: "", faith_journey: "", avatar_url: "",
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
        const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
        if (data) {
          setProfile({
            full_name: data.full_name ?? "",
            dob: data.dob ?? "",
            gender: data.gender ?? "",
            church: data.church ?? "",
            about: data.about ?? "",
            faith_journey: data.faith_journey ?? "",
            avatar_url: data.avatar_url ?? "",
          });
        }
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      updateProfileAvatar(urlData.publicUrl);
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  }

  async function removeAvatar() {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;
    updateProfileAvatar(null);
  }

  async function updateProfileAvatar(url) {
    setProfile((p) => ({ ...p, avatar_url: url }));
    const { error } = await supabase.from("profiles").update({ avatar_url: url, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (error) alert("Failed to update profile: " + error.message);
    else window.location.reload();
  }

  async function saveProfile() {
    if (!user) return;
    try {
      const updates = {
        id: user.id, email: user.email, updated_at: new Date().toISOString(),
        ...profile
      };
      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
      alert("✅ Profile saved successfully!");
      router.push("/dashboard");
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  }

  if (loading) return <p style={{ padding: "40px" }}>Loading Profile...</p>;

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "20px", color: "#0b2e4a" }}>Edit Profile</h1>
      <div style={{ background: "#ffffff", padding: "30px", borderRadius: "16px", boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}>
        
        {/* Avatar Section */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" width={120} height={120} style={{ borderRadius: "50%", objectFit: "cover", boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }} />
          ) : (
            <div style={{ width: 120, height: 120, borderRadius: "50%", background: "#2e8b57", color: "white", fontSize: "40px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }}>
              {profile.full_name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <br />
          <div style={{ marginTop: "10px", display: "flex", gap: "10px", justifyContent: "center" }}>
            <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: "6px 16px", borderRadius: "6px", border: "1px solid #ccc", background: "#f5f5f5", cursor: "pointer" }}>Change Photo</button>
            {profile.avatar_url && (
              <button type="button" onClick={removeAvatar} style={{ padding: "6px 16px", borderRadius: "6px", border: "1px solid #ffccc7", background: "#fff1f0", color: "#cf1322", cursor: "pointer" }}>Remove</button>
            )}
          </div>
          <input type="file" ref={fileRef} accept="image/*" onChange={uploadAvatar} style={{ display: "none" }} />
        </div>

        {/* Fields */}
        <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#0b2e4a" }}>Full Name</label>
        <input style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d0d7e2", marginBottom: "12px" }} value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} />

        <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#0b2e4a" }}>Church / Ministry</label>
        <input style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d0d7e2", marginBottom: "12px" }} value={profile.church} onChange={(e) => setProfile((p) => ({ ...p, church: e.target.value }))} />

        <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#0b2e4a" }}>Faith Journey</label>
        <textarea style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d0d7e2", marginBottom: "12px", minHeight: "90px" }} value={profile.faith_journey} onChange={(e) => setProfile((p) => ({ ...p, faith_journey: e.target.value }))} placeholder="Share your testimony..." />

        <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
          <button type="button" onClick={() => router.push("/dashboard")} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={saveProfile} style={{ padding: "10px 20px", borderRadius: "8px", background: "#2e8b57", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>Save</button>
        </div>
      </div>
    </div>
  );
}