// app/signup/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [agree, setAgree] = useState(false);
  const [faith, setFaith] = useState(false);
  const [message, setMessage] = useState("");

  const valid = first && last && username && email && pw.length >= 8 && agree && faith;

  const handleSignUp = () => {
    if (!valid) return;
    localStorage.setItem("bv_user", JSON.stringify({ email }));
    setMessage("Account created, signing in...");
    setTimeout(() => router.push("/dashboard"), 700);
  };

  return (
    <div className="page-wrap">
      <section className="left">
        <p className="verse">“I can do all things through Christ who strengthens me.”<span className="verse-ref"> — Philippians 4:13</span></p>
        <h1 className="brand"><span className="the">The</span><span className="gold">B</span>elievers<span className="green">e</span></h1>
        <p className="tagline">One Family in Christ.</p>
      </section>

      <section className="right">
        <div className="auth-card">
          <h2>Create a new account</h2>

          <div style={{ display: "flex", gap: 10 }}>
            <input placeholder="First name" value={first} onChange={(e)=>setFirst(e.target.value)} />
            <input placeholder="Last name" value={last} onChange={(e)=>setLast(e.target.value)} />
          </div>

          <input placeholder="Choose a username" value={username} onChange={(e)=>setUsername(e.target.value)} />
          <input placeholder="Email address" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input placeholder="New password (min 8 chars)" value={pw} onChange={(e)=>setPw(e.target.value)} />

          <label style={{ display:"block", marginTop:8 }}>
            <input type="checkbox" checked={agree} onChange={(e)=>setAgree(e.target.checked)} /> I agree to The Believerse Terms & Conditions.
          </label>
          <label style={{ display:"block" }}>
            <input type="checkbox" checked={faith} onChange={(e)=>setFaith(e.target.checked)} /> I will only post Christian-faith content.
          </label>

          <button className="btn" style={{ width:"100%", marginTop:12, background: valid ? "#2ea36f" : "#95c6a8", color:"#fff", borderRadius:8 }} onClick={handleSignUp} disabled={!valid}>
            Sign Up
          </button>

          {message && <p style={{ marginTop:8 }}>{message}</p>}
          <p style={{ marginTop:10 }}>
            Already have an account? <a href="/" onClick={(e)=>{ e.preventDefault(); router.push("/"); }}>Sign in</a>
          </p>
        </div>
      </section>
    </div>
  );
}
