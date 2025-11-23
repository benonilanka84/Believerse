// components/ProfileAvatar.jsx
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileAvatar() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    const user = supabase.auth && supabase.auth.user ? supabase.auth.user() : null;
    // If using server session pattern, adjust accordingly.
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (!error) setProfile(data);
    setLoading(false);
  }

  async function saveProfile(e) {
    e.preventDefault();
    const user = supabase.auth && supabase.auth.user ? supabase.auth.user() : null;
    if (!user) return alert("Not signed in");

    const updates = {
      id: user.id,
      full_name: profile.full_name,
      dob: profile.dob,
      gender: profile.gender,
      about: profile.about,
      church_name: profile.church_name,
      faith_journey: profile.faith_journey,
      updated_at: new Date(),
    };

    const { error } = await supabase.from("profiles").upsert(updates);
    if (error) return alert(error.message);
    setEditing(false);
    loadProfile();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    // redirect to home
    if (typeof window !== "undefined") window.location.href = "/";
  }

  async function handleFileUpload(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (uploadError) return alert("Upload error: " + uploadError.message);

    const publicUrl = supabase.storage.from("avatars").getPublicUrl(filePath).publicURL;

    // Save url to profile
    const user = supabase.auth.user();
    if (user) {
      await supabase.from("profiles").upsert({ id: user.id, avatar_url: publicUrl });
      loadProfile();
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((s) => !s)}
        aria-label="Open profile menu"
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <Image
          src={profile?.avatar_url || "/images/default-avatar.png"}
          alt="Profile"
          width={52}
          height={52}
          style={{ borderRadius: 999 }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: 8,
            background: "white",
            color: "#0b2e4a",
            width: 240,
            borderRadius: 8,
            boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
            zIndex: 2000,
            padding: 12,
          }}
        >
          <div style={{ marginBottom: 8, fontWeight: 700 }}>
            {profile?.full_name || "Your profile"}
          </div>

          <button className="btn" onClick={() => { setEditing(true); setOpen(false); }} style={{ width: "100%", marginBottom: 8 }}>
            Edit Profile
          </button>

          <a href="/terms" style={{ display: "block", padding: "8px 0", color: "#0b2e4a" }}>Terms & Conditions</a>
          <a href="/settings" style={{ display: "block", padding: "8px 0", color: "#0b2e4a" }}>Settings</a>

          <div style={{ marginTop: 8 }}>
            <button className="btn" onClick={handleLogout} style={{ width: "100%", background: "#111", color: "#fff" }}>
              Log Out
            </button>
          </div>
        </div>
      )}

      {editing && (
        <EditProfileModal
          profile={profile}
          setProfile={setProfile}
          onClose={() => setEditing(false)}
          onSave={saveProfile}
          onFileChange={handleFileUpload}
        />
      )}
    </div>
  );
}

function EditProfileModal({ profile = {}, setProfile, onClose, onSave, onFileChange }) {
  const updateField = (field, value) => setProfile((p) => ({ ...p, [field]: value }));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000
    }}>
      <div style={{ width: 520, background: "#fff", padding: 20, borderRadius: 10 }}>
        <h3>Edit profile</h3>
        <form onSubmit={onSave}>
          <div style={{ marginBottom: 8 }}>
            <label>Upload photo</label><br />
            <input type="file" accept="image/*" onChange={onFileChange} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Full name" value={profile?.full_name || ""} onChange={(e) => updateField("full_name", e.target.value)} />
            <input placeholder="Date of birth" type="date" value={profile?.dob || ""} onChange={(e) => updateField("dob", e.target.value)} />
          </div>

          <div style={{ marginTop: 8 }}>
            <select value={profile?.gender || ""} onChange={(e) => updateField("gender", e.target.value)}>
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ marginTop: 8 }}>
            <input placeholder="Church / Ministry" value={profile?.church_name || ""} onChange={(e) => updateField("church_name", e.target.value)} />
          </div>

          <div style={{ marginTop: 8 }}>
            <textarea placeholder="About / Faith Journey" rows={4} value={profile?.about || ""} onChange={(e) => updateField("about", e.target.value)} />
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" onClick={onClose} className="btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
