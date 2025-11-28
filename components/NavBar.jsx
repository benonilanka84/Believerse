'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function NavBar() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // -------------------------------------------------------
  // 🔹 Load User + Profile
  // -------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user || null;
      setUser(authUser);

      if (authUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        setProfile(profileData);
      }
    };

    load();

    // Listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const authUser = session?.user || null;
        setUser(authUser);

        if (authUser) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();

          setProfile(profileData);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // -------------------------------------------------------
  // 🔹 Avatar Logic (Fixed)
  // -------------------------------------------------------
  const getAvatar = () => {
    if (profile?.avatar_url) return profile.avatar_url;

    if (profile?.full_name) {
      return `https://ui-avatars.com/api/?name=${profile.full_name[0]}&background=0D8ABC&color=fff&size=128`;
    }

    return "/images/default-avatar.png";
  };

  return (
    <header className="card flex items-center justify-between mb-4 px-4 py-3">
      
      {/* LEFT — Logo */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <img
            src="/images/final-logo.png"
            alt="The Believerse Logo"
            className="h-10 w-auto cursor-pointer"
          />
        </Link>

        <div className="hidden md:block">
          <input
            placeholder="Search The Believerse"
            className="rounded px-3 py-2 text-black"
          />
        </div>
      </div>

      {/* CENTER — Menu */}
      <nav className="hidden sm:flex gap-4 items-center">
        <Link href="/dashboard">Home</Link>
        <a>Friends</a>
        <a>Groups</a>
        <a>Videos</a>
        <a>Bible</a>
        <a>Shorts</a>
        <a>Music</a>
      </nav>

      {/* RIGHT — Avatar + Name */}
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost">🔔</button>

        {user ? (
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <img
              src={getAvatar()}
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover border border-gray-300"
            />

            {/* User name */}
            <Link href={`/profile/${user.id}`}>
              <span className="underline">{profile?.full_name || user.email}</span>
            </Link>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/">Sign in</Link>
            <Link href="/signup" className="btn btn-cta">
              Create account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
