"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditProfile() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: "",
    dob: "",
    gender: "",
    church: "",
    about: "",
    faith_journey: "",
    avatar_url: "",
  });

  // ---------------------------------------------------
  // LOAD USER + PROFILE
  // ---------------------------------------------------
  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push("/");
        return;
      }

      setUser(userData.user);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

      if (!error && profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          dob: profileData.dob || "",
          gender: profileData.gender || "",
          church: profileData.church || "",
          about: profileData.about || "",
          faith_journey: profileData.faith_journey || "",
          avatar_url: profileData.avatar_url || "",
        });
      }

      setLoading(false);
    }

    load();
  }, []);

  // ---------------------------------------------------
  // HANDLE INPUTS
  // ---------------------------------------------------
  function updateField(field, value) {
    setProfile((p) => ({ ...p, [field]: value }));
  }

  // ---------------------------------------------------
  // AVATAR UPLOAD
  // ---------------------------------------------------
  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const filename = `${user.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const filePath = `avatars/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("Avatar upload failed");
      return;
    }

    const { data: publicURL } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const url = publicURL?.publicUrl;

    setProfile((p) => ({ ...p, avatar_url: url }));
  }

  // ---------------------------------------------------
  // SAVE PROFILE TO SUPABASE
  // ---------------------------------------------------
  async function handleSave() {
    setSaving(true);

    const updates = {
      id: user.id,
      full_name: profile.full_name,
      dob: profile.dob,
      gender: profile.gender,
      church: profile.church,
      about: profile.about,
      faith_journey: profile.faith_journey,
      avatar_url: profile.avatar_url,
      updated_at: new Date(),
    };

    const { error } = await supabase.from("profiles").upsert(updates);

    setSaving(false);

    if (error) {
      alert("Failed to save profile");
      return;
    }

    router.push("/dashboard");
  }

  if (loading) return <h2 style={{ padding: 40 }}>Loading profile...</h2>;

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
  return (
    <div style={{ padding: 24 }}>
      <h1>Edit Profile</h1>

      <div
        style={{
          maxWidth: 720,
          background: "white",
          padding: 22,
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", gap: 20 }}>
          {/* AVATAR */}
          <div style={{ width: 128 }}>
            <div
              style={{
                width: 128,
                height: 128,
                borderRadius: 999,
                overflow: "hidden",
                background: "#eee",
              }}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 42,
                    background: "#2e8b57",
                    color: "#fff",
                    fontWeight: "700",
                  }}
                >
                  {profile.full_name
                    ?.split(/\s+/)
                    .map((x) => x[0])
                    .join("")
                    .toUpperCase() || "?"}
                </div>
              )}
            </div>

            <button
              onClick={() => fileRef.current.click()}
              style={{
                marginTop: 10,
                padding: "6px 12px",
                fontSize: 14,
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              Change Photo
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: "none" }}
            />
          </div>

          {/* RIGHT SIDE FORM */}
          <div style={{ flex: 1 }}>
            <label>Full Name</label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              style={{ width: "100%", marginBottom: 12 }}
            />

            <label>Date of Birth</label>
            <input
              type="date"
              value={profile.dob}
              onChange={(e) => updateField("dob", e.target.value)}
              style={{ width: "100%", marginBottom: 12 }}
            />

            <label>Gender</label>
            <select
              value={profile.gender}
              onChange={(e) => updateField("gender", e.target.value)}
              style={{ width: "100%", marginBottom: 12 }}
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <label>Church</label>
            <input
              type="text"
              value={profile.church}
              onChange={(e) => updateField("church", e.target.value)}
              style={{ width: "100%", marginBottom: 12 }}
            />

            <label>About</label>
            <textarea
              rows={3}
              value={profile.about}
              onChange={(e) => updateField("about", e.target.value)}
              style={{ width: "100%", marginBottom: 12 }}
            />

            <label>Faith Journey</label>
            <textarea
              rows={4}
              value={profile.faith_journey}
              onChange={(e) => updateField("faith_journey", e.target.value)}
              style={{ width: "100%", marginBottom: 16 }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => router.push("/dashboard")}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid #ccc",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "10px 16px",
                  background: "#2e8b57",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  marginLeft: "auto",
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
