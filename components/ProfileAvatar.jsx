"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";

export default function ProfileAvatar({ user: initialUser }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);

  async function loadProfile(userId) {
    if (!userId) return;
    
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (prof) setProfile(prof);
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      const u = data?.user || null;
      setUser(u);
      if (u) loadProfile(u.id);
    }
    
    load();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      loadProfile(initialUser.id);
    }
  }, [initialUser]);

  // REMOVED the 3-second interval - only refresh on auth changes

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
          border: "2px solid rgba(255,255,255,0.3)",
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