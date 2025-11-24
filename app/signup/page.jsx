// app/signup/page.jsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [agreeT, setAgreeT] = useState(false);
  const [agreeFaith, setAgreeFaith] = useState(false);
  const [message, setMessage] = useState("");

  const allOk =
    first.trim() &&
    last.trim() &&
    username.trim() &&
    email.trim() &&
    pw.length >= 8 &&
    agreeT &&
    agreeFaith;

  function handleSignup(e) {
    e.preventDefault();
    if (!allOk) {
      setMessage("Please complete all fields and tick both checkboxes.");
      return;
    }
    setMessage("Signing up (simulated)...");
    setTimeout(() => setMessage("Account created (simulated)."), 800);
  }

  return (
    <div className="page-wrap">
      {/* LEFT PANEL */}
      <section className="left">
        <p className="verse">
          “I can do all things through Christ who strengthens me.”
          <span className="verse-ref">— Philippians 4:13</span>
        </p>

        <h1 className="brand">
          <span className="the">The</span>
          <span className="gold">B</span>elievers<span className="green">e</span>
        </h1>

        <p className="tagline">One Family in Christ.</p>
      </section>

      {/* RIGHT PANEL */}
      <section className="right">
        <div className="auth-card">
          <h2>Create a new account</h2>

          <form onSubmit={handleSignup}>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                placeholder="First name"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
              />
              <input
                placeholder="Last name"
                value={last}
                onChange={(e) => setLast(e.target.value)}
              />
            </div>

            <input
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              placeholder="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              placeholder="New password (min 8 chars)"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />

            <div style={{ marginTop: 8 }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={agreeT}
                  onChange={(e) => setAgreeT(e.target.checked)}
                />{" "}
                I agree to The Believerse Terms & Conditions.
              </label>

              <label style={{ display: "block" }}>
                <input
                  type="checkbox"
                  checked={agreeFaith}
                  onChange={(e) => setAgreeFaith(e.target.checked)}
                />{" "}
                I understand that only Christian-faith based content is allowed.
              </label>
            </div>

            <button className="btn btn-cta" type="submit" disabled={!allOk}>
              Sign Up
            </button>

            <p style={{ marginTop: 10 }}>
              Already have an account? <Link href="/"><a>Sign in</a></Link>
            </p>

            <p className="message">{message}</p>
          </form>
        </div>
      </section>
    </div>
  );
}
