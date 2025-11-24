// app/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // if already "logged in" redirect to dashboard
    try {
      const u = JSON.parse(localStorage.getItem("bv_user") || "null");
      if (u) router.replace("/dashboard");
    } catch {}
  }, []);

  const doLogin = () => {
    if (!email || !password) {
      setMessage("Please enter email and password.");
      return;
    }
    // For demo: accept anything and set localStorage
    localStorage.setItem("bv_user", JSON.stringify({ email }));
    setMessage("Signing in...");
    router.push("/dashboard");
  };

  const forgotPassword = () => {
    if (!email) {
      setMessage("Enter e-mail address");
      return;
    }
    // Simulate sending reset link
    setMessage(`Password reset link sent to ${email}`);
  };

  return (
    <div className="page-wrap">
      <section className="left">
        <p className="verse">
          “I can do all things through Christ who strengthens me.”
          <span className="verse-ref"> — Philippians 4:13</span>
        </p>

        <h1 className="brand">
          <span className="the">The</span>
          <span className="gold">B</span>elievers
          <span className="green">e</span>
        </h1>

        <p className="tagline">One Family in Christ.</p>
      </section>

      <section className="right">
        <div className="auth-card">
          <h2>Welcome to The Believerse</h2>
          <p className="small">Sign in or create a new account to join the family.</p>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn btn-primary" onClick={doLogin}>
            Log in
          </button>

          <p style={{ marginTop: 8 }}>
            <a href="#" onClick={(e) => { e.preventDefault(); forgotPassword(); }}>
              Forgot password?
            </a>
          </p>

          <hr className="divider" />

          <button
            className="btn btn-cta"
            onClick={() => {
              router.push("/signup");
            }}
          >
            Create new account
          </button>

          {message && <p className="message">{message}</p>}
        </div>
      </section>

      <style jsx>{`
        /* keep styling consistent with your styles/globals.css */
      `}</style>
    </div>
  );
}
