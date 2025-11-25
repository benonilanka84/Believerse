"use client";

import { useState, useEffect } from "react";
import supabase from "@/supabase";
import Image from "next/image";

export default function ProfilePage() {
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
  const [initials, setInitials] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        window.location.href = "/";
        return;
      }

      setUser(data.user);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (prof) {
        setProfile(prof);

        const nameParts = prof.full_name?.trim().split(" ") || [];
        const first = nameParts[0]?.[0]?.toUpperCase() || "";
        const second = nameParts[1]?.[0]?.toUpperCase() || "";
        setInitials(first + second);
      }
    }

    loadUser();
  }, []);

  async function updateProfile() {
    const updates = {
      id: user.id,
      full_name: profile.full_name,
      dob: profile.dob,
      gender: profile.gender,
      church: profile.church,
      about: profile.about,
      faith_journey: profile.faith_journey,
      updated_at: new Date(),
    };

    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);

    if (error) {
      alert("Error updating profile: " + error.message);
    } else {
      alert("Profile updated successfully!");
    }
  }

  async function uploadAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = `avatars/${user.id}-${Date.now()}.jpg`;

    let { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);

    const publicURL = urlData?.publicUrl;

    await supabase
      .from("profiles")
      .update({ avatar_url: publicURL })
      .eq("id", user.id);

    setProfile((p) => ({ ...p, avatar_url: publicURL }));
  }

  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>Edit Profile</h1>

      <div style={styles.card}>
        {/* Avatar */}
        <div style={styles.avatarBox}>
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              width={90}
              height={90}
              style={{ borderRadius: "50%" }}
              alt="Profile"
            />
          ) : (
            <div style={styles.initialAvatar}>{initials}</div>
          )}

          <input type="file" accept="image/*" onChange={uploadAvatar} />
        </div>

        {/* Fields */}
        <label className="field-label">Full Name</label>
        <input
          type="text"
          value={profile.full_name}
          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
          className="input"
        />

        <label className="field-label">Date of Birth</label>
        <input
          type="date"
          value={profile.dob}
          onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
          className="input"
        />

        <label className="field-label">Gender</label>
        <select
          className="input"
          value={profile.gender}
          onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
        >
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <label className="field-label">Church / Ministry</label>
        <input
          type="text"
          value={profile.church}
          onChange={(e) => setProfile({ ...profile, church: e.target.value })}
          className="input"
        />

        <label className="field-label">About</label>
        <textarea
          className="input"
          rows={3}
          value={profile.about}
          onChange={(e) => setProfile({ ...profile, about: e.target.value })}
        />

        <label className="field-label">Faith Journey</label>
        <textarea
          className="input"
          rows={4}
          value={profile.faith_journey}
          onChange={(e) => setProfile({ ...profile, faith_journey: e.target.value })}
        />

        <button className="btn-primary" onClick={updateProfile} style={styles.saveBtn}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    padding: "40px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    marginBottom: "20px",
    color: "#0b2e4a",
  },
  card: {
    padding: "24px",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
  },
  avatarBox: {
    marginBottom: "20px",
  },
  initialAvatar: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    background: "#2e8b57",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "36px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  saveBtn: {
    marginTop: "20px",
  },
};
