"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditProfilePage({ params }) {
  const router = useRouter();
  const userId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    dob: "",
    gender: "",
    church: "",
    about: "",
    faith_journey: "",
    avatar_url: "",
  });

  // -------------------------------------------------------
  // LOAD USER PROFILE
  // -------------------------------------------------------
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) setProfile(data);
      setLoading(false);
    }

    load();
  }, [userId]);

  // -------------------------------------------------------
  // HANDLE FIELD CHANGE
  // -------------------------------------------------------
  function handleChange(field, value) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  // -------------------------------------------------------
  // AVATAR UPLOAD
  // -------------------------------------------------------
  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const filename = `${userId}-${Date.now()}.${file.name.split('.').pop()}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filename, file);

    if (uploadError) {
      alert("Failed to upload avatar");
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("avatars")
      .getPublicUrl(filename);

    // Update profile state
    setProfile((prev) => ({ ...prev, avatar_url: publicUrl.publicUrl }));
  }

  // -------------------------------------------------------
  // SAVE PROFILE
  // -------------------------------------------------------
  async function saveProfile() {
    setSaving(true);

    const updates = {
      id: userId,
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
      alert("Error saving profile.");
      return;
    }

    router.push("/dashboard");
  }

  if (loading) return <p style={{ padding: 20 }}>Loading Profile...</p>;

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 20 }}>Edit Profile</h1>

      <div
        style={{
          maxWidth: 700,
          background: "#fff",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        }}
      >
        {/* Avatar */}
        <div style={{ marginBottom: 20 }}>
          <img
            src={profile.avatar_url || "/images/default-avatar.png"}
            alt="Avatar"
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              objectFit: "cover",
              boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
            }}
          />

          <div style={{ marginTop: 10 }}>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} />
          </div>
        </div>

        {/* FULL NAME */}
        <label>Full Name</label>
        <input
          value={profile.full_name || ""}
          onChange={(e) => handleChange("full_name", e.target.value)}
          className="profile-input"
        />

        {/* DOB */}
        <label>Date of Birth</label>
        <input
          type="date"
          value={profile.dob || ""}
          onChange={(e) => handleChange("dob", e.target.value)}
          className="profile-input"
        />

        {/* GENDER */}
        <label>Gender</label>
        <select
          value={profile.gender || ""}
          onChange={(e) => handleChange("gender", e.target.value)}
          className="profile-input"
        >
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        {/* CHURCH */}
        <label>Church / Ministry</label>
        <input
          value={profile.church || ""}
          onChange={(e) => handleChange("church", e.target.value)}
          className="profile-input"
        />

        {/* ABOUT */}
        <label>About</label>
        <textarea
          value={profile.about || ""}
          onChange={(e) => handleChange("about", e.target.value)}
          className="profile-input"
        />

        {/* FAITH JOURNEY */}
        <label>Faith Journey</label>
        <textarea
          value={profile.faith_journey || ""}
          onChange={(e) => handleChange("faith_journey", e.target.value)}
          className="profile-input"
        />

        {/* BUTTONS */}
        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-cancel"
          >
            Cancel
          </button>

          <button
            onClick={saveProfile}
            className="btn-save"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
