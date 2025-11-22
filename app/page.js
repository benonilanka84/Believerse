'use client';

import { useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function signIn() {
    if (!email || !password) return alert('Please enter both email and password.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert('Login failed: ' + error.message);
    router.push('/dashboard');
  }

  return (
    <div className="container grid md:grid-cols-2 gap-6 items-center">
      <div>
        <p className="italic">“I can do all things through Christ who strengthens me.” — Philippians 4:13</p>
        <h1 className="text-6xl brand mt-4">
          <span className="the">The</span> <span className="gold">B</span>
          <span className="word">elievers</span><span className="green">e</span>
        </h1>
        <p className="tagline mt-2">One Family in Christ.</p>
      </div>

      <div className="card">
        <h2>Welcome to The Believerse</h2>
        <p>Sign in or create a new account to join the family.</p>

        <input
          className="w-full my-2 p-2 rounded"
          placeholder="Email address or username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full my-2 p-2 p-2 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex gap-2 mt-3">
          <button className="btn btn-primary" onClick={signIn}>Log in</button>
          <button className="btn btn-cta" onClick={() => router.push('/signup')}>Create new account</button>
        </div>

        <div className="mt-2">
          <a
            href="#"
            onClick={async () => {
              const emailPrompt = prompt('Enter your email to reset');
              if (emailPrompt) {
                await supabase.auth.resetPasswordForEmail(emailPrompt, {
                  redirectTo: window.location.origin + '/profile',
                });
                alert('Password reset sent');
              }
            }}
          >
            Forgotten password?
          </a>
        </div>
      </div>
    </div>
  );
}
