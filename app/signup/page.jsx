// app/signup/page.jsx
"use client";
import { useState } from "react";

export default function SignupPage() {
  const [form, setForm] = useState({
    first: "", last: "", username: "", email: "", password: ""
  });

  function update(k, v){ setForm(prev => ({ ...prev, [k]: v })); }

  function handleSubmit(e) {
    e.preventDefault();
    // placeholder — later connect to Supabase / API
    alert(`Sign up: ${form.email}`);
  }

  return (
    <main className="signup-wrap">
      <div className="signup-header">
        <h1 className="brand">
          <span className="the">The</span>
          <span className="word"><span className="gold">B</span>elievers<span className="green">e</span></span>
        </h1>
        <p className="tagline">One Family in Christ.</p>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Create a new account</h2>
          <div style={{ display: "flex", gap: 12 }}>
            <input value={form.first} onChange={e=>update("first", e.target.value)} placeholder="First name" />
            <input value={form.last} onChange={e=>update("last", e.target.value)} placeholder="Last name" />
          </div>
          <input value={form.username} onChange={e=>update("username", e.target.value)} placeholder="Choose a username" />
          <input value={form.email} onChange={e=>update("email", e.target.value)} placeholder="Email address" />
          <input type="password" value={form.password} onChange={e=>update("password", e.target.value)} placeholder="New password (min 8 chars)" />
          <div style={{ fontSize: ".9rem", marginTop: 8 }}>
            <label><input type="checkbox" required /> I agree to The Believerse Terms & Conditions.</label><br/>
            <label><input type="checkbox" required /> I will only post Christian content.</label>
          </div>

          <button className="btn btn-cta" type="submit" style={{ marginTop: 12 }}>Sign Up</button>

          <div className="message">Already have an account? <a href="/" style={{color:"#2d6be3"}}>Sign in</a></div>
        </form>
      </div>
    </main>
  );
}
