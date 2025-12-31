"use client";

import DailyVerseWidget from "@/components/DailyVerseWidget";
import DailyPrayerWidget from "@/components/DailyPrayerWidget";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import "@/styles/dashboard.css";

export default function Home() {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [identifier, setIdentifier] = useState(""); // Email or Username
  const [password, setPassword] = useState("");
  
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async () => {
    if (!identifier || !password) {
      setMsg("Please enter email/username and password.");
      return;
    }

    setLoading(true);
    setMsg(""); 

    let emailToLogin = identifier.trim();

    // 1. Check if input is a Username (no '@' symbol)
    if (!emailToLogin.includes("@")) {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', emailToLogin.toLowerCase())
        .single();
      
      if (error || !data) {
        setMsg("Username not found.");
        setLoading(false);
        return;
      }
      emailToLogin = data.email;
    }

    // 2. Sign in with Email
    const { error } = await supabase.auth.signInWithPassword({
      email: emailToLogin,
      password: password,
    });

    setLoading(false);
    if (error) {
      setMsg(error.message);
    } else {
      router.push("/dashboard");
    }
  };

  // --- UPDATED FORGOT PASSWORD TRIGGER ---
  const handleForgot = async () => {
    if (!identifier || !identifier.includes("@")) {
      setMsg("Please enter your Email Address to reset password.");
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(identifier, {
      // FIXED: Redirects the user specifically to the new recovery page
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    setLoading(false);
    if (error) {
      setMsg(error.message);
    } else {
      setMsg("Peace be with you. A reset link has been sent to your email.");
    }
  };

  if (!mounted) return null;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "url('/images/cross-bg.jpg') center/cover no-repeat",
      position: "relative"
    }}>
      
      {/* Dark Overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(2px)"
      }} />

      {/* Main Grid Container */}
      <div className="login-grid-container" style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "40px 20px",
        display: "grid",
        gridTemplateColumns: "1fr 480px", 
        gap: "60px",
        alignItems: "flex-start",
        paddingTop: "80px"
      }}>

        {/* LEFT PANEL (Text) */}
        <div className="left-panel" style={{ color: "white", padding: "40px", textAlign: "center" }}>
          <div style={{
            fontSize: "20px",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            marginBottom: "35px",
            lineHeight: "1.6",
            textShadow: "0 4px 12px rgba(0,0,0,0.5)",
            maxWidth: "700px",
            margin: "0 auto 35px auto"
          }}>
            "I can do all things through Christ who strengthens me."
            <div style={{ fontSize: "17px", marginTop: "12px", fontStyle: "normal", opacity: 0.95 }}>
              — Philippians 4:13
            </div>
          </div>

          <h1 className="hero-title" style={{
            fontSize: "72px",
            fontWeight: "800",
            margin: "0 0 15px 0",
            letterSpacing: "-1px",
            textShadow: "0 8px 20px rgba(0,0,0,0.6)",
            lineHeight: "1.1"
          }}>
            The <span style={{ color: "#d4af37" }}>B</span>elievers<span style={{ color: "#2e8b57" }}>e</span>
          </h1>

          <div className="hero-subtitle" style={{
            fontSize: "26px",
            fontWeight: "600",
            color: "#e8f5e9",
            textShadow: "0 4px 12px rgba(0,0,0,0.5)",
            marginTop: "15px",
            letterSpacing: "0.5px"
          }}>
            One Family in Christ.
          </div>
        </div>

        {/* RIGHT PANEL - Login Form */}
        <div className="login-card" style={{
          background: "rgba(255, 255, 255, 0.98)",
          borderRadius: "24px",
          padding: "45px 40px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.5)"
        }}>
          
          <div style={{ textAlign: "center", marginBottom: "25px" }}>
            <h2 style={{ margin: "0 0 10px 0", fontSize: "32px", fontWeight: "700", color: "#0b2e4a" }}>
              Welcome Back
            </h2>
            <p style={{ margin: 0, fontSize: "15px", color: "#666" }}>
              Sign in to continue your walk with Christ
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#333" }}>
              Email or Username
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="username or email@example.com"
              style={{
                width: "100%", padding: "14px 18px", fontSize: "15px",
                border: "2px solid #e0e0e0", borderRadius: "12px", outline: "none", transition: "all 0.3s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#2e8b57"}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
          </div>

          <div style={{ marginBottom: "25px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#333" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: "100%", padding: "14px 18px", fontSize: "15px",
                border: "2px solid #e0e0e0", borderRadius: "12px", outline: "none", transition: "all 0.3s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#2e8b57"}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%", padding: "16px", fontSize: "16px", fontWeight: "700", color: "white",
              background: loading ? "#ccc" : "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)",
              border: "none", borderRadius: "12px", cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 8px 20px rgba(46,139,87,0.3)", marginBottom: "15px"
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div style={{ textAlign: "center", marginBottom: "25px" }}>
            <button onClick={handleForgot} style={{ background: "none", border: "none", color: "#2d6be3", fontSize: "14px", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }}>
              Forgot Password?
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "15px", margin: "30px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "#e0e0e0" }} />
            <span style={{ fontSize: "13px", color: "#999", fontWeight: "500" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "#e0e0e0" }} />
          </div>

          <Link href="/signup" style={{ textDecoration: "none" }}>
            <button style={{
              width: "100%", padding: "16px", fontSize: "16px", fontWeight: "700", color: "white",
              background: "linear-gradient(135deg, #2d6be3 0%, #1e4ba8 100%)",
              border: "none", borderRadius: "12px", cursor: "pointer", boxShadow: "0 8px 20px rgba(45,107,227,0.3)"
            }}>
              Create New Account
            </button>
          </Link>

          {msg && (
            <div style={{
              marginTop: "20px", padding: "12px 16px",
              background: msg.includes("reset") || msg.includes("Peace") ? "#e8f5e9" : "#ffebee",
              color: msg.includes("reset") || msg.includes("Peace") ? "#2e7d32" : "#c62828",
              borderRadius: "10px", fontSize: "14px", textAlign: "center"
            }}>
              {msg}
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @media (max-width: 1024px) {
          .login-grid-container {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            padding: 20px !important;
            padding-top: 40px !important;
          }
          .left-panel {
            padding: 0 !important;
            margin-bottom: 20px;
          }
          .hero-title {
            font-size: 48px !important;
          }
          .hero-subtitle {
            font-size: 20px !important;
          }
          .login-card {
            padding: 30px 20px !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}