'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [prayers, setPrayers] = useState([]);

  useEffect(()=> {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if(!data.user) return router.push('/');
      setUser(data.user);
      try {
        const { data: prayersData } = await supabase.from('prayers').select('*').order('created_at', { ascending: false }).limit(10);
        setPrayers(prayersData || []);
      } catch (e) { console.log(e); }
    };
    load();
  }, []);

  async function addPrayer() {
    const text = prompt('Enter a short prayer request (visible to community):');
    if(!text) return;
    const { data } = await supabase.auth.getUser();
    const userId = data.user.id;
    await supabase.from('prayers').insert([{ user_id: userId, message: text }]);
    setPrayers(prev => [{ user_id: userId, message: text, created_at: new Date().toISOString() }, ...prev]);
  }

  return (
    <div className="grid-2">
      <div className="space-y-4">
        <div className="card">
          <h2>Welcome, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email}</h2>
          <p className="italic">“The Lord is my shepherd; I shall not want.” — Psalm 23:1</p>
          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary">Read Devotional</button>
            <button className="btn btn-ghost">Latest Sermon</button>
          </div>
        </div>

        <div className="card">
          <h3>Featured Sermon</h3>
          <p>Walking in Faith — Pastor John</p>
          <div className="mt-2"><button className="btn btn-cta">Watch</button></div>
        </div>

        <div className="card">
          <h3>Upcoming Events</h3>
          <ul>
            <li>Friday Prayer Night — 7:00 PM</li>
            <li>Sunday Worship — 10:00 AM</li>
          </ul>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card">
          <h4>Prayer Requests</h4>
          {prayers.length ? prayers.map((p,i)=> (
            <p key={i} className="mb-2">{p.message}</p>
          )) : <p>No prayer requests yet.</p>}
          <button className="btn btn-primary mt-2" onClick={addPrayer}>Add Prayer Request</button>
        </div>

        <div className="card">
          <h4>Groups & Fellowships</h4>
          <ul>
            <li>Morning Devotionals</li>
            <li>Youth Fellowship</li>
            <li>Women in Faith</li>
          </ul>
          <button className="btn btn-ghost mt-2">Explore Groups</button>
        </div>

        <div className="card">
          <h4>Notifications</h4>
          <p>No new notifications</p>
        </div>
      </aside>
    </div>
  );
}
