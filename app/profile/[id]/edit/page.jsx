"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Profile Edit page (client component)
 * - Saves to localStorage under key "believerse_profile_<id>"
 * - Expects route param id (we read from pathname as fallback)
 */

export default function ProfileEditPage({ params }) {
  const router = useRouter();
  const userId = (params && params.id) || typeof window !== "undefined" && window.location.pathname.split("/").pop() || "me";

  const STORAGE_KEY = `believerse_profile_${userId}`;

  const [profile, setProfile] = useState({
    fullName: "",
    dob: "",
    gender: "",
    church: "",
    about: "",
    faithJourney: "",
    avatarDataUrl: "", // base64 preview
  });

  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // load existing profile from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setProfile(JSON.parse(raw));
      } else {
        // attempt to populate initials avatar (no image) if fullName present
        setProfile((p) => ({ ...p }));
      }
    } catch (e) {
      console.error("Failed reading profile", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // helper to compute initials avatar data URL (circle with initials)
  function initialsFromName(name) {
    if (!name || !name.trim()) return "";
    const parts = name.trim().split(/\s+/);
    const initials =
      (parts[0] ? parts[0][0].toUpperCase() : "") +
      (parts.length > 1 ? parts[parts.length - 1][0].toUpperCase() : "");

    // canvas rendering for avatar
    try {
      const size = 128;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#2e8b57"; // green default
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 56px system-ui, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials, size / 2, size / 2 + 2);
      return canvas.toDataURL();
    } catch (e) {
      return "";
    }
  }

  // whenever fullName changes and there is no custom avatar, update avatarDataUrl to initials
  useEffect(() => {
    if (!profile.avatarDataUrl) {
      const initialsDataUrl = initialsFromName(profile.fullName);
      if (initialsDataUrl) {
        setProfile((p) => ({ ...p, avatarDataUrl: initialsDataUrl }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.fullName]);

  function handleChange(field) {
    return (e) => {
      const value = e.target.value;
      setProfile((p) => ({ ...p, [field]: value }));
      setTouched(true);
    };
  }

  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfile((p) => ({ ...p, avatarDataUrl: ev.target.result }));
      setTouched(true);
    };
    reader.readAsDataURL(file);
  }

  function validate() {
    // require fullName and email is not here; so require full name at least
    return profile.fullName && profile.fullName.trim().length >= 2;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validate()) {
      alert("Please provide your full name (2+ characters).");
      return;
    }
    setSaving(true);
    try {
      // Simulate server save; here we persist to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      // small delay to mimic server
      await new Promise((r) => setTimeout(r, 350));
      setSaving(false);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setSaving(false);
      alert("Unable to save profile. Check console.");
    }
  }

  function handleCancel(e) {
    e.preventDefault();
    router.push("/dashboard");
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 18 }}>Edit Profile</h1>

      <div style={{
        maxWidth: 720,
        background: "rgba(255,255,255,0.95)",
        padding: 22,
        borderRadius: 12,
        boxShadow: "0 12px 30px rgba(0,0,0,0.25)"
      }}>
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ width: 128 }}>
            <div style={{
              width: 128, height: 128, borderRadius: 999,
              overflow: "hidden", background: "#eee", display: "flex",
              alignItems: "center", justifyContent: "center", boxShadow: "0 6px 14px rgba(0,0,0,0.12)"
            }}>
              {profile.avatarDataUrl ? (
                <img src={profile.avatarDataUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{
                  width: "100%", height: "100%", display: "flex",
                  alignItems: "center", justifyContent: "center", color: "#fff",
                  fontWeight: "700", fontSize: 44, background: "#2e8b57"
                }}>
                  { (profile.fullName || "").split(/\s+/).filter(Boolean).map(n => n[0].toUpperCase()).slice(0,2).join("") || "?" }
                </div>
              )}
            </div>

            <div style={{ marginTop: 10 }}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Full name</label>
            <input
              type="text"
              value={profile.fullName}
              onChange={handleChange("fullName")}
              placeholder="Full name"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 6,
                border: "1px solid #d9dfe6", marginBottom: 12
              }}
            />

            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Date of birth</label>
            <input
              type="date"
              value={profile.dob}
              onChange={handleChange("dob")}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d9dfe6", marginBottom: 12 }}
            />

            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Gender</label>
            <select value={profile.gender} onChange={handleChange("gender")} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d9dfe6", marginBottom: 12 }}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not">Prefer not to say</option>
            </select>

            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Church / Ministry</label>
            <input type="text" value={profile.church} onChange={handleChange("church")} placeholder="Church / Ministry name" style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d9dfe6", marginBottom: 12 }} />

            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>About</label>
            <textarea value={profile.about} onChange={handleChange("about")} rows={3} placeholder="Short bio" style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d9dfe6", marginBottom: 12 }} />

            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Faith journey</label>
            <textarea value={profile.faithJourney} onChange={handleChange("faithJourney")} rows={4} placeholder="Share a brief testimony or faith journey" style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d9dfe6", marginBottom: 12 }} />

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCancel} style={{ padding: "10px 18px", borderRadius: 8, background: "#f1f1f1", border: "1px solid #ddd", cursor: "pointer" }}>
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={!validate() || saving}
                style={{
                  padding: "10px 18px", borderRadius: 8,
                  background: (!validate() || saving) ? "#8abf9a" : "#2e8b57",
                  color: "#fff", border: "none", cursor: (!validate() || saving) ? "not-allowed" : "pointer",
                  marginLeft: "auto"
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
