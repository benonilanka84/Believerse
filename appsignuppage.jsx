'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const router = useRouter();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [agree2, setAgree2] = useState(false);

  async function submit() {
    if(!first || !last) return alert('Enter name');
    if(!username) return alert('Choose username');
    if(!email) return alert('Email required');
    if(password.length < 8) return alert('Password min 8 chars');
    if(!agree || !agree2) return alert('Agree to terms and content policy');

    const { data: existing } = await supabase.from('profiles').select('id').eq('username', username).limit(1);
    if(existing && existing.length) return alert('Username taken');

    const { data, error } = await supabase.auth.signUp({ email, password }, { data: { full_name: `${first} ${last}`, username } });
    if(error) return alert('Signup failed: ' + error.message);

    const user = data.user;
    if(user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        email,
        full_name: `${first} ${last}`,
        username
      }, { returning: 'minimal' });
    }
    alert('Account created. Please verify your email if required. Redirecting to sign-in.');
    router.push('/');
  }

  return (
    <div className="container grid md:grid-cols-2 gap-6 items-center">
      <div>
        <p className="italic">“I can do all things through Christ who strengthens me.” — Philippians 4:13</p>
        <h1 className="text-6xl brand mt-4"><span className="the">The</span> <span className="gold">B</span><span className="word">elievers</span><span className="green">e</span></h1>
        <p className="tagline mt-2">One Family in Christ.</p>
      </div>
      <div className="card">
        <h2>Create a new account</h2>
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="First name" value={first} onChange={e=>setFirst(e.target.value)} className="p-2 rounded" />
          <input placeholder="Last name" value={last} onChange={e=>setLast(e.target.value)} className="p-2 rounded" />
        </div>
        <input placeholder="Choose a username" value={username} onChange={e=>setUsername(e.target.value)} className="p-2 rounded my-2" />
        <input placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} className="p-2 rounded my-2" />
        <input placeholder="New password (min 8 chars)" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="p-2 rounded my-2" />
        <div className="mt-2">
          <label><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} /> I agree to The Believerse Terms & Conditions.</label>
        </div>
        <div>
          <label><input type="checkbox" checked={agree2} onChange={e=>setAgree2(e.target.checked)} /> I will post only faith-based Christian content and understand that unrelated or prohibited content is not allowed on this platform.</label>
        </div>
        <button className="btn btn-cta mt-3" onClick={submit} disabled={!(agree && agree2)}>Sign Up</button>
        <p className="mt-2">Already have an account? <a href="/">Sign in</a></p>
      </div>
    </div>
  );
}
