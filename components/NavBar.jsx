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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // NEW: Real-time Message Badge State
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const profileRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        fetchProfile(data.user.id);
        setupMessageListener(data.user.id); // Start listening for messages
      }
    };
    init();

    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) setProfile(data);
  }

  // REAL-TIME MESSAGE LISTENER
  function setupMessageListener(userId) {
    const channel = supabase
      .channel('navbar_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `receiver_id=eq.${userId}` 
      }, () => {
        // If we aren't currently on the chat page, show the badge
        if (window.location.pathname !== '/chat') {
          setHasUnreadMessages(true);
        }
      })
      .subscribe();
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/"; 
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
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
      
      {/* LEFT: LOGO */}
      <Link href="/dashboard" style={{ textDecoration: 'none', display: "flex", alignItems: "center", gap: "12px" }}>
        <img src="/images/final-logo.png" alt="Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        <div style={{ fontSize: "22px", fontFamily: "sans-serif" }}>
          <span style={{ color: "#0b2e4a", fontWeight: "bold" }}>The </span>
          <span style={{ color: "#d4af37", fontWeight: "bold" }}>B</span>
          <span style={{ color: "#0b2e4a", fontWeight: "bold" }}>elievers</span>
          <span style={{ color: "#2e8b57", fontWeight: "bold" }}>e</span>
        </div>
      </Link>

      {/* CENTER: NAV LINKS */}
      <div className="nav-links" style={{ display: "flex", gap: "25px" }}>
        {navLinks.map((link) => (
          <Link key={link.name} href={link.href} style={{ 
            textDecoration: "none", color: pathname === link.href ? "#2e8b57" : "#555", 
            fontWeight: pathname === link.href ? "800" : "500", fontSize: "15px", 
            display: "flex", alignItems: "center", gap: "6px",
            borderBottom: pathname === link.href ? "3px solid #2e8b57" : "3px solid transparent",
            padding: "21px 0"
          }}>
            <span>{link.icon}</span> {link.name}
          </Link>
        ))}
      </div>

      {/* RIGHT: ACTIONS */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        
        {/* MESSENGER ICON WITH REAL-TIME BADGE */}
        <Link href="/chat" onClick={() => setHasUnreadMessages(false)} style={{ position: 'relative', fontSize: "22px", textDecoration: 'none' }} title="Messenger">
          💬
          {hasUnreadMessages && (
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '10px', height: '100px', background: 'red', borderRadius: '50%', border: '2px solid white', width: 10, height: 10 }}></span>
          )}
        </Link>

        {/* ACTIVITY NOTIFICATIONS (Amen, Bless, etc.) */}
        <Notifications />

        {/* SEEK (SEARCH) */}
        <div ref={searchRef} style={{ position: "relative" }}>
          {isSearchOpen ? (
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: '20px', padding: '5px 10px' }}>
              <input type="text" autoFocus placeholder="Seek..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100px' }} />
            </form>
          ) : (
            <div onClick={() => setIsSearchOpen(true)} style={{ fontSize: "20px", cursor: "pointer" }}>🔍</div>
          )}
        </div>
        
        {/* PROFILE */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <div onClick={() => setIsProfileOpen(!isProfileOpen)} style={{ cursor: "pointer", width: 38, height: 38, borderRadius: "50%", border: "2px solid #eee", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b2e4a", color: "white" }}>
            {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user?.email?.charAt(0).toUpperCase()}
          </div>

          {isProfileOpen && (
            <div style={{ position: "absolute", right: 0, top: "50px", background: "white", border: "1px solid #eee", borderRadius: "12px", boxShadow: "0 5px 20px rgba(0,0,0,0.1)", width: "200px", zIndex: 1002 }}>
              <div style={{ padding: "12px", borderBottom: "1px solid #eee", fontWeight: "bold", fontSize: "14px" }}>{profile?.full_name}</div>
              <Link href="/profile/edit" style={{ display: "block", padding: "10px 15px", textDecoration: "none", color: "#444", fontSize: "13px" }}>Edit Profile</Link>
              <div onClick={handleLogout} style={{ padding: "10px 15px", cursor: "pointer", color: "red", fontSize: "13px", borderTop: "1px solid #eee" }}>Sign Out</div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}