"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "@/styles/editprofile.css";

export default function EditProfile() {
  const router = useRouter();
  const fileRef = useRef();

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

  async function loadProfile() {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) return router.push("/");

    const user = userRes.user;

    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (prof) {
      setProfile(prof);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function uploadAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) return;

    const fileName = `avatars/${userRes.user.id}-${Date.now()}.jpg`;

    await supabase.storage.from("avatars").upload(fileName, file, {
      upsert: true,
    });

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const url = data?.publicUrl;

    await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", userRes.user.id);

    setProfile((p) => ({ ...p, avatar_url: url }));
  }

  async function saveProfile() {
    setSaving(true);

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) return;

    const updates = {
      ...profile,
      updated_at: new Date(),
    };

    await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userRes.user.id);

    setSaving(false);
    router.push("/dashboard");
  }

  if (loading)
    return <div style={{ padding: 40 }}>Loading Profile…</div>;

  return (
    <div className="edit-wrap">
      <h1 className="edit-title">Edit Profile</h1>

      <div className="edit-card">
        <div className="edit-left">
          <div className="avatar-container">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">?</div>
            )}
          </div>

          <button
            className="btn-secondary"
            onClick={() => fileRef.current.click()}
          >
            Change Photo
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={uploadAvatar}
          />
        </div>

        <div className="edit-right">
          <label>Full Name</label>
          <input
            type="text"
            value={profile.full_name}
            onChange={(e) =>
              setProfile({ ...profile, full_name: e.target.value })
            }
          />

          <label>Date of Birth</label>
          <input
            type="date"
            value={profile.dob}
            onChange={(e) =>
              setProfile({ ...profile, dob: e.target.value })
            }
          />

          <label>Gender</label>
          <select
            value={profile.gender}
            onChange={(e) =>
              setProfile({ ...profile, gender: e.target.value })
            }
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <label>Church / Ministry</label>
          <input
            type="text"
            value={profile.church}
            onChange={(e) =>
              setProfile({ ...profile, church: e.target.value })
            }
          />

          <label>About</label>
          <textarea
            rows="3"
            value={profile.about}
            onChange={(e) =>
              setProfile({ ...profile, about: e.target.value })
            }
          />

          <label>Faith Journey</label>
          <textarea
            rows="4"
            value={profile.faith_journey}
            onChange={(e) =>
              setProfile({ ...profile, faith_journey: e.target.value })
            }
          />

          <div className="actions">
            <button className="btn-secondary" onClick={() => router.push("/dashboard")}>
              Cancel
            </button>

            <button
              className="btn-primary"
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
