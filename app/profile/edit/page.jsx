"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // ✅ Correct Supabase import

export default function EditProfilePage() {
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

  const fileInputRef = useRef(null);

  // -----------------------------------
  // 🔹 Load user & profile
  // -----------------------------------
  useEffect(() => {
    async function loadData() {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth?.user) {
        router.push("/");
        return;
      }

      setUser(auth.user);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .single();

      if (prof) {
        setProfile({
          full_name: prof.full_name ?? "",
          dob: prof.dob ?? "",
          gender: prof.gender ?? "",
          church: prof.church ?? "",
          about: prof.about ?? "",
          faith_journey: prof.faith_journey ?? "",
          avatar_url: prof.avatar_url ?? "",
        });
      }

      setLoading(false);
    }

    loadData();
  }, []);

  // -----------------------------------
  // 🔹 Handle avatar upload
  // -----------------------------------
  const uploadAvatar = async (e) => {
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

    // Update DB
    await supabase
      .from("profiles")
      .update({ avatar_url: publicURL })
      .eq("id", user.id);
  };

  // -----------------------------------
  // 🔹 Save profile
  // -----------------------------------
  const saveProfile = async () => {
    if (!user) return;

    const updates = {
      id: user.id,
      full_name: profile.full_name,
      dob: profile.dob,
      gender: profile.gender,
      church: profile.church,
      about: profile.about,
      faith_journey: profile.faith_journey,
      avatar_url: profile.avatar_url,
      updated_at: new Date().toISOString(),
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
  };

  if (loading) return <p style={{ padding: 40 }}>Loading profile...</p>;

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "20px" }}>Edit Profile</h1>

      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        {/* Avatar */}
        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <img
            src={
              profile.avatar_url ||
              "/default-avatar.png"
            }
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
            onClick={() => fileInputRef.current.click()}
            style={{
              marginTop: 10,
              background: "#eee",
              padding: "6px 16px",
              borderRadius: 6,
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Change Photo
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            style={{ display: "none" }}
          />
        </div>

        {/* Fields */}
        <label>Full Name</label>
        <input
          className="input"
          value={profile.full_name}
          onChange={(e) =>
            setProfile({ ...profile, full_name: e.target.value })
          }
        />

        <label>Date of Birth</label>
        <input
          type="date"
          className="input"
          value={profile.dob}
          onChange={(e) =>
            setProfile({ ...profile, dob: e.target.value })
          }
        />

        <label>Gender</label>
        <select
          className="input"
          value={profile.gender}
          onChange={(e) =>
            setProfile({ ...profile, gender: e.target.value })
          }
        >
          <option value="">Select</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </select>

        <label>Church / Ministry</label>
        <input
          className="input"
          value={profile.church}
          onChange={(e) =>
            setProfile({ ...profile, church: e.target.value })
          }
        />

        <label>About</label>
        <textarea
          className="input"
          rows={3}
          value={profile.about}
          onChange={(e) =>
            setProfile({ ...profile, about: e.target.value })
          }
        />

        <label>Faith Journey</label>
        <textarea
          className="input"
          rows={4}
          value={profile.faith_journey}
          onChange={(e) =>
            setProfile({ ...profile, faith_journey: e.target.value })
          }
        />

        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{ padding: "10px 20px", background: "#eee", borderRadius: 6 }}
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
