"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      window.location.href = "/dashboard";
    }
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
          <span className="the">The</span>{" "}
          <span className="gold">B</span>elievers
          <span className="green">e</span>
        </h1>

        <p className="tagline">One Family in Christ.</p>
      </section>

      {/* RIGHT PANEL */}
      <section className="right">
        <div className="auth-card">
          <h2>Welcome to The Believerse</h2>
          <p className="small">
            Sign in or create a new account to join the family.
          </p>

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

          <button
            className="btn btn-primary"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Log in"}
          </button>

          <p className="forgot-link">Forgot password?</p>

          <hr className="divider" />

          <button
            className="btn btn-cta"
            onClick={() => (window.location.href = "/signup")}
          >
            Create new account
          </button>
        </div>
      </section>
    </div>
  );
}
