"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        // Fetch profile for Name and Avatar
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();
        setProfile(profileData);
      }
    };
    getUser();

    // Close menu when clicking outside
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/login");
  };

  // Helper to get "BL" from "Benoni Lanka"
  const getInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.trim().split(" ");
      if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
      return names[0].substring(0, 2).toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || "B"; // Fallback
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
      padding: "0 30px", background: "white", borderBottom: "1px solid #eaeaea", 
      height: "70px", position: "sticky", top: 0, zIndex: 1000 
    }}>
      
      {/* 1. BRANDING */}
      <Link href="/dashboard" style={{ textDecoration: 'none', display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ 
          width: 40, height: 40, background: "#fff9c4", borderRadius: "50%", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          border: "2px solid #d4af37", fontSize: "18px", fontWeight: "bold", color: "#d4af37" 
        }}>Be</div>
        <span style={{ fontSize: "22px", fontWeight: "800", color: "#0b2e4a", letterSpacing: "-0.5px" }}>
          The <span style={{ color: "#d4af37" }}>Believer</span>se
        </span>
      </Link>

      {/* 2. LINKS */}
      <div className="nav-links" style={{ display: "flex", gap: "30px" }}>
        {navLinks.map((link) => (
          <Link key={link.name} href={link.href} style={{ 
            textDecoration: "none", color: pathname === link.href ? "#2e8b57" : "#555", 
            fontWeight: pathname === link.href ? "700" : "500", fontSize: "15px", 
            display: "flex", alignItems: "center", gap: "6px", padding: "5px 0",
            borderBottom: pathname === link.href ? "2px solid #2e8b57" : "2px solid transparent"
          }}>
            <span>{link.icon}</span> {link.name}
          </Link>
        ))}
      </div>

      {/* 3. ACTIONS & PROFILE */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        
        {/* Upgrade Button */}
        <Link href="/pricing">
          <button style={{ 
            background: "linear-gradient(135deg, #d4af37 0%, #f1c40f 100%)", color: "white", 
            border: "none", padding: "8px 20px", borderRadius: "30px", fontWeight: "bold", 
            cursor: "pointer", fontSize: "13px", boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
            display: "flex", alignItems: "center", gap: "6px"
          }}>
            👑 Upgrade
          </button>
        </Link>

        {/* Icons */}
        <div style={{ position: "relative", cursor: "pointer" }}><span style={{ fontSize: "20px", color: "#555" }}>🔍</span></div>
        <div style={{ position: "relative", cursor: "pointer" }}>
          <span style={{ fontSize: "22px", color: "#555" }}>🔔</span>
          <div style={{ position: "absolute", top: -2, right: -2, background: "#e74c3c", color: "white", fontSize: "10px", width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", border: "2px solid white" }}>3</div>
        </div>

        {/* PROFILE AVATAR & DROPDOWN */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <div onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ cursor: "pointer", width: 42, height: 42, borderRadius: "50%", border: "2px solid #eee", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b2e4a", color: "white", fontWeight: "bold", fontSize: "16px" }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              getInitials()
            )}
          </div>

          {isMenuOpen && (
            <div style={{ 
              position: "absolute", right: 0, top: "55px", background: "white", 
              border: "1px solid #eaeaea", borderRadius: "12px", 
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)", width: "260px", overflow: "hidden", zIndex: 1001 
            }}>
              {/* Menu Header */}
              <div style={{ padding: "20px", borderBottom: "1px solid #f5f5f5", background: "#fafafa" }}>
                <div style={{ fontWeight: "700", color: "#0b2e4a", fontSize: "16px" }}>{profile?.full_name || "Believer"}</div>
                <div style={{ fontSize: "13px", color: "#888", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
              </div>

              {/* Menu Items */}
              <div style={{ padding: "8px" }}>
                <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", textDecoration: "none", color: "#444", fontSize: "14px", borderRadius: "8px", transition: "background 0.2s" }} onMouseEnter={(e) => e.target.style.background = "#f9f9f9"} onMouseLeave={(e) => e.target.style.background = "transparent"}>
                  <span>👤</span> Edit Profile
                </Link>
                <Link href="/settings" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", textDecoration: "none", color: "#444", fontSize: "14px", borderRadius: "8px", transition: "background 0.2s" }} onMouseEnter={(e) => e.target.style.background = "#f9f9f9"} onMouseLeave={(e) => e.target.style.background = "transparent"}>
                  <span>⚙️</span> Settings
                </Link>
                {profile?.role === 'admin' && (
                  <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", textDecoration: "none", color: "#d32f2f", fontSize: "14px", borderRadius: "8px", fontWeight: "bold", background: "#fff5f5" }}>
                    <span>🛡️</span> Admin Panel
                  </Link>
                )}
              </div>

              {/* Menu Footer */}
              <div style={{ borderTop: "1px solid #f5f5f5", padding: "8px" }}>
                <div onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", cursor: "pointer", color: "#e74c3c", fontSize: "14px", fontWeight: "600", borderRadius: "8px" }} onMouseEnter={(e) => e.target.style.background = "#fff5f5"} onMouseLeave={(e) => e.target.style.background = "transparent"}>
                  <span>🚪</span> Sign Out
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      <style jsx>{`@media (max-width: 900px) { .nav-links { display: none !important; } }`}</style>
    </nav>
  );
}