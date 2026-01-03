"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Notifications from "@/components/Notifications"; 

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        setUser(authData.user);
        fetchProfile(authData.user.id);
        
        // --- NEW: Accurate Unread Logic ---
        checkInitialUnread(authData.user.id); 
        setupMessageListener(authData.user.id); 
      }
    };
    init();

    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // NEW: Initial database scan to set the correct dot state on load
  async function checkInitialUnread(userId) {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);
    
    if (!error && count > 0) {
      setHasUnreadMessages(true);
    } else {
      setHasUnreadMessages(false);
    }
  }

  async function fetchProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) setProfile(data);
  }

  function setupMessageListener(userId) {
    const channel = supabase
      .channel('navbar_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `receiver_id=eq.${userId}` 
      }, (payload) => {
        // Only show red dot if we are not currently viewing the chat page
        if (window.location.pathname !== '/chat' && payload.new.is_read === false) {
          setHasUnreadMessages(true);
        }
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/"; 
  };

  if (pathname === "/login" || pathname === "/signup") return null;

  const navLinks = [
    { name: "The Walk", href: "/dashboard", icon: "🏠" },
    { name: "Glimpses", href: "/glimpses", icon: "⚡" },
    { name: "Fellowships", href: "/fellowships", icon: "👥" },
    { name: "Believers", href: "/believers", icon: "🤝" },
    { name: "Prayer", href: "/prayer", icon: "🙏" },
    { name: "Bible", href: "/bible", icon: "📖" },
  ];

  return (
    <nav style={{ 
      display: "flex", alignItems: "center", justifyContent: "space-between", 
      padding: "0 25px", background: "white", borderBottom: "1px solid #e0e0e0", 
      height: "70px", position: "sticky", top: 0, zIndex: 1000, boxShadow: "0 2px 15px rgba(0,0,0,0.03)"
    }}>
      
      {/* 1. LEFT: LOGO */}
      <Link href="/dashboard" style={{ textDecoration: 'none', display: "flex", alignItems: "center", gap: "12px" }}>
        <img src="/images/final-logo.png" alt="Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        <div style={{ fontSize: "22px", fontFamily: "sans-serif" }}>
          <span style={{ color: "#0b2e4a", fontWeight: "bold" }}>The </span>
          <span style={{ color: "#d4af37", fontWeight: "bold" }}>B</span>
          <span style={{ color: "#0b2e4a", fontWeight: "bold" }}>elievers</span>
          <span style={{ color: "#2e8b57", fontWeight: "bold" }}>e</span>
        </div>
      </Link>

      {/* 2. CENTER: NAV LINKS */}
      <div className="nav-links" style={{ display: "flex", gap: "25px" }}>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.name} href={link.href} style={{ 
              textDecoration: "none", 
              color: isActive ? "#2e8b57" : "#555", 
              fontWeight: isActive ? "800" : "500", 
              fontSize: "15px", 
              display: "flex", alignItems: "center", gap: "6px",
              borderBottom: isActive ? "3px solid #2e8b57" : "3px solid transparent",
              padding: "21px 0"
            }}>
              <span>{link.icon}</span> {link.name}
            </Link>
          );
        })}
      </div>

      {/* 3. RIGHT: ACTIONS */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        
        <Link href="/pricing" style={{ textDecoration: "none" }}>
          <button style={{ 
            background: "white", border: "2px solid #d4af37", color: "#d4af37", 
            padding: "6px 16px", borderRadius: "20px", fontWeight: "bold", 
            cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px"
          }}>
            <span>👑</span> Upgrade
          </button>
        </Link>

        {/* MESSENGER with Refined Unread Logic */}
        <Link href="/chat" onClick={() => setHasUnreadMessages(false)} style={{ position: 'relative', fontSize: "22px", textDecoration: 'none' }} title="Messenger">
          💬
          {hasUnreadMessages && (
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '10px', height: '10px', background: 'red', borderRadius: '50%', border: '2px solid white' }}></span>
          )}
        </Link>

        {/* --- LIVE PILL BUTTON --- */}
        <Link href="/live" style={{ textDecoration: "none" }} title="Go Live">
          <div style={{ 
            background: "#e63946", 
            color: "white", 
            padding: "8px 16px", 
            borderRadius: "25px", 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            fontWeight: "900", 
            fontSize: "13px",
            boxShadow: "0 4px 10px rgba(230, 57, 70, 0.25)"
          }}>
            <div style={{ background: 'white', color: '#e63946', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', paddingLeft: '2px' }}>
              ▶
            </div>
            LIVE
          </div>
        </Link>
        
        <Notifications />

        {/* PROFILE AVATAR & DROPDOWN */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <div onClick={() => setIsProfileOpen(!isProfileOpen)} style={{ cursor: "pointer", width: 42, height: 42, borderRadius: "50%", border: "2px solid #f0f4f8", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b2e4a", color: "white", fontWeight: "bold", fontSize: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              user?.email?.charAt(0).toUpperCase() || "B"
            )}
          </div>

          {isProfileOpen && (
            <div style={{ 
              position: "absolute", 
              right: 0, 
              top: "58px", 
              background: "white", 
              border: "1px solid #e5e7eb", 
              borderRadius: "12px", 
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)", 
              minWidth: "280px", 
              overflow: "hidden", 
              zIndex: 2000 
            }}>
              <div style={{ 
                padding: "20px 20px 16px 20px", 
                borderBottom: "1px solid #f3f4f6", 
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)"
              }}>
                <div style={{ fontWeight: "700", color: "#0b2e4a", fontSize: "16px", marginBottom: "6px" }}>
                  {profile?.full_name || "Believer"}
                </div>
                <div style={{ fontSize: "13px", color: "#64748b", wordBreak: "break-word", lineHeight: "1.4" }}>
                  {user?.email}
                </div>
              </div>
              
              <div style={{ padding: "8px 0" }}>
                <Link href="/profile/edit" onClick={() => setIsProfileOpen(false)} style={{ display: "block", padding: "12px 20px", textDecoration: "none", color: "#334155", fontSize: "14px", fontWeight: "500" }}>
                  <span style={{ marginRight: "12px" }}>✏️</span> Edit Profile
                </Link>
                <Link href="/settings" onClick={() => setIsProfileOpen(false)} style={{ display: "block", padding: "12px 20px", textDecoration: "none", color: "#334155", fontSize: "14px", fontWeight: "500" }}>
                  <span style={{ marginRight: "12px" }}>⚙️</span> Settings
                </Link>
                <Link href="/about" onClick={() => setIsProfileOpen(false)} style={{ display: "block", padding: "12px 20px", textDecoration: "none", color: "#334155", fontSize: "14px", fontWeight: "500" }}>
                  <span style={{ marginRight: "12px" }}>ℹ️</span> About Us
                </Link>
                <Link href="/terms" onClick={() => setIsProfileOpen(false)} style={{ display: "block", padding: "12px 20px", textDecoration: "none", color: "#334155", fontSize: "14px", fontWeight: "500" }}>
                  <span style={{ marginRight: "12px" }}>📜</span> Terms & Conditions
                </Link>
                {profile?.role === 'admin' && (
                  <Link href="/admin" onClick={() => setIsProfileOpen(false)} style={{ display: "block", padding: "12px 20px", textDecoration: "none", color: "#dc2626", fontSize: "14px", fontWeight: "600", background: "#fef2f2" }}>
                    <span style={{ marginRight: "12px" }}>🛡️</span> Admin Panel
                  </Link>
                )}
              </div>

              <div style={{ borderTop: "1px solid #f3f4f6", padding: "8px 0" }}>
                <div onClick={handleLogout} style={{ padding: "12px 20px", textDecoration: "none", color: "#dc2626", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                  <span style={{ marginRight: "12px" }}>🚪</span> Sign Out
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}