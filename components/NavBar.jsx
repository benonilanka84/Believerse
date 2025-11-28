"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import Link from "next/link";

export default function NavBar() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      const u = data?.user || null;
      setUser(u);

      if (u) loadProfile(u.id);
    }

    load();

    supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) loadProfile(u.id);
    });
  }, []);

  async function loadProfile(uid) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", uid)
      .single();

    if (data) setProfile(data);
  }

  return (
    <header className="card flex items-center justify-between mb-4 px-4">
      <div className="flex items-center gap-3">
        <img
          src="/images/final-logo.png"
          alt="The Believerse Logo"
          className="w-10 h-10 object-contain"
        />

        <div className="brand">
          <span className="the">The</span>
          <span className="gold">B</span>
          <span className="word">elievers</span>
          <span className="gold">e</span>
        </div>
      </div>

      <nav className="hidden sm:flex gap-4 items-center">
        <Link href="/dashboard">Home</Link>
        <a>Friends</a>
        <a>Groups</a>
        <a>Videos</a>
        <a>Bible</a>
        <a>Shorts</a>
        <a>Music</a>
      </nav>

      <div className="flex items-center gap-3">
        <button className="btn btn-ghost">🔔</button>

        {user ? (
          <div className="flex items-center gap-2">
            <img
              src={profile?.avatar_url || "/images/default-avatar.png"}
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover"
            />

            <Link href="/profile/edit">
              <span className="underline">
                {profile?.full_name || user.email}
              </span>
            </Link>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/">Sign in</Link>
            <Link href="/signup" className="btn btn-cta">
              Create Account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
