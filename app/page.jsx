"use client";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      setMsg("Please enter email and password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) return setMsg(error.message);

    window.location.href = "/dashboard";
  };

  const handleForgot = async () => {
    const email = document.getElementById("email").value.trim();
    if (!email) {
      setMsg("Enter your email address to reset your password.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return setMsg(error.message);

    setMsg("Password reset link sent to your email.");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "url('/images/cross-bg.jpg') center/cover no-repeat",
      position: "relative"
    }}>
      
      {/* Overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(2px)"
      }} />

      {/* Content Container */}
      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px",
        display: "grid",
        gridTemplateColumns: window.innerWidth > 768 ? "1fr 420px" : "1fr",
        gap: window.innerWidth > 768 ? "40px" : "20px",
        alignItems: "start"
      }}>

        {/* LEFT PANEL - Branding */}
        <div style={{
          color: "white",
          padding: "20px",
          textAlign: "center",
          display: window.innerWidth < 768 ? "none" : "block"
        }}>
          
          {/* Verse - Line 1 */}
          <div style={{
            fontSize: "16px",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            marginBottom: "25px",
            lineHeight: "1.6",
            textShadow: "0 4px 12px rgba(0,0,0,0.5)",
            maxWidth: "600px",
            margin: "0 auto 25px auto"
          }}>
            "I can do all things through Christ who strengthens me."
            <div style={{
              fontSize: "17px",
              marginTop: "12px",
              fontStyle: "normal",
              opacity: 0.95
            }}>
              — Philippians 4:13
            </div>
          </div>

          {/* Title - Line 2 */}
          <h1 style={{
            fontSize: "48px",
            fontWeight: "800",
            margin: "0 0 10px 0",
            letterSpacing: "-1px",
            textShadow: "0 8px 20px rgba(0,0,0,0.6)",
            lineHeight: "1.1"
          }}>
            The <span style={{ color: "#d4af37" }}>B</span>elievers<span style={{ color: "#2e8b57" }}>e</span>
          </h1>

          {/* Tagline - Line 3 (Right aligned to title) */}
          <div style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#e8f5e9",
            textShadow: "0 4px 12px rgba(0,0,0,0.5)",
            marginTop: "10px",
            letterSpacing: "0.5px"
          }}>
            One Family in Christ.
          </div>

          {/* Features List */}
          <div style={{
            marginTop: "60px",
            textAlign: "left",
            maxWidth: "500px",
            margin: "60px auto 0"
          }}>
            <div style={{
              display: "grid",
              gap: "20px"
            }}>
              {[
                { icon: "🙏", text: "Connect with believers worldwide" },
                { icon: "📖", text: "Read Bible & daily devotionals" },
                { icon: "🎵", text: "Worship music & sermons" },
                { icon: "👥", text: "Join fellowships & prayer groups" }
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  background: "rgba(255,255,255,0.1)",
                  padding: "15px 20px",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.2)"
                }}>
                  <span style={{ fontSize: "28px" }}>{item.icon}</span>
                  <span style={{ fontSize: "16px", fontWeight: "500" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Login Form */}
        <div style={{
          background: "rgba(255, 255, 255, 0.98)",
          borderRadius: "20px",
          padding: "30px 25px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.5)",
          maxWidth: "100%"
        }}>
          
          <div style={{
            textAlign: "center",
            marginBottom: "25px"
          }}>
            <h2 style={{
              margin: "0 0 8px 0",
              fontSize: "26px",
              fontWeight: "700",
              color: "#0b2e4a"
            }}>
              Welcome Back
            </h2>
            <p style={{
              margin: 0,
              fontSize: "15px",
              color: "#666"
            }}>
              Sign in to continue your walk with Christ
            </p>
          </div>

          {/* Email Input */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#333"
            }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              style={{
                width: "100%",
                padding: "14px 18px",
                fontSize: "15px",
                border: "2px solid #e0e0e0",
                borderRadius: "12px",
                outline: "none",
                transition: "all 0.3s",
                fontFamily: "inherit"
              }}
              onFocus={(e) => e.target.style.borderColor = "#2e8b57"}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: "25px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#333"
            }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              style={{
                width: "100%",
                padding: "14px 18px",
                fontSize: "15px",
                border: "2px solid #e0e0e0",
                borderRadius: "12px",
                outline: "none",
                transition: "all 0.3s",
                fontFamily: "inherit"
              }}
              onFocus={(e) => e.target.style.borderColor = "#2e8b57"}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "16px",
              fontWeight: "700",
              color: "white",
              background: loading ? "#ccc" : "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)",
              border: "none",
              borderRadius: "12px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 8px 20px rgba(46,139,87,0.3)",
              transition: "transform 0.2s, box-shadow 0.2s",
              marginBottom: "15px"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 12px 28px rgba(46,139,87,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 8px 20px rgba(46,139,87,0.3)";
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {/* Forgot Password */}
          <div style={{
            textAlign: "center",
            marginBottom: "25px"
          }}>
            <button
              onClick={handleForgot}
              style={{
                background: "none",
                border: "none",
                color: "#2d6be3",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Forgot Password?
            </button>
          </div>

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            margin: "30px 0"
          }}>
            <div style={{ flex: 1, height: "1px", background: "#e0e0e0" }} />
            <span style={{ fontSize: "13px", color: "#999", fontWeight: "500" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "#e0e0e0" }} />
          </div>

          {/* Create Account Button */}
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <button style={{
              width: "100%",
              padding: "16px",
              fontSize: "16px",
              fontWeight: "700",
              color: "white",
              background: "linear-gradient(135deg, #2d6be3 0%, #1e4ba8 100%)",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(45,107,227,0.3)",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 12px 28px rgba(45,107,227,0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 8px 20px rgba(45,107,227,0.3)";
            }}
            >
              Create New Account
            </button>
          </Link>

          {/* Message */}
          {msg && (
            <div style={{
              marginTop: "20px",
              padding: "12px 16px",
              background: msg.includes("success") || msg.includes("sent") ? "#e8f5e9" : "#ffebee",
              color: msg.includes("success") || msg.includes("sent") ? "#2e7d32" : "#c62828",
              borderRadius: "10px",
              fontSize: "14px",
              textAlign: "center",
              border: `1px solid ${msg.includes("success") || msg.includes("sent") ? "#a5d6a7" : "#ef9a9a"}`
            }}>
              {msg}
            </div>
          )}
        </div>

      </div>

      {/* Responsive Design */}
      <style jsx>{`
        @media (max-width: 768px) {
          body {
            font-size: 14px;
          }
          h1 {
            font-size: 36px !important;
          }
          h2 {
            font-size: 22px !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          h1 {
            font-size: 48px !important;
          }
        }
      `}</style>
    </div>
  );
}