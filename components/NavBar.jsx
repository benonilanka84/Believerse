"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Data States
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // UI States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Refs for click-outside detection
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        fetchProfile(data.user.id);
        fetchNotifications(data.user.id);
        
        // Real-time subscription for new notifications
        const channel = supabase
          .channel('realtime:notifications')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${data.user.id}` }, 
            (payload) => {
              setNotifications(prev => [payload.new, ...prev]);
            }
          )
          .subscribe();

        return () => supabase.removeChannel(channel);
      }
    };
    init();

    // Click Outside Listener
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) setProfile(data);
  }

  async function fetchNotifications(uid) {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .eq("is_read", false)
      .order("created_at", { ascending: false });
    
    if (data) setNotifications(data);
  }

  // --- 2. HANDLERS ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    // FIX: Redirect to Home Page (/) instead of /login to prevent 404
    window.location.href = "/"; 
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleNotificationClick = async (notif) => {
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
    if (notif.link) router.push(notif.link);
    setIsNotifOpen(false);
  };

  const handleClearAllNotifications = async () => {
    setNotifications([]); 
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
  };

  // Hide on Auth pages
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
      
      {/* 1. LEFT: LOGO & BRANDING */}
      <Link href="/dashboard" style={{ textDecoration: 'none', display: "flex", alignItems: "center", gap: "12px" }}>
        <img src="/images/final-logo.png" alt="Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} />
        {/* Fallback if image fails */}
        <div style={{ display: 'none', width: 40, height: 40, background: "#fff9c4", borderRadius: "50%", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#d4af37", border: "2px solid #d4af37", fontSize: "18px" }}>Be</div>

        <div style={{ fontSize: "22px", fontFamily: "sans-serif" }}>
          <span style={{ color: "#0b2e4a", fontWeight: "bold" }}>The </span>
          <span style={{ color: "#d4af37", fontWeight: "bold" }}>B</span>
          <span style={{ color: "#0b2e4a", fontWeight: "bold" }}>elievers</span>
          <span style={{ color: "#2e8b57", fontWeight: "bold" }}>e</span>
        </div>
      </Link>

      {/* 2. CENTER: NAVIGATION LINKS */}
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
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        
        {/* UPGRADE BUTTON */}
        <Link href="/pricing">
          <button style={{ 
            background: "white", 
            border: "2px solid #d4af37", 
            color: "#d4af37", 
            padding: "6px 16px", 
            borderRadius: "20px", 
            fontWeight: "bold", 
            cursor: "pointer", 
            fontSize: "13px",
            display: "flex", alignItems: "center", gap: "6px",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#d4af37"; e.currentTarget.style.color = "white"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#d4af37"; }}
          >
            <span>👑</span> Upgrade
          </button>
        </Link>

        {/* SEEK (SEARCH) */}
        <div ref={searchRef} style={{ position: "relative" }}>
          {isSearchOpen ? (
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: '20px', padding: '5px 10px' }}>
              <input 
                type="text" 
                autoFocus
                placeholder="Seek..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '120px', color:'#333' }}
              />
              <button type="submit" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🔍</button>
            </form>
          ) : (
            <div onClick={() => setIsSearchOpen(true)} style={{ fontSize: "20px", cursor: "pointer", color: "#0b2e4a", padding:'5px' }} title="Seek">
              🔍
            </div>
          )}
        </div>
        
        {/* NOTIFICATIONS */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <div onClick={() => setIsNotifOpen(!isNotifOpen)} style={{ position: "relative", cursor: "pointer", padding:'5px' }}>
            <span style={{ fontSize: "22px", color: "#0b2e4a" }}>🔔</span>
            {notifications.length > 0 && (
              <div style={{ position: "absolute", top: 0, right: 0, background: "#e74c3c", color: "white", fontSize: "10px", width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", border: "2px solid white" }}>
                {notifications.length}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div style={{ position: "absolute", right: -60, top: "50px", background: "white", border: "1px solid #eee", borderRadius: "12px", boxShadow: "0 5px 20px rgba(0,0,0,0.15)", width: "300px", overflow: "hidden", zIndex: 1002 }}>
              <div style={{ padding: "12px 15px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f9fa" }}>
                <span style={{ fontWeight: "bold", fontSize: "13px", color: "#333" }}>Notifications</span>
                {notifications.length > 0 && (
                  <button onClick={handleClearAllNotifications} style={{ background: "none", border: "none", color: "#2d6be3", fontSize: "11px", cursor: "pointer", fontWeight: "600" }}>Clear All</button>
                )}
              </div>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "13px" }}>No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} onClick={() => handleNotificationClick(n)} style={{ padding: "12px 15px", borderBottom: "1px solid #f5f5f5", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f0f8ff"} onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
                      <div style={{ fontSize: "13px", color: "#333", lineHeight: "1.4" }}>{n.content}</div>
                      <div style={{ fontSize: "10px", color: "#888", marginTop: "4px" }}>{new Date(n.created_at).toLocaleDateString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* PROFILE AVATAR */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <div onClick={() => setIsProfileOpen(!isProfileOpen)} style={{ cursor: "pointer", width: 40, height: 40, borderRadius: "50%", border: "2px solid #eee", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b2e4a", color: "white", fontWeight: "bold", fontSize: "16px" }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              user?.email?.charAt(0).toUpperCase() || "B"
            )}
          </div>

          {/* Profile Menu */}
          {isProfileOpen && (
            <div style={{ position: "absolute", right: 0, top: "55px", background: "white", border: "1px solid #eee", borderRadius: "12px", boxShadow: "0 5px 20px rgba(0,0,0,0.15)", width: "220px", overflow: "hidden", zIndex: 1002 }}>
              <div style={{ padding: "15px", borderBottom: "1px solid #eee", background: "#fafafa" }}>
                <div style={{ fontWeight: "bold", color: "#0b2e4a", fontSize: "14px" }}>{profile?.full_name || "Believer"}</div>
                <div style={{ fontSize: "11px", color: "#777", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
              </div>
              
              <div style={{ padding: "5px 0" }}>
                {/* FIX: Link to /profile/edit explicitly */}
                <Link href="/profile/edit" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 15px", textDecoration: "none", color: "#444", fontSize: "13px" }} onClick={() => setIsProfileOpen(false)}>
                  <span>✏️</span> Edit Profile
                </Link>
                <Link href="/settings" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 15px", textDecoration: "none", color: "#444", fontSize: "13px" }} onClick={() => setIsProfileOpen(false)}>
                  <span>⚙️</span> Settings
                </Link>
                <Link href="/terms" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 15px", textDecoration: "none", color: "#444", fontSize: "13px" }} onClick={() => setIsProfileOpen(false)}>
                  <span>📜</span> Terms & Conditions
                </Link>
                <Link href="/about" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 15px", textDecoration: "none", color: "#444", fontSize: "13px" }} onClick={() => setIsProfileOpen(false)}>
                  <span>ℹ️</span> About
                </Link>
                {profile?.role === 'admin' && (
                  <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 15px", textDecoration: "none", color: "#d32f2f", fontSize: "13px", fontWeight: "bold", background: "#fff5f5" }} onClick={() => setIsProfileOpen(false)}>
                    <span>🛡️</span> Admin Panel
                  </Link>
                )}
              </div>

              <div style={{ borderTop: "1px solid #eee", padding: "5px 0" }}>
                <div onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 15px", cursor: "pointer", color: "#e74c3c", fontSize: "13px", fontWeight: "600" }}>
                  <span>🚪</span> Sign Out
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      <style jsx>{`@media (max-width: 1024px) { .nav-links { display: none !important; } }`}</style>
    </nav>
  );
}