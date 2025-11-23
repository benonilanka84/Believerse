// app/page.jsx
"use client";
import { useState } from "react";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSignIn(e) {
    e.preventDefault();
    // For now: simple placeholder. Later wire to Supabase or your API
    alert(`Signing in: ${email}`);
  }

  return (
    <main className="page-wrap">
      {/* LEFT */}
      <section className="left">
        <div className="verse">“I can do all things through Christ who strengthens me.”</div>
        <div className="verse-ref">— Philippians 4:13</div>

        <h1 className="brand">
          <span className="the">The</span>
          <span className="word">
            Believers
            <span className="gold">e</span>
            {/* The gold/green letters — adjust markup if you want the 'B' gold *)
               If you want specifically 'B' gold and last 'e' green, do:
               <span className="gold">B</span>elieverse with <span className="green">e</span> at end.
            */}
          </span>
        </h1>

        <div className="tagline">One Family in Christ.</div>
      </section>

      {/* RIGHT */}
      <aside className="right">
        <div className="auth-card">
          <h2>Welcome to The Believerse</h2>
          <div className="small">Sign in or create a new account to join the family.</div>

          <form onSubmit={handleSignIn}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn btn-primary" type="submit">Log in</button>
          </form>

          <hr className="divider" />
          <button className="btn btn-ghost" onClick={() => window.location.href = "/signup"}>Create new account</button>
        </div>
      </aside>
    </main>
  );
}
