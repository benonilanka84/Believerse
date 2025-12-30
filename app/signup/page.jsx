"use client";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react"; 
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#ffffff" }}>Preparing Sanctuary Entry...</div>}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite');

  const [formData, setFormData] = useState({ firstName: "", lastName: "", username: "", email: "", password: "" });
  const [agreements, setAgreements] = useState({ terms: false, faith: false });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  const passwordRequirements = [
    { test: (p) => p.length >= 8, text: "At least 8 characters" },
    { test: (p) => /[A-Z]/.test(p), text: "One uppercase letter" },
    { test: (p) => /[a-z]/.test(p), text: "One lowercase letter" },
    { test: (p) => /[0-9]/.test(p), text: "One number" },
    { test: (p) => /[!@#$%^&*]/.test(p), text: "One special character (!@#$%^&*)" }
  ];

  async function checkUsername(username) {
    if (!username || username.length < 3) { setUsernameAvailable(null); return; }
    const { data } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    setUsernameAvailable(!data);
  }

  useEffect(() => {
    const newErrors = {};
    if (formData.firstName && formData.firstName.length < 2) newErrors.firstName = "First name too short";
    if (formData.lastName && formData.lastName.length < 2) newErrors.lastName = "Last name too short";
    if (formData.username) {
      if (formData.username.length < 3) newErrors.username = "Username must be at least 3 characters";
      else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) newErrors.username = "Only letters, numbers, and underscore allowed";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    
    const passwordValid = passwordRequirements.every(req => req.test(formData.password));
    if (formData.password && !passwordValid) newErrors.password = "Password doesn't meet requirements";
    
    setErrors(newErrors);
    const allFieldsFilled = formData.firstName.trim() && formData.lastName.trim() && formData.username.trim() && formData.email.trim() && formData.password.trim() && agreements.terms && agreements.faith;
    setIsValid(allFieldsFilled && Object.keys(newErrors).length === 0 && usernameAvailable !== false);
  }, [formData, agreements, usernameAvailable]);

  useEffect(() => {
    const timer = setTimeout(() => { if (formData.username) checkUsername(formData.username); }, 500);
    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleSignup = async () => {
    if (!isValid) return;
    setLoading(true); setMsg("");
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email, password: formData.password,
        options: { data: { username: formData.username, full_name: `${formData.firstName} ${formData.lastName}`, is_founder: inviteCode === 'genesis_founder_2025' } }
      });
      if (authError) { setMsg(authError.message); setLoading(false); return; }
      if (authData.user) {
        await supabase.from("profiles").upsert({ id: authData.user.id, email: formData.email, username: formData.username, full_name: `${formData.firstName} ${formData.lastName}`, is_founder: inviteCode === 'genesis_founder_2025', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      }
      setMsg("✅ Account created! Check your email.");
      setFormData({ firstName: "", lastName: "", username: "", email: "", password: "" });
      setAgreements({ terms: false, faith: false });
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const labelStyle = { display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#333" };
  const inputStyle = { width: "100%", padding: "12px 16px", fontSize: "15px", border: "2px solid #e0e0e0", borderRadius: "12px", outline: "none", color: "#000", background: "#fff" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "url('/images/cross-bg.jpg') center/cover no-repeat", position: "relative", padding: "40px 20px" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "550px", margin: "0 auto" }}>
        <div style={{ background: "rgba(255, 255, 255, 0.98)", borderRadius: "24px", padding: "45px 40px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <div style={{ textAlign: "center", marginBottom: "35px" }}>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "36px", fontWeight: "800", color: "#0b2e4a" }}>Join The <span style={{ color: "#d4af37" }}>B</span>elievers<span style={{ color: "#2e8b57" }}>e</span></h1>
            <p style={{ margin: 0, fontSize: "15px", color: "#666" }}>{inviteCode === 'genesis_founder_2025' ? "Accepting your invitation as a Founding Partner" : "Create your account to start your walk with Christ"}</p>
          </div>
          <form onSubmit={(e) => e.preventDefault()}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
              <div><label style={labelStyle}>First Name *</label><input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="John" style={inputStyle} /></div>
              <div><label style={labelStyle}>Last Name *</label><input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="Doe" style={inputStyle} /></div>
            </div>
            <div style={{ marginBottom: "20px" }}><label style={labelStyle}>Username *</label><input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase()})} placeholder="username" style={inputStyle} /></div>
            <div style={{ marginBottom: "20px" }}><label style={labelStyle}>Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" style={inputStyle} /></div>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Password *</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" style={inputStyle} />
              
              {/* Password Requirements UI */}
              {formData.password && (
                <div style={{ marginTop: "12px", padding: "15px", background: "#f8f9fa", borderRadius: "10px", fontSize: "13px", border: "1px solid #eee" }}>
                  <div style={{ fontWeight: "600", marginBottom: "8px", color: "#555" }}>Password Strength:</div>
                  {passwordRequirements.map((req, i) => {
                    const met = req.test(formData.password);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", color: met ? "#2e8b57" : "#888", fontWeight: met ? "600" : "400", transition: "all 0.2s" }}>
                        <span>{met ? "✓" : "○"}</span>
                        <span>{req.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: "25px", padding: "15px", background: "#f9f9f9", borderRadius: "12px" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "15px", fontSize: "14px", cursor: "pointer", color: "#333" }}>
                <input type="checkbox" checked={agreements.terms} onChange={(e) => setAgreements({...agreements, terms: e.target.checked})} style={{ marginTop: "3px" }} />
                <span>I agree to The Believerse <Link href="/terms" style={{ color: "#2d6be3", textDecoration: "underline" }}>Terms & Fellowship</Link></span>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "14px", cursor: "pointer", color: "#333" }}>
                <input type="checkbox" checked={agreements.faith} onChange={(e) => setAgreements({...agreements, faith: e.target.checked})} style={{ marginTop: "3px" }} />
                <span>I understand that only Christian faith-based content is allowed</span>
              </label>
            </div>

            <button onClick={handleSignup} disabled={!isValid || loading} style={{ width: "100%", padding: "16px", background: !isValid || loading ? "#ccc" : "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", color: "white", borderRadius: "12px", border: "none", cursor: loading ? "wait" : (isValid ? "pointer" : "not-allowed"), fontWeight: "bold", fontSize: "16px", boxShadow: isValid ? "0 8px 20px rgba(46,139,87,0.3)" : "none" }}>{loading ? "Creating Account..." : "Create Account"}</button>
            <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#666" }}>Already have an account? <Link href="/" style={{ color: "#2d6be3", fontWeight: "bold" }}>Sign in</Link></div>
            {msg && <div style={{ marginTop: "20px", padding: "12px", background: msg.includes("✅") ? "#e8f5e9" : "#ffebee", color: msg.includes("✅") ? "#2e7d32" : "#c62828", borderRadius: "10px", textAlign: "center", fontSize: "14px" }}>{msg}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}