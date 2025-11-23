// app/page.jsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function handleLogin() {
    setMsg("");
    if (!email || !password) { setMsg("Enter both e-mail and password"); return; }

    const { error, user } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMsg(error.message); return; }
    // on success redirect to dashboard
    router.push("/dashboard");
  }

  async function handleForgot() {
    if (!email) { setMsg("Enter e-mail address"); return; }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-callback`
    });
    if (error) setMsg(error.message);
    else setMsg("Password reset link sent to email");
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
          <h2>Welcome to The Believerse</h2>
          <p className="small">Sign in or create a new account to join the family.</p>

          <input type="email" placeholder="Email address" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />

          <button className="btn btn-primary" onClick={handleLogin}>Log in</button>

          <p style={{ marginTop: 8, marginBottom: 8 }}>
            <a onClick={handleForgot} style={{ color: "#2d6be3", cursor: "pointer" }}>Forgot password?</a>
          </p>

          <hr className="divider" />

          <Link href="/signup"><button className="btn btn-cta">Create new account</button></Link>

          {msg && <p className="message">{msg}</p>}
        </div>
      </section>
    </div>
  );
}
