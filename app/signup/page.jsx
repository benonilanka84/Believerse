"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Added for founder detection
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite'); // Detects ?invite=...

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: ""
  });
  
  const [agreements, setAgreements] = useState({
    terms: false,
    faith: false
  });

  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  // Password strength requirements
  const passwordRequirements = [
    { test: (p) => p.length >= 8, text: "At least 8 characters" },
    { test: (p) => /[A-Z]/.test(p), text: "One uppercase letter" },
    { test: (p) => /[a-z]/.test(p), text: "One lowercase letter" },
    { test: (p) => /[0-9]/.test(p), text: "One number" },
    { test: (p) => /[!@#$%^&*]/.test(p), text: "One special character (!@#$%^&*)" }
  ];

  // Check if username is available
  async function checkUsername(username) {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    setUsernameAvailable(!data);
  }

  // Validate form
  useEffect(() => {
    const newErrors = {};

    if (formData.firstName && formData.firstName.length < 2) {
      newErrors.firstName = "First name too short";
    }

    if (formData.lastName && formData.lastName.length < 2) {
      newErrors.lastName = "Last name too short";
    }

    if (formData.username) {
      if (formData.username.length < 3) {
        newErrors.username = "Username must be at least 3 characters";
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = "Only letters, numbers, and underscore allowed";
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    const passwordValid = passwordRequirements.every(req => req.test(formData.password));
    if (formData.password && !passwordValid) {
      newErrors.password = "Password doesn't meet requirements";
    }

    setErrors(newErrors);

    const allFieldsFilled = 
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.username.trim() &&
      formData.email.trim() &&
      formData.password.trim() &&
      agreements.terms &&
      agreements.faith;

    const noErrors = Object.keys(newErrors).length === 0;
    const usernameOk = usernameAvailable !== false;

    setIsValid(allFieldsFilled && noErrors && usernameOk);
  }, [formData, agreements, usernameAvailable]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username) {
        checkUsername(formData.username);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleSignup = async () => {
    if (!isValid) return;

    setLoading(true);
    setMsg("");

    try {
      // Create auth user with Founder metadata if applicable
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            full_name: `${formData.firstName} ${formData.lastName}`,
            is_founder: inviteCode === 'genesis_founder_2025' // This triggers your SQL logic
          }
        }
      });

      if (authError) {
        setMsg(authError.message);
        setLoading(false);
        return;
      }

      // Create profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: authData.user.id,
            email: formData.email,
            username: formData.username,
            full_name: `${formData.firstName} ${formData.lastName}`,
            is_founder: inviteCode === 'genesis_founder_2025', // Syncing status to profile table
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
      }

      setMsg("✅ Account created! Check your email for verification.");
      
      setFormData({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: ""
      });
      setAgreements({ terms: false, faith: false });
      
    } catch (err) {
      setMsg("An unexpected error occurred. Please try again.");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "url('/images/cross-bg.jpg') center/cover no-repeat",
      position: "relative",
      padding: "40px 20px"
    }}>
      
      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(2px)"
      }} />

      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "550px",
        margin: "0 auto"
      }}>
        
        <div style={{
          background: "rgba(255, 255, 255, 0.98)",
          borderRadius: "24px",
          padding: "45px 40px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.5)"
        }}>
          
          <div style={{ textAlign: "center", marginBottom: "35px" }}>
            <h1 style={{
              margin: "0 0 10px 0",
              fontSize: "36px",
              fontWeight: "800",
              color: "#0b2e4a"
            }}>
              Join The <span style={{ color: "#d4af37" }}>B</span>elievers<span style={{ color: "#2e8b57" }}>e</span>
            </h1>
            <p style={{
              margin: 0,
              fontSize: "15px",
              color: "#666"
            }}>
              {inviteCode === 'genesis_founder_2025' 
                ? "Accepting your invitation as a Founding Partner" 
                : "Create your account to start your walk with Christ"}
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
              <div>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#333"
                }}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="John"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "15px",
                    border: `2px solid ${errors.firstName ? "#ef5350" : "#e0e0e0"}`,
                    borderRadius: "12px",
                    outline: "none",
                    transition: "all 0.3s"
                  }}
                  onFocus={(e) => !errors.firstName && (e.target.style.borderColor = "#2e8b57")}
                  onBlur={(e) => e.target.style.borderColor = errors.firstName ? "#ef5350" : "#e0e0e0"}
                />
                {errors.firstName && (
                  <small style={{ color: "#ef5350", fontSize: "12px" }}>{errors.firstName}</small>
                )}
              </div>

              <div>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#333"
                }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="Doe"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "15px",
                    border: `2px solid ${errors.lastName ? "#ef5350" : "#e0e0e0"}`,
                    borderRadius: "12px",
                    outline: "none",
                    transition: "all 0.3s"
                  }}
                  onFocus={(e) => !errors.lastName && (e.target.style.borderColor = "#2e8b57")}
                  onBlur={(e) => e.target.style.borderColor = errors.lastName ? "#ef5350" : "#e0e0e0"}
                />
                {errors.lastName && (
                  <small style={{ color: "#ef5350", fontSize: "12px" }}>{errors.lastName}</small>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#333"
              }}>
                Username * <span style={{ fontSize: "12px", fontWeight: "normal", color: "#999" }}>(unique)</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                placeholder="johndoe123"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "15px",
                  border: `2px solid ${errors.username || usernameAvailable === false ? "#ef5350" : usernameAvailable === true ? "#4caf50" : "#e0e0e0"}`,
                  borderRadius: "12px",
                  outline: "none",
                  transition: "all 0.3s"
                }}
              />
              {formData.username && usernameAvailable === false && (
                <small style={{ color: "#ef5350", fontSize: "12px" }}>❌ Username already taken</small>
              )}
              {formData.username && usernameAvailable === true && (
                <small style={{ color: "#4caf50", fontSize: "12px" }}>✓ Username available</small>
              )}
              {errors.username && (
                <small style={{ color: "#ef5350", fontSize: "12px", display: "block" }}>{errors.username}</small>
              )}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#333"
              }}>
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "15px",
                  border: `2px solid ${errors.email ? "#ef5350" : "#e0e0e0"}`,
                  borderRadius: "12px",
                  outline: "none",
                  transition: "all 0.3s"
                }}
                onFocus={(e) => !errors.email && (e.target.style.borderColor = "#2e8b57")}
                onBlur={(e) => e.target.style.borderColor = errors.email ? "#ef5350" : "#e0e0e0"}
              />
              {errors.email && (
                <small style={{ color: "#ef5350", fontSize: "12px" }}>{errors.email}</small>
              )}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#333"
              }}>
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Create a strong password"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "15px",
                  border: `2px solid ${errors.password ? "#ef5350" : "#e0e0e0"}`,
                  borderRadius: "12px",
                  outline: "none",
                  transition: "all 0.3s"
                }}
              />
              
              {formData.password && (
                <div style={{
                  marginTop: "10px",
                  padding: "12px",
                  background: "#f5f5f5",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}>
                  <div style={{ fontWeight: "600", marginBottom: "6px", color: "#666" }}>
                    Password Requirements:
                  </div>
                  {passwordRequirements.map((req, i) => (
                    <div key={i} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "4px",
                      color: req.test(formData.password) ? "#4caf50" : "#999"
                    }}>
                      <span>{req.test(formData.password) ? "✓" : "○"}</span>
                      <span>{req.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              marginBottom: "25px",
              padding: "15px",
              background: "#f9f9f9",
              borderRadius: "12px"
            }}>
              <label style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                marginBottom: "15px",
                cursor: "pointer",
                fontSize: "14px",
                lineHeight: "1.5"
              }}>
                <input
                  type="checkbox"
                  checked={agreements.terms}
                  onChange={(e) => setAgreements({...agreements, terms: e.target.checked})}
                  style={{
                    width: "18px",
                    height: "18px",
                    marginTop: "2px",
                    cursor: "pointer",
                    accentColor: "#2e8b57"
                  }}
                />
                <span style={{ flex: 1, color: "#333" }}>
                  I agree to The Believerse <Link href="/terms" style={{ color: "#2d6be3", textDecoration: "underline" }}>Terms & Fellowship</Link>
                </span>
              </label>

              <label style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                cursor: "pointer",
                fontSize: "14px",
                lineHeight: "1.5"
              }}>
                <input
                  type="checkbox"
                  checked={agreements.faith}
                  onChange={(e) => setAgreements({...agreements, faith: e.target.checked})}
                  style={{
                    width: "18px",
                    height: "18px",
                    marginTop: "2px",
                    cursor: "pointer",
                    accentColor: "#2e8b57"
                  }}
                />
                <span style={{ flex: 1, color: "#333" }}>
                  I understand that only Christian faith-based content is allowed
                </span>
              </label>
            </div>

            <button
              onClick={handleSignup}
              disabled={!isValid || loading}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "16px",
                fontWeight: "700",
                color: "white",
                background: !isValid || loading ? "#ccc" : "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)",
                border: "none",
                borderRadius: "12px",
                cursor: !isValid || loading ? "not-allowed" : "pointer",
                boxShadow: isValid && !loading ? "0 8px 20px rgba(46,139,87,0.3)" : "none",
                transition: "all 0.2s",
                marginBottom: "15px"
              }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <div style={{ textAlign: "center", fontSize: "14px", color: "#666" }}>
              Already have an account?{" "}
              <Link href="/" style={{ color: "#2d6be3", fontWeight: "600", textDecoration: "underline" }}>
                Sign in
              </Link>
            </div>

            {msg && (
              <div style={{
                marginTop: "20px",
                padding: "12px 16px",
                background: msg.includes("✅") ? "#e8f5e9" : "#ffebee",
                color: msg.includes("✅") ? "#2e7d32" : "#c62828",
                borderRadius: "10px",
                fontSize: "14px",
                textAlign: "center",
                border: `1px solid ${msg.includes("✅") ? "#a5d6a7" : "#ef9a9a"}`
              }}>
                {msg}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}