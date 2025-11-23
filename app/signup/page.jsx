"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import "../../styles/globals.css";

export default function Signup() {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeContent, setAgreeContent] = useState(false);

  const [message, setMessage] = useState("");

  const formValid =
    first &&
    last &&
    username &&
    email &&
    password.length >= 8 &&
    agreeTerms &&
    agreeContent;

  const handleSignup = async () => {
    if (!formValid) {
      setMessage("Please complete all fields.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: `${first} ${last}`, username },
      },
    });

    if (error) setMessage(error.message);
    else setMessage("Account created! Check your email to verify.");
  };

  return (
    <div className="page-wrap">

      {/* LEFT SIDE */}
      <section className="left">
        <p className="verse">
          “I can do all things through Christ who strengthens me.”
          <span className="verse-ref">— Philippians 4:13</span>
        </p>

        <h1 className="brand">
          <span className="the">The</span> <span className="gold">B</span>elievers
          <span className="green">e</span>
        </h1>

        <p className="tagline">One Family in Christ.</p>
      </section>

      {/* SIGNUP CARD */}
      <section className="right">
        <div className="auth-card">

          <h2>Create a new account</h2>

          {/* First / Last Name */}
          <input
            type="text"
            placeholder="First name"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
          />
          <input
            type="text"
            placeholder="Last name"
            value={last}
            onChange={(e) => setLast(e.target.value)}
          />

          {/* Username */}
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password */}
          <input
            type="password"
            placeholder="New password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Checkboxes */}
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            I agree to The Believerse Terms & Conditions.
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={agreeContent}
              onChange={(e) => setAgreeContent(e.target.checked)}
            />
            I understand that only Christian-faith content is allowed.
          </label>

          {/* SIGN UP BUTTON */}
          <button
            className="btn btn-cta"
            disabled={!formValid}
            onClick={handleSignup}
            style={{
              opacity: formValid ? 1 : 0.5,
              cursor: formValid ? "pointer" : "not-allowed"
            }}
          >
            Sign Up
          </button>

          <p style={{ marginTop: "10px" }}>
            Already have an account? <Link href="/">Sign in</Link>
          </p>

          <p className="message">{message}</p>

        </div>
      </section>
    </div>
  );
}
