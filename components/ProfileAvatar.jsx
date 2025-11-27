// /components/ProfileAvatar.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfileAvatar() {
  const router = useRouter();
  const fileRef = useRef();
  const menuRef = useRef();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [open, setOpen] = useState(false);

  // -------------------------------------------------------------------
  // Load Authenticated User
  // -------------------------------------------------------------------
  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      if (data?.user) {
        setUser(data.user);
        loadProfile(data.user.id);
      }
    }
    loadUser();
  }, []);

  // -------------------------------------------------------------------
  // Load Profile Row
  // -------------------------------------------------------------------
  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      setAvatarUrl(data.avatar_url || null);
    }
  }

  // -------------------------------------------------------------------
  // Calculate Initials
  // -------------------------------------------------------------------
  function getInitials() {
    if (!profile?.full_name) return (user?.email?.[0] || "U").toUpperCase();

    const parts = profile.full_name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts[parts.length - 1]?.[0] || "";
    return (first + last).toUpperCase();
  }

  // -------------------------------------------------------------------
  // Upload Avatar to Supabase Storage
  // -------------------------------------------------------------------
  async function uploadAvatar(file) {
    if (!user) return;

    const fileName = `${user.id}-${Date.now()}-${file.name}`;
    const filePath = `avatars/${fileName}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (error) {
      alert("Avatar upload failed.");
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl;

    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

    setAvatarUrl(publicUrl);
    setOpen(false);
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
  }

  // -------------------------------------------------------------------
  // LOG OUT
  // -------------------------------------------------------------------
  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  // -------------------------------------------------------------------
  // Close menu on outside click
  // -------------------------------------------------------------------
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // -------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------
  return (
    <div className="avatar-wrapper" ref={menuRef}>
      <button
        className="avatar-btn"
        onClick={() => setOpen(!open)}
        style={{
          background: avatarUrl ? `url(${avatarUrl}) center/cover` : "#002b54",
        }}
      >
        {!avatarUrl && getInitials()}
      </button>

      {open && (
        <div className="avatar-menu">
          <button onClick={() => fileRef.current.click()}>Upload Photo</button>

          <button onClick={() => router.push(`/profile/${user?.id}/edit`)}>
            Edit Profile
          </button>

          <button onClick={() => router.push("/settings")}>Settings</button>

          <button onClick={() => router.push("/terms")}>
            Terms & Conditions
          </button>

          <hr />

          <button className="logout-btn" onClick={signOut}>
            Log Out
          </button>

          <input
            type="file"
            ref={fileRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={onFileChange}
          />
        </div>
      )}
    </div>
  );
}
