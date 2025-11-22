'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function NavBar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    };
    init();
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
  }, []);

  return (
    <header className="card flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <div className="brand">
          <span className="the">The</span>
          <span className="gold">B</span>
          <span className="word">elievers</span><span className="gold">e</span>
        </div>
        <div className="hidden md:block">
          <input placeholder="Search The Believerse" className="rounded px-3 py-2 text-black" />
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
            <img src="/images/default-avatar.png" alt="avatar" className="w-9 h-9 rounded-full object-cover" />
            <Link href={`/profile/${user.id}`}><span className="underline">{user.user_metadata?.full_name || user.email}</span></Link>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/">Sign in</Link>
            <Link href="/signup" className="btn btn-cta">Create account</Link>
          </div>
        )}
      </div>
    </header>
  );
}
