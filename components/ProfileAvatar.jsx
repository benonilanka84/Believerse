"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfileAvatar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    supabase.auth.getUser().then(async (res) => {
      if (res.data.user) {
        setUser(res.data.user);
        await loadProfile(res.data.user);
      }
    });
  }, []);

  async function loadProfile(u) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", u.id)
      .single();

    setProfile(data);
  }

  function getInitials() {
    const name = profile?.full_name || user?.email || "U";
    return name.charAt(0).toUpperCase();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div style={{ position: "relative" }}>
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

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: 8,
            width: 200,
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 5px 16px rgba(0,0,0,0.15)",
            padding: 10,
            zIndex: 999,
          }}
        >
          <button onClick={() => router.push("/profile/edit")} className="menu-btn">
            Edit Profile
          </button>

          <button onClick={() => router.push("/settings")} className="menu-btn">
            Settings
          </button>

          <button onClick={() => router.push("/terms")} className="menu-btn">
            Terms & Conditions
          </button>

          <hr />

          <button onClick={signOut} style={{ color: "#c00" }} className="menu-btn">
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
