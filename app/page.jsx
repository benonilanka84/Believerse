// app/page.jsx
"use client";

import { useState } from "react";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleLogin() {
    // Placeholder: you will hook this to Supabase auth later
    if (!email || !password) {
      setMessage("Please enter both email and password.");
      return;
    }
    setMessage("Signing in...");
    // simulate success
    setTimeout(() => {
      setMessage("Signed in (simulated). Redirecting to dashboard...");
      // In real app: navigate to /dashboard or update auth state
    }, 700);
  }

  function handleForgot() {
    if (!email) {
      setMessage("Enter e-mail address to receive password reset link.");
      return;
    }
    setMessage(`Password reset link sent to ${email} (simulated).`);
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
          <h2>Welcome to The Believerse</h2>
          <p className="small">Sign in or create a new account to join the family.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            autoComplete="on"
          >
            <input
              id="email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button id="login-btn" className="btn btn-primary" type="submit">
              Log in
            </button>

            <p
              className="forgot-link"
              onClick={(e) => {
                e.preventDefault();
                handleForgot();
              }}
            >
              Forgot password?
            </p>

            <hr className="divider" />

            <a className="btn btn-cta" href="/signup">
              Create new account
            </a>

            <p id="login-message" className="message">
              {message}
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
