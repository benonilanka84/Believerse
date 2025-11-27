"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";

export default function ProfileAvatar({ user }) {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);

  // Load profile once (full_name, avatar_url, etc.)
  useEffect(() => {
    if (!user?.id) return;
    loadProfile();
  }, [user]);

  async function loadProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) setProfile(data);
  }

  function getInitials() {
    const full = profile?.full_name || user?.user_metadata?.full_name || "";
    if (!full.trim()) return (user?.email?.charAt(0) || "U").toUpperCase();

    const parts = full.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const avatarUrl = profile?.avatar_url;

  return (
    <div style={{ position: "relative" }}>
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: avatarUrl
            ? `url(${avatarUrl}) center/cover`
            : "#1d3557",
          color: "#fff",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {!avatarUrl && getInitials()}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: 10,
            width: 200,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 5px 18px rgba(0,0,0,0.15)",
            overflow: "hidden",
            zIndex: 500,
          }}
        >
          <button
            onClick={() => { setOpen(false); router.push("/profile/edit"); }}
            className="menu-btn"
          >
            Edit Profile
          </button>

          <button
            onClick={() => { setOpen(false); router.push("/settings"); }}
            className="menu-btn"
          >
            Settings
          </button>

          <button
            onClick={() => { setOpen(false); router.push("/terms"); }}
            className="menu-btn"
          >
            Terms & Conditions
          </button>

          <div style={{ height: 1, background: "#eee" }} />

          <button
            onClick={() => { setOpen(false); signOut(); }}
            className="menu-btn"
            style={{ color: "#c00" }}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
