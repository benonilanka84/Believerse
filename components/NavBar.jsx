"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/supabase";

export default function NavBar() {
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  async function loadUserProfile() {
    const { data } = await supabase.auth.getUser();
    const currentUser = data?.user;
    setUser(currentUser || null);

    if (currentUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("id", currentUser.id)
        .single();

      if (profile?.avatar_url) {
        setAvatar(profile.avatar_url);
      } else {
        setAvatar(null);
      }
    }
  }

  useEffect(() => {
    loadUserProfile();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadUserProfile();
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  function getInitial() {
    return (user?.email || "U").charAt(0).toUpperCase();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header style={{
      background: "rgba(255,255,255,0.95)",
      padding: "12px 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      marginBottom: "16px"
    }}>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <img
            src="/images/final-logo.png"
            alt="The Believerse Logo"
            style={{ height: "40px", width: "auto" }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span style={{ fontSize: "20px", fontWeight: "bold", color: "#0b2e4a" }}>
            The <span style={{ color: "#d4af37" }}>B</span>elievers<span style={{ color: "#2e8b57" }}>e</span>
          </span>
        </Link>
      </div>

      <nav style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#0b2e4a", fontWeight: "500" }}>🏠 The Walk</Link>
        <Link href="/glimpses" style={{ textDecoration: "none", color: "#0b2e4a", fontWeight: "500" }}>⚡ Glimpses</Link>
        <Link href="/fellowships" style={{ textDecoration: "none", color: "#0b2e4a", fontWeight: "500" }}>👥 Fellowships</Link>
        <Link href="/believers" style={{ textDecoration: "none", color: "#0b2e4a", fontWeight: "500" }}>🤝 Believers</Link>
        <Link href="/prayer" style={{ textDecoration: "none", color: "#0b2e4a", fontWeight: "500" }}>🙏 Prayer</Link>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer" }} title="Notifications">🔔</button>
        <button style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer" }} title="Search">🔍</button>

        {user ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #ddd", cursor: "pointer",
                background: avatar ? `url(${avatar}) center/cover` : "#1d3557",
                color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold"
              }}
            >
              {!avatar && getInitial()}
            </button>

            {dropdownOpen && (
              <div style={{
                position: "absolute", right: 0, marginTop: "8px", width: "200px", background: "#fff",
                borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", padding: "8px", zIndex: 1000
              }}>
                <Link href="/profile/edit" style={{ display: "block", padding: "10px", textDecoration: "none", color: "#333", borderRadius: "6px" }}>Edit Profile</Link>
                <Link href="/settings" style={{ display: "block", padding: "10px", textDecoration: "none", color: "#333", borderRadius: "6px" }}>Settings</Link>
                <Link href="/terms" style={{ display: "block", padding: "10px", textDecoration: "none", color: "#333", borderRadius: "6px" }}>Terms & Conditions</Link>
                <Link href="/about" style={{ display: "block", padding: "10px", textDecoration: "none", color: "#333", borderRadius: "6px" }}>About</Link>
                <hr style={{ margin: "8px 0", border: "none", borderTop: "1px solid #eee" }} />
                <button onClick={handleLogout} style={{ width: "100%", padding: "10px", background: "transparent", border: "none", textAlign: "left", color: "red", cursor: "pointer", borderRadius: "6px" }}>Log Out</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href="/" style={{ textDecoration: "none", color: "#2d6be3" }}>Sign in</Link>
            <Link href="/signup" style={{ padding: "8px 16px", background: "#2e8b57", color: "white", borderRadius: "8px", textDecoration: "none" }}>Join Us</Link>
          </div>
        )}
      </div>
    </header>
  );
}