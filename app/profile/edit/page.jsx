"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    full_name: "",
    dob: "",
    gender: "",
    church: "",
    about: "",
    faith_journey: "",
    avatar_url: ""
  });

  /** LOAD USER + PROFILE **/
  useEffect(() => {
    async function load() {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;

      if (!user) {
        router.push("/");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    }

    load();
  }, []);

  /** FILE UPLOAD **/
  async function uploadAvatar(file) {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    const fileName = `${user.id}-${Date.now()}.png`;
    const path = `avatars/${fileName}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      alert("Failed to upload image");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const avatarUrl = urlData.publicUrl;

    setProfile(p => ({ ...p, avatar_url: avatarUrl }));
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
  }

  /** SAVE PROFILE **/
  async function saveProfile() {
    setSaving(true);

    const { error } = await supabase.from("profiles").upsert(profile);

    setSaving(false);

    if (error) {
      alert("Failed to save profile.");
    } else {
      router.push("/dashboard");
    }
  }

  if (loading)
    return (
      <div style={{ padding: 40 }}>
        <h2>Loading profile...</h2>
      </div>
    );

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 18 }}>Edit Profile</h1>

      <div
        style={{
          maxWidth: 720,
          background: "rgba(255,255,255,0.95)",
          padding: 22,
          borderRadius: 12,
          boxShadow: "0 12px 30px rgba(0,0,0,0.15)"
        }}
      >
        <div style={{ display: "flex", gap: 20 }}>
          {/* Avatar */}
          <div style={{ width: 128 }}>
            <div
              style={{
                width: 128,
                height: 128,
                borderRadius: "50%",
                overflow: "hidden",
                background: "#ddd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 40, fontWeight: 700 }}>
                  {profile.full_name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current.click()}
              style={{
                marginTop: 10,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #aaa",
                cursor: "pointer"
              }}
            >
              Change Photo
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFile}
            />
          </div>

          {/* Form */}
          <div style={{ flex: 1 }}>
            <label>Full Name</label>
            <input
              type="text"
              value={profile.full_name || ""}
              onChange={e =>
                setProfile(p => ({ ...p, full_name: e.target.value }))
              }
              className="input"
            />

            <label>Date of Birth</label>
            <input
              type="date"
              value={profile.dob || ""}
              onChange={e => setProfile(p => ({ ...p, dob: e.target.value }))}
              className="input"
            />

            <label>Gender</label>
            <select
              value={profile.gender || ""}
              onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
              className="input"
            >
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </select>

            <label>Church / Ministry</label>
            <input
              type="text"
              value={profile.church || ""}
              onChange={e =>
                setProfile(p => ({ ...p, church: e.target.value }))
              }
              className="input"
            />

            <label>About</label>
            <textarea
              rows={3}
              value={profile.about || ""}
              onChange={e =>
                setProfile(p => ({ ...p, about: e.target.value }))
              }
              className="input"
            />

            <label>Faith Journey</label>
            <textarea
              rows={4}
              value={profile.faith_journey || ""}
              onChange={e =>
                setProfile(p => ({ ...p, faith_journey: e.target.value }))
              }
              className="input"
            />

            {/* Buttons */}
            <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
              <button
                onClick={() => router.push("/dashboard")}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  background: "#eee",
                  border: "1px solid #ddd"
                }}
              >
                Cancel
              </button>

              <button
                onClick={saveProfile}
                disabled={saving}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  background: "#2e8b57",
                  border: "none",
                  color: "#fff"
                }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
