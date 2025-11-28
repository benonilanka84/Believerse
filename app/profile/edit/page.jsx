"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";   // ✅ Correct import

export default function EditProfile() {
  const router = useRouter();

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

  const fileRef = useRef(null);

  // -------------------------------------------------------
  // 🔹 LOAD PROFILE
  // -------------------------------------------------------
  useEffect(() => {
    async function loadProfile() {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth?.user) {
        router.push("/");
        return;
      }

      setUser(auth.user);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .single();

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

      setLoading(false);
    }

    loadProfile();
  }, []);

  // -------------------------------------------------------
  // 🔹 UPLOAD AVATAR
  // -------------------------------------------------------
  async function uploadAvatar(e) {
    const file = e.target.files[0];
    if (!file || !user) return;

    const fileName = `avatars/${user.id}-${Date.now()}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const publicURL = urlData?.publicUrl;

    setProfile((p) => ({ ...p, avatar_url: publicURL }));

    // update DB
    await supabase
      .from("profiles")
      .update({ avatar_url: publicURL })
      .eq("id", user.id);
  }

  // -------------------------------------------------------
  // 🔹 SAVE PROFILE
  // -------------------------------------------------------
  async function saveProfile() {
    const updates = {
      full_name: profile.full_name,
      dob: profile.dob,
      gender: profile.gender,
      church: profile.church,
      about: profile.about,
      faith_journey: profile.faith_journey,
      avatar_url: profile.avatar_url,
      updated_at: new Date(),
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      alert("Save failed: " + error.message);
      return;
    }

    router.push("/dashboard");
  }

  if (loading) return <p style={{ padding: 40 }}>Loading Profile...</p>;

  return (
    <div style={{ padding: 40, maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: 20 }}>Edit Profile</h1>

      <div
        style={{
          background: "#fff",
          padding: 30,
          borderRadius: 12,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        {/* Avatar */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img
            src={profile.avatar_url || "/default-avatar.png"}
            alt="Avatar"
            width={120}
            height={120}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              background: "#eee",
            }}
          />

          <br />

          <button
            onClick={() => fileRef.current.click()}
            style={{
              marginTop: 10,
              padding: "6px 16px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#eee",
              cursor: "pointer",
            }}
          >
            Change Photo
          </button>

          <input
            type="file"
            ref={fileRef}
            accept="image/*"
            onChange={uploadAvatar}
            style={{ display: "none" }}
          />
        </div>

        {/* INPUTS */}
        <label className="form-label">Full Name</label>
        <input
          className="form-input"
          value={profile.full_name}
          onChange={(e) =>
            setProfile({ ...profile, full_name: e.target.value })
          }
        />

        <label className="form-label">Date of Birth</label>
        <input
          type="date"
          className="form-input"
          value={profile.dob}
          onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
        />

        <label className="form-label">Gender</label>
        <select
          className="form-input"
          value={profile.gender}
          onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
        >
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <label className="form-label">Church / Ministry</label>
        <input
          className="form-input"
          value={profile.church}
          onChange={(e) => setProfile({ ...profile, church: e.target.value })}
        />

        <label className="form-label">About</label>
        <textarea
          className="form-textarea"
          rows={3}
          value={profile.about}
          onChange={(e) => setProfile({ ...profile, about: e.target.value })}
        />

        <label className="form-label">Faith Journey</label>
        <textarea
          className="form-textarea"
          rows={4}
          value={profile.faith_journey}
          onChange={(e) =>
            setProfile({ ...profile, faith_journey: e.target.value })
          }
        />

        {/* BUTTONS */}
        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "10px 20px",
              background: "#eee",
              borderRadius: 6,
            }}
          >
            Cancel
          </button>

          <button
            onClick={saveProfile}
            style={{
              padding: "10px 20px",
              background: "#2e8b57",
              color: "#fff",
              borderRadius: 6,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
