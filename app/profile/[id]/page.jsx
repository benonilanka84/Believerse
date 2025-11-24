'use client';
import { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';

export default function ProfilePage({ params }) {
  const router = useRouter();
  const userId = params.id;
  const [profile, setProfile] = useState(null);

  useEffect(()=> {
    const load = async () => {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        setProfile(data || null);
      } catch (e) { console.error(e); }
    };
    load();
  }, [userId]);

  if(!profile) return <div className="card">Loading profile...</div>;

  return (
    <div className="card">
      <div className="flex gap-4 items-center">
        <img src="/images/default-avatar.png" className="w-24 h-24 rounded-full" alt="avatar" />
        <div>
          <h2>{profile.full_name || profile.username}</h2>
          <p>Following: 0 • Photos: 0 • Videos: 0</p>
        </div>
      </div>
      <div className="mt-4">
        <h4>About</h4>
        <p>{profile.bio}</p>
        <h4>Faith Journey</h4>
        <p>{profile.faith_journey}</p>
      </div>
    </div>
  );
}
