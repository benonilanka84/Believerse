"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";

export default function ProfileAvatar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      const u = data?.user || null;
      setUser(u);

      if (u) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", u.id)
          .single();

        if (prof) setProfile(prof);
      }
    }
    load();
  }, []);

  function getInitials() {
    const name = profile?.full_name || user?.email || "";
    return name.charAt(0).toUpperCase();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: profile?.avatar_url
            ? `url(${profile.avatar_url}) center/cover`
            : "#1d3557",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {!profile?.avatar_url && getInitials()}
      </button>

      {open && (
        <div className="avatar-menu">
          <button
            className="menu-btn"
            onClick={() => router.push("/profile/edit")}
          >
            Edit Profile
          </button>

          <button
            className="menu-btn"
            onClick={() => router.push("/settings")}
          >
            Settings
          </button>

          <button
            className="menu-btn"
            onClick={() => router.push("/terms")}
          >
            Terms & Conditions
          </button>

          <hr />

          <button className="menu-btn" style={{ color: "red" }} onClick={logout}>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
