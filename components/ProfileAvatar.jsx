"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfileAvatar({ user: passedUser }) {
  const router = useRouter();
  const [user, setUser] = useState(passedUser || null);
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);

  // --------------------------------------------------
  // LOAD USER
  // --------------------------------------------------
  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        await loadProfile(data.user);
      }
    }

    if (!passedUser) load();
    else {
      setUser(passedUser);
      loadProfile(passedUser);
    }
  }, [passedUser]);

  // --------------------------------------------------
  // LOAD PROFILE FROM SUPABASE
  // --------------------------------------------------
  async function loadProfile(u) {
    if (!u) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", u.id)
      .single();

    if (!error) setProfile(data);
  }

  // --------------------------------------------------
  // INITIALS FALLBACK
  // --------------------------------------------------
  function getInitials() {
    const name = profile?.full_name || user?.email || "U";
    return name.charAt(0).toUpperCase();
  }

  // --------------------------------------------------
  // LOG OUT
  // --------------------------------------------------
  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Avatar circle */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: profile?.avatar_url
            ? `url(${profile.avatar_url}) center/cover`
            : "#113",
          color: "#fff",
          border: "none",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {!profile?.avatar_url && getInitials()}
      </button>

      {/* DROPDOWN MENU */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "52px",
            right: 0,
            width: 180,
            padding: 8,
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            zIndex: 1000,
          }}
        >
          <button
            onClick={() => {
              setOpen(false);
              router.push("/profile/edit");
            }}
            style={menuItemStyle}
          >
            Edit Profile
          </button>

          <button
            onClick={() => {
              setOpen(false);
              router.push("/settings");
            }}
            style={menuItemStyle}
          >
            Settings
          </button>

          <button
            onClick={() => {
              setOpen(false);
              router.push("/terms");
            }}
            style={menuItemStyle}
          >
            Terms & Conditions
          </button>

          <hr style={{ margin: "8px 0", borderColor: "#eee" }} />

          <button
            onClick={signOut}
            style={{ ...menuItemStyle, color: "#c00" }}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}

// Shared style for dropdown items
const menuItemStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "8px 10px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "15px",
};
