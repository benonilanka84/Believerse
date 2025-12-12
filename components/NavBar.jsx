"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();
        setProfile(profileData);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/login");
  };

  // Hide Navbar on Auth pages
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
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      padding: "10px 30px", 
      background: "white", 
      borderBottom: "1px solid #eaeaea", 
      position: "sticky", 
      top: 0, 
      zIndex: 1000,
      height: "65px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
    }}>
      
      {/* 1. ORIGINAL LOGO */}
      <Link href="/dashboard" style={{ textDecoration: 'none', display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: 38, height: 38, background: "#fff9c4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#d4af37", border: "2px solid #d4af37", fontSize: "16px" }}>Be</div>
        <span style={{ fontSize: "20px", fontWeight: "bold", color: "#0b2e4a", letterSpacing: '-0.5px' }}>
          The <span style={{ color: "#d4af37" }}>Believer</span>se
        </span>
      </Link>

      {/* 2. CENTER LINKS */}
      <div className="nav-links" style={{ display: "flex", gap: "25px" }}>
        {navLinks.map((link) => (
          <Link 
            key={link.name} 
            href={link.href} 
            style={{ 
              textDecoration: "none", 
              color: pathname === link.href ? "#2e8b57" : "#666", 
              fontWeight: pathname === link.href ? "700" : "500",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s"
            }}
          >
            <span>{link.icon}</span> {link.name}
          </Link>
        ))}
      </div>

      {/* 3. RIGHT ACTIONS */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        
        {/* UPGRADE BUTTON (Restored) */}
        <Link href="/pricing">
          <button style={{ 
            background: "linear-gradient(135deg, #d4af37 0%, #f1c40f 100%)", 
            color: "white", 
            border: "none", 
            padding: "8px 18px", 
            borderRadius: "20px", 
            fontWeight: "bold", 
            cursor: "pointer", 
            fontSize: "12px",
            boxShadow: "0 4px 10px rgba(212, 175, 55, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "5px"
          }}>
            👑 Upgrade
          </button>
        </Link>

        {/* ICONS */}
        <span style={{ fontSize: "18px", cursor: "pointer", color: "#555" }}>🔍</span>
        
        <div style={{ position: "relative", cursor: "pointer" }}>
          <span style={{ fontSize: "20px", color: "#555" }}>🔔</span>
          <div style={{ position: "absolute", top: -2, right: -2, background: "#e74c3c", color: "white", fontSize: "9px", width: 14, height: 14, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>3</div>
        </div>

        {/* PROFILE AVATAR */}
        <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid #eee" }} />
          ) : (
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#0b2e4a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          )}

          {/* DROPDOWN MENU */}
          {isMenuOpen && (
            <div style={{ position: "absolute", right: 0, top: "50px", background: "white", border: "1px solid #eee", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", width: "180px", overflow: "hidden", zIndex: 1001 }}>
              <div style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
                <div style={{ fontWeight: "bold", color: "#0b2e4a", fontSize: "14px" }}>{profile?.full_name || "Believer"}</div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{user?.email}</div>
              </div>
              <Link href="/profile" style={{ display: "block", padding: "12px 15px", textDecoration: "none", color: "#444", fontSize: "13px", borderBottom: "1px solid #f9f9f9" }}>👤 Profile</Link>
              <Link href="/settings" style={{ display: "block", padding: "12px 15px", textDecoration: "none", color: "#444", fontSize: "13px", borderBottom: "1px solid #f9f9f9" }}>⚙️ Settings</Link>
              
              {profile?.role === 'admin' && (
                <Link href="/admin" style={{ display: "block", padding: "12px 15px", textDecoration: "none", color: "#d32f2f", fontWeight:'bold', fontSize: "13px", background: "#fff5f5" }}>🛡️ Admin Panel</Link>
              )}

              <div onClick={handleLogout} style={{ padding: "12px 15px", cursor: "pointer", color: "#e74c3c", fontSize: "13px", fontWeight: "bold" }}>🚪 Logout</div>
            </div>
          )}
        </div>

      </div>

      {/* MOBILE HIDDEN */}
      <style jsx>{`
        @media (max-width: 900px) {
          .nav-links { display: none !important; }
        }
      `}</style>
    </nav>
  );
}