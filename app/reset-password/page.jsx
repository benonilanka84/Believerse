"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      alert("Password updated successfully! Redirecting to sanctuary...");
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "30px", background: "white", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", textAlign: "center" }}>
      <h2 style={{ color: "#0b2e4a", marginBottom: "20px" }}>Create New Password</h2>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "25px" }}>Please enter your new strong password below.</p>
      
      <form onSubmit={handleUpdatePassword}>
        <input 
          type="password" 
          placeholder="New Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "15px" }} 
        />
        {error && <p style={{ color: "red", fontSize: "12px", marginBottom: "15px" }}>{error}</p>}
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: "100%", padding: "12px", background: "#2e8b57", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}