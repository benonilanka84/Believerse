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

  // Do not show Navbar on login/signup pages
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
      padding: "10px 20px", 
      background: "white", 
      borderBottom: "1px solid #eee", 
      position: "sticky", 
      top: 0, 
      zIndex: 1000,
      height: "60px"
    }}>
      
      {/* LEFT: LOGO */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: 35, height: 35, background: "#f0e68c", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#d4af37", border: "2px solid #d4af37" }}>Be</div>
        <span style={{ fontSize: "18px", fontWeight: "bold", color: "#0b2e4a" }}>
          The <span style={{ color: "#d4af37" }}>Believer</span>se
        </span>
      </div>

      {/* CENTER: LINKS (Desktop) */}
      <div className="nav-links" style={{ display: "flex", gap: "20px" }}>
        {navLinks.map((link) => (
          <Link 
            key={link.name} 
            href={link.href} 
            style={{ 
              textDecoration: "none", 
              color: pathname === link.href ? "#2e8b57" : "#555", 
              fontWeight: pathname === link.href ? "bold" : "normal",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}
          >
            <span>{link.icon}</span> {link.name}
          </Link>
        ))}
      </div>

      {/* RIGHT: ACTIONS */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        
        {/* --- NEW UPGRADE BUTTON --- */}
        <Link href="/pricing">
          <button style={{ 
            background: "linear-gradient(45deg, #d4af37, #f1c40f)", 
            color: "white", 
            border: "none", 
            padding: "6px 14px", 
            borderRadius: "20px", 
            fontWeight: "bold", 
            cursor: "pointer", 
            fontSize: "12px",
            boxShadow: "0 2px 5px rgba(212, 175, 55, 0.4)",
            transition: "transform 0.2s"
          }}>
            👑 Upgrade
          </button>
        </Link>

        {/* SEARCH ICON */}
        <span style={{ fontSize: "18px", cursor: "pointer", color: "#0b2e4a" }}>🔍</span>
        
        {/* NOTIFICATION BELL */}
        <div style={{ position: "relative", cursor: "pointer" }}>
          <span style={{ fontSize: "20px" }}>🔔</span>
          <div style={{ position: "absolute", top: -2, right: -2, background: "red", color: "white", fontSize: "10px", width: 15, height: 15, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>3</div>
        </div>

        {/* PROFILE DROPDOWN */}
        <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} style={{ width: 35, height: 35, borderRadius: "50%", objectFit: "cover", border: "1px solid #ddd" }} />
          ) : (
            <div style={{ width: 35, height: 35, borderRadius: "50%", background: "#0b2e4a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          )}

          {/* DROPDOWN MENU */}
          {isMenuOpen && (
            <div style={{ position: "absolute", right: 0, top: "45px", background: "white", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", width: "150px", overflow: "hidden" }}>
              <Link href="/profile" style={{ display: "block", padding: "10px", textDecoration: "none", color: "#333", fontSize: "13px", borderBottom: "1px solid #eee" }}>👤 Profile</Link>
              <Link href="/settings" style={{ display: "block", padding: "10px", textDecoration: "none", color: "#333", fontSize: "13px", borderBottom: "1px solid #eee" }}>⚙️ Settings</Link>
              
              {/* Show Admin Link if user is admin */}
              {profile?.role === 'admin' && (
                <Link href="/admin" style={{ display: "block", padding: "10px", textDecoration: "none", color: "#d32f2f", fontWeight:'bold', fontSize: "13px", borderBottom: "1px solid #eee" }}>🛡️ Admin Panel</Link>
              )}

              <div onClick={handleLogout} style={{ padding: "10px", cursor: "pointer", color: "red", fontSize: "13px" }}>🚪 Logout</div>
            </div>
          )}
        </div>

      </div>

      {/* MOBILE MENU TOGGLE (Optional, if you have one) */}
      <style jsx>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
        }
      `}</style>
    </nav>
  );
}