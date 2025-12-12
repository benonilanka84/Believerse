"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/supabase";
import { useRouter } from "next/navigation";

<Link href="/pricing" style={{ textDecoration: 'none', marginRight: '15px' }}>
  <button style={{ 
    background: 'linear-gradient(45deg, #d4af37, #f1c40f)', 
    border: 'none', 
    padding: '8px 16px', 
    borderRadius: '20px', 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: '13px', 
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(212, 175, 55, 0.3)' 
  }}>
    👑 Upgrade
  </button>
</Link>

export default function NavBar() {
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const router = useRouter();

  async function loadUserProfile() {
    const { data } = await supabase.auth.getUser();
    const currentUser = data?.user;
    setUser(currentUser || null);

    if (currentUser) {
      const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", currentUser.id).single();
      setAvatar(profile?.avatar_url);
      loadNotifications(currentUser.id);
    }
  }

  async function loadNotifications(userId) {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  }

  async function handleClearAll() {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setUnreadCount(0);
    loadNotifications(user.id);
  }

  async function handleNotificationClick(n) {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      setUnreadCount(c => Math.max(0, c - 1));
    }
    setNotifOpen(false);
    if (n.link) router.push(n.link);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push("/believers"); 
      setSearchOpen(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  useEffect(() => { loadUserProfile(); }, []);

  return (
    <header style={{ background: "rgba(255,255,255,0.95)", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "16px", position:'relative', zIndex:50 }}>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <img src="/images/final-logo.png" alt="Logo" style={{ height: "40px", width: "auto" }} onError={(e) => { e.target.style.display = 'none'; }} />
          <span style={{ fontSize: "20px", fontWeight: "bold", color: "#0b2e4a" }}>The <span style={{ color: "#d4af37" }}>B</span>elievers<span style={{ color: "#2e8b57" }}>e</span></span>
        </Link>
      </div>

      <nav style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#0b2e4a", fontWeight: "500" }}>🏠 The Walk</Link>
        <Link href="/glimpses" style={{ textDecoration: "none", color: "#0b2e4a", fontWeight: "500" }}>⚡ Glimpses</Link>
        <Link href="/fellowships" style={{ textDecoration: "none", color: "#0b2e4a", fontWeight: "500" }}>👥 Fellowships</Link>
        <Link href="/believers" style={{ textDecoration: "none", color: "#0b2e4a", fontWeight: "500" }}>🤝 Believers</Link>
        <Link href="/prayer" style={{ textDecoration: "none", color: "#0b2e4a", fontWeight: "500" }}>🙏 Prayer</Link>
        <Link href="/bible" style={{ textDecoration: "none", color: "#0b2e4a", fontWeight: "500" }}>📖 Bible</Link>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        
        {/* Search */}
        <div style={{position:'relative'}}>
          <button onClick={() => setSearchOpen(!searchOpen)} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer" }}>🔍</button>
          {searchOpen && (
            <form onSubmit={handleSearchSubmit} style={{ position:'absolute', right:0, top:'40px', background:'white', padding:'10px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', borderRadius:'8px', display:'flex', width:'250px' }}>
              <input autoFocus type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{flex:1, padding:'8px', border:'1px solid #ddd', borderRadius:'4px', color:'#333'}} />
            </form>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setNotifOpen(!notifOpen)} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer" }}>
            🔔
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>
            )}
          </button>
          
          {notifOpen && (
            <div style={{ position: 'absolute', right: 0, top: '40px', width: '320px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '15px', zIndex: 1000, border:'1px solid #ddd' }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:'8px', marginBottom:'10px'}}>
                <h4 style={{ margin: 0, fontSize: '14px', color: '#0b2e4a' }}>Notifications</h4>
                <button onClick={handleClearAll} style={{fontSize:'11px', color:'red', background:'none', border:'none', cursor:'pointer', fontWeight:'bold'}}>Clear All</button>
              </div>
              
              {notifications.length === 0 ? <p style={{ fontSize: '12px', color: '#666' }}>No new notifications.</p> : 
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '13px', color: '#333', cursor:'pointer', background: n.is_read ? 'white' : '#e8f5e9', marginBottom:'2px', borderRadius:'4px' }}
                  >
                    {n.content}
                    <div style={{fontSize:'10px', color:'#888', marginTop:'2px'}}>{new Date(n.created_at).toLocaleDateString()}</div>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* Avatar */}
        {user ? (
          <div style={{ position: "relative" }}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #ddd", cursor: "pointer", background: avatar ? `url(${avatar}) center/cover` : "#1d3557", color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold" }}>
              {!avatar && user.email?.[0]?.toUpperCase()}
            </button>
            {dropdownOpen && (
              <div style={{ position: "absolute", right: 0, marginTop: "8px", width: "200px", background: "#fff", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", padding: "8px", zIndex: 1000, border:'1px solid #ddd' }}>
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