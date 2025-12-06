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

  // Load profile
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
          console.log("Loaded profile:", data);
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

  // Upload avatar
  async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      console.log("Starting upload:", fileName);

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldFileName = profile.avatar_url.split('/').pop().split('?')[0];
        console.log("Removing old avatar:", oldFileName);
        await supabase.storage.from("avatars").remove([oldFileName]);
      }

      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("Upload failed: " + uploadError.message);
        return;
      }

      console.log("Upload successful:", uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicURL = urlData?.publicUrl;
      
      if (!publicURL) {
        alert("Failed to get public URL");
        return;
      }

      console.log("Public URL:", publicURL);

      // Update local state immediately
      setProfile((p) => ({ ...p, avatar_url: publicURL }));

      // Update database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicURL,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Database update error:", updateError);
        alert("Failed to update profile: " + updateError.message);
        return;
      }

      console.log("Avatar updated successfully in database");
      alert("✅ Avatar updated successfully!");

      // Reload the page to refresh avatar everywhere
      window.location.reload();

    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Unexpected error: " + err.message);
    }
  }

  // Save profile
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

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        console.error("saveProfile error", error);
        alert("Save failed: " + error.message);
        return;
      }

      alert("✅ Profile saved successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Unexpected error while saving profile.");
    }
  }

  if (loading) {
    return <p style={{ padding: "40px" }}>Loading Profile...</p>;
  }

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "20px", color: "#0b2e4a" }}>
        Edit Profile
      </h1>

      <div style={{ background: "#ffffff", padding: "30px", borderRadius: "16px", boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}>
        
        {/* Avatar */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src={profile.avatar_url || "/images/default-avatar.png"}
            alt="Avatar"
            width={120}
            height={120}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              background: "#eee",
              boxShadow: "0 6px 16px rgba(0,0,0,0.15)"
            }}
            onError={(e) => {
              console.error("Image failed to load:", profile.avatar_url);
              e.target.src = "/images/default-avatar.png";
            }}
          />

          <br />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              marginTop: "10px",
              padding: "6px 16px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: "#f5f5f5",
              cursor: "pointer"
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
        <label style={{ display: "block", marginBottom: "6px", marginTop: "10px", fontWeight: 600, color: "#0b2e4a", fontSize: "14px" }}>
          Full Name
        </label>
        <input
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d0d7e2", marginBottom: "12px", fontSize: "14px" }}
          value={profile.full_name}
          onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
          placeholder="Your full name"
        />

        {/* DOB */}
        <label style={{ display: "block", marginBottom: "6px", marginTop: "10px", fontWeight: 600, color: "#0b2e4a", fontSize: "14px" }}>
          Date of Birth
        </label>
        <input
          type="date"
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d0d7e2", marginBottom: "12px", fontSize: "14px" }}
          value={profile.dob || ""}
          onChange={(e) => setProfile((p) => ({ ...p, dob: e.target.value }))}
        />

        {/* Gender */}
        <label style={{ display: "block", marginBottom: "6px", marginTop: "10px", fontWeight: 600, color: "#0b2e4a", fontSize: "14px" }}>
          Gender
        </label>
        <select
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d0d7e2", marginBottom: "12px", fontSize: "14px" }}
          value={profile.gender || ""}
          onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
        >
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not">Prefer not to say</option>
        </select>

        {/* Church */}
        <label style={{ display: "block", marginBottom: "6px", marginTop: "10px", fontWeight: 600, color: "#0b2e4a", fontSize: "14px" }}>
          Church / Ministry
        </label>
        <input
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d0d7e2", marginBottom: "12px", fontSize: "14px" }}
          value={profile.church}
          onChange={(e) => setProfile((p) => ({ ...p, church: e.target.value }))}
          placeholder="Church / Ministry name"
        />

        {/* About */}
        <label style={{ display: "block", marginBottom: "6px", marginTop: "10px", fontWeight: 600, color: "#0b2e4a", fontSize: "14px" }}>
          About
        </label>
        <textarea
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d0d7e2", marginBottom: "12px", fontSize: "14px", minHeight: "90px", resize: "vertical" }}
          value={profile.about}
          onChange={(e) => setProfile((p) => ({ ...p, about: e.target.value }))}
          placeholder="Short bio"
        />

        {/* Faith Journey */}
        <label style={{ display: "block", marginBottom: "6px", marginTop: "10px", fontWeight: 600, color: "#0b2e4a", fontSize: "14px" }}>
          Faith Journey
        </label>
        <textarea
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d0d7e2", marginBottom: "12px", fontSize: "14px", minHeight: "90px", resize: "vertical" }}
          value={profile.faith_journey}
          onChange={(e) => setProfile((p) => ({ ...p, faith_journey: e.target.value }))}
          placeholder="Share a brief testimony or faith journey"
        />

        {/* Buttons */}
        <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              background: "#f5f5f5",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={saveProfile}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              background: "#2e8b57",
              border: "none",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              marginLeft: "auto",
              minWidth: "120px"
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}