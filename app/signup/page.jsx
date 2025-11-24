"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/supabase";

export default function SignupPage() {
  const [valid, setValid] = useState(false);
  const [msg, setMsg] = useState("");

  // enable Sign Up only when all requirements are met
  useEffect(() => {
    const validate = () => {
      const first = document.getElementById("fn").value.trim();
      const last = document.getElementById("ln").value.trim();
      const user = document.getElementById("un").value.trim();
      const email = document.getElementById("em").value.trim();
      const pass = document.getElementById("pw").value.trim();
      const tc = document.getElementById("tc").checked;
      const faith = document.getElementById("faith").checked;

      setValid(first && last && user && email && pass.length >= 8 && tc && faith);
    };

    document.addEventListener("input", validate);
    return () => document.removeEventListener("input", validate);
  }, []);

  const handleSignup = async () => {
    const email = document.getElementById("em").value.trim();
    const password = document.getElementById("pw").value.trim();
    const username = document.getElementById("un").value.trim();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });

    if (error) return setMsg(error.message);

    setMsg("Account created! Check your email for verification.");
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
          <span className="the">The </span>
          <span className="gold">B</span>elievers<span className="green">e</span>
        </h1>

        <p className="tagline">One Family in Christ.</p>
      </section>

      {/* RIGHT PANEL */}
      <section className="right">
        <div className="auth-card">

          <h2>Create a new account</h2>

          <form className="signup-form" onSubmit={(e) => e.preventDefault()}>
            <div className="row">
              <input id="fn" type="text" placeholder="First name" />
              <input id="ln" type="text" placeholder="Last name" />
            </div>

            <input id="un" type="text" placeholder="Choose a username" />
            <input id="em" type="email" placeholder="Email address" />
            <input id="pw" type="password" placeholder="New password (min 8 chars)" />

            <label className="checkbox-line">
              <input type="checkbox" id="tc" /> I agree to The Believerse Terms & Conditions.
            </label>

            <label className="checkbox-line">
              <input type="checkbox" id="faith" /> I understand that only Christian-faith based content is allowed.
            </label>

            <button
              className="btn btn-cta"
              disabled={!valid}
              onClick={handleSignup}
            >
              Sign Up
            </button>

            <p className="small mt-1">
              Already have an account? <Link href="/">Sign in</Link>
            </p>

            <p className="message">{msg}</p>
          </form>

        </div>
      </section>
    </div>
  );
}
