"use client";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/supabase";

export default function Home() {
  const [msg, setMsg] = useState("");

  const handleLogin = async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      setMsg("Please enter email and password.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);

    window.location.href = "/dashboard";
  };

  const handleForgot = async () => {
    const email = document.getElementById("email").value.trim();
    if (!email) {
      setMsg("Enter your email address to reset your password.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return setMsg(error.message);

    setMsg("Password reset link sent to your email.");
  };

  return (
    <div className="page-wrap">

{/* LEFT PANEL */}
<section className="left">
  <p className="verse">
    “I can do all things through Christ who strengthens me.”
    <span className="verse-ref"> — Philippians 4:13</span>
  </p>

  <h1 className="brand">
    <span className="the">The</span>&nbsp;
    <span className="gold">B</span>elievers<span className="green">e</span>
  </h1>

  {/* small wrapper to nudge the tagline a bit right so it sits toward the end of "The Believerse" */}
  <p className="tagline" style={{ display: "inline-block", marginLeft: "1.6rem" }}>
    One Family in Christ.
  </p>
</section>

      {/* RIGHT PANEL */}
      <section className="right">
        <div className="auth-card">
          <h2>Welcome to The Believerse</h2>
          <p className="small">Sign in or create a new account to join the family.</p>

          <input id="email" type="email" placeholder="Email address" />
          <input id="password" type="password" placeholder="Password" />

          <button className="btn btn-primary" onClick={handleLogin}>Log in</button>

          <p className="forgot-link" onClick={handleForgot}>Forgot Password?</p>

          <hr className="divider" />

          <Link href="/signup">
            <button className="btn btn-cta">Create New Account</button>
          </Link>

          <p className="message">{msg}</p>
        </div>
      </section>
    </div>
  );
}
