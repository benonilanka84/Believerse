"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      alert("Password updated successfully! Redirecting to your dashboard...");
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      background: "#f4f7f9",
      padding: "20px"
    }}>
      <div style={{ 
        maxWidth: "400px", 
        width: "100%",
        padding: "40px 30px", 
        background: "white", 
        borderRadius: "24px", 
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)", 
        textAlign: "center" 
      }}>
        <div style={{ fontSize: "40px", marginBottom: "20px" }}>🔐</div>
        <h2 style={{ color: "#0b2e4a", marginBottom: "10px", fontWeight: "700" }}>New Strength</h2>
        <p style={{ color: "#666", fontSize: "15px", marginBottom: "30px" }}>Choose a new strong password to secure your sanctuary account.</p>
        
        <form onSubmit={handleUpdatePassword}>
          <input 
            type="password" 
            placeholder="New Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ 
              width: "100%", 
              padding: "14px", 
              borderRadius: "12px", 
              border: "2px solid #e0e0e0", 
              marginBottom: "15px",
              outline: "none"
            }} 
          />
          
          {error && <p style={{ color: "#c62828", fontSize: "13px", marginBottom: "15px", background: "#ffebee", padding: "8px", borderRadius: "8px" }}>{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "16px", 
              background: loading ? "#ccc" : "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", 
              color: "white", 
              border: "none", 
              borderRadius: "12px", 
              fontWeight: "700", 
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 8px 20px rgba(46,139,87,0.3)"
            }}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div style={{ marginTop: "25px" }}>
          <Link href="/" style={{ 
            color: "#666", 
            fontSize: "14px", 
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px"
          }}>
            ← Cancel and Go Back
          </Link>
        </div>
      </div>
    </div>
  );
}