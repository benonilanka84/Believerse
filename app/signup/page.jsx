// app/signup/page.jsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", username: "", email: "", password: "",
    agreeTerms: false, agreeFaithOnly: false,
  });
  const [canSubmit, setCanSubmit] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const ok = (
      form.firstName.trim() &&
      form.lastName.trim() &&
      form.username.trim() &&
      validateEmail(form.email) &&
      form.password.length >= 8 &&
      form.agreeTerms &&
      form.agreeFaithOnly
    );
    setCanSubmit(ok);
  }, [form]);

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (!canSubmit) return;
    // create user with supabase auth -- adjust if you use another auth provider
    const { user, session, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    }, {
      data: {
        full_name: `${form.firstName} ${form.lastName}`,
        username: form.username,
      }
    });

    if (error) {
      alert(error.message);
      return;
    }
    // you may want to create a profiles row or redirect
    router.push("/");
  }

  return (
    <div className="page-wrap">
      <section className="left">
        <p className="verse">“I can do all things through Christ who strengthens me.”
          <span className="verse-ref">— Philippians 4:13</span>
        </p>

        <h1 className="brand">
          <span className="the">The</span>
          <span className="gold">B</span>elievers<span className="green">e</span>
        </h1>

        <p className="tagline">One Family in Christ.</p>
      </section>

      <section className="right">
        <div className="auth-card">
          <h2>Create a new account</h2>

          <form onSubmit={handleSignup}>
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="First name" value={form.firstName} onChange={(e)=>setForm({...form, firstName:e.target.value})} />
              <input placeholder="Last name" value={form.lastName} onChange={(e)=>setForm({...form, lastName:e.target.value})} />
            </div>

            <input placeholder="Choose a username" value={form.username} onChange={(e)=>setForm({...form, username:e.target.value})} />
            <input placeholder="Email address" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} />
            <input placeholder="New password (min 8 chars)" type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} />

            <div style={{ marginTop: 8 }}>
              <label><input type="checkbox" checked={form.agreeTerms} onChange={(e)=>setForm({...form, agreeTerms: e.target.checked})} /> I agree to The Believerse Terms & Conditions.</label>
            </div>
            <div>
              <label><input type="checkbox" checked={form.agreeFaithOnly} onChange={(e)=>setForm({...form, agreeFaithOnly: e.target.checked})} /> I will only post Christian-faith content.</label>
            </div>

            <button className="btn btn-cta" type="submit" disabled={!canSubmit} style={{ opacity: canSubmit ? 1 : 0.6 }}>
              Sign Up
            </button>

            <p style={{ marginTop: 10 }}>Already have an account? <Link href="/">Sign in</Link></p>
          </form>
        </div>
      </section>
    </div>
  );
}
