"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase"; // ✅ default import

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

  // Simple shared styles so labels & inputs always look right
  const labelStyle = {
    display: "block",
    marginBottom: 6,
    marginTop: 10,
    fontWeight: 600,
    color: "#0b2e4a",
    fontSize: 14,
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d0d7e2",
    marginBottom: 12,
    fontSize: 14,
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: 90,
    resize: "vertical",
  };

  // -------------------------------------------------------
  // 🔹 LOAD PROFILE
  // -------------------------------------------------------
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();

        if (authError) {
          console.error("auth.getUser error", authError);
        }

        if (!auth?.user) {
          router.push("/");
          return;
        }

        setUser(auth.user);

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", auth.user.id)
          .maybeSingle();

        if (error) {
          console.error("profiles select error", error);
        }

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

  // -------------------------------------------------------
  // 🔹 UPLOAD AVATAR
  // -------------------------------------------------------
  async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileName = `${user.id}-${Date.now()}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("avatar upload error", uploadError);
        alert("Upload failed: " + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicURL = urlData?.publicUrl;
      if (!publicURL) return;

      // Show immediately
      setProfile((p) => ({ ...p, avatar_url: publicURL }));

      // Persist in DB (use upsert so first-time user is created)
      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        avatar_url: publicURL,
        updated_at: new Date().toISOString(),
      });

      if (upsertError) {
        console.error("avatar upsert error", upsertError);
      }
    } catch (err) {
      console.error(err);
      alert("Unexpected error while uploading avatar.");
    }
  }

  // -------------------------------------------------------
  // 🔹 SAVE PROFILE
  // -------------------------------------------------------
  async function saveProfile() {
    if (!user) return;

    try {
      const updates = {
        id: user.id,
        email: user.email,
        full_name: profile.full_name,
        dob: profile.dob || null,
        gender: profile.gender || null,
        church: profile.church || null,
        about: profile.about || null,
        faith_journey: profile.faith_journey || null,
        avatar_url: profile.avatar_url || null,
        updated_at: new Date().toISOString(),
      };

      // ✅ upsert: create row if missing, update if exists
      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        console.error("saveProfile error", error);
        alert("Save failed: " + error.message);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Unexpected error while saving profile.");
    }
  }

  if (loading) {
    return <p style={{ padding: 40 }}>Loading Profile...</p>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          marginBottom: 20,
          color: "#0b2e4a",
        }}
      >
        Edit Profile
      </h1>

      <div
        style={{
          background: "#ffffff",
          padding: 30,
          borderRadius: 16,
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        }}
      >
        {/* Avatar */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img
            src={profile.avatar_url || "/images/default-avatar.png"}
            alt="Avatar"
            width={120}
            height={120}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              background: "#eee",
              boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
            }}
          />

          <br />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              marginTop: 10,
              padding: "6px 16px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#f5f5f5",
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

        {/* Full Name */}
        <label style={labelStyle}>Full Name</label>
        <input
          style={inputStyle}
          value={profile.full_name}
          onChange={(e) =>
            setProfile((p) => ({ ...p, full_name: e.target.value }))
          }
          placeholder="Your full name"
        />

        {/* DOB */}
        <label style={labelStyle}>Date of Birth</label>
        <input
          type="date"
          style={inputStyle}
          value={profile.dob || ""}
          onChange={(e) =>
            setProfile((p) => ({ ...p, dob: e.target.value }))
          }
        />

        {/* Gender */}
        <label style={labelStyle}>Gender</label>
        <select
          style={inputStyle}
          value={profile.gender || ""}
          onChange={(e) =>
            setProfile((p) => ({ ...p, gender: e.target.value }))
          }
        >
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not">Prefer not to say</option>
        </select>

        {/* Church */}
        <label style={labelStyle}>Church / Ministry</label>
        <input
          style={inputStyle}
          value={profile.church}
          onChange={(e) =>
            setProfile((p) => ({ ...p, church: e.target.value }))
          }
          placeholder="Church / Ministry name"
        />

        {/* About */}
        <label style={labelStyle}>About</label>
        <textarea
          style={textareaStyle}
          value={profile.about}
          onChange={(e) =>
            setProfile((p) => ({ ...p, about: e.target.value }))
          }
          placeholder="Short bio"
        />

        {/* Faith Journey */}
        <label style={labelStyle}>Faith Journey</label>
        <textarea
          style={textareaStyle}
          value={profile.faith_journey}
          onChange={(e) =>
            setProfile((p) => ({ ...p, faith_journey: e.target.value }))
          }
          placeholder="Share a brief testimony or faith journey"
        />

        {/* Buttons */}
        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#f5f5f5",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={saveProfile}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              background: "#2e8b57",
              border: "none",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              marginLeft: "auto",
              minWidth: 120,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
