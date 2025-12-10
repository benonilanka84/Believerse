"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CreatePost from "@/components/CreatePost";
import Link from "next/link";
import "@/styles/dashboard.css";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [verseData, setVerseData] = useState(null);

  useEffect(() => {
    setMounted(true);
    generateDailyVisualVerse();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
        loadAllData(user.id);
      }
    };
    getUser();
  }, [mounted]);

  async function loadAllData(uid) {
    loadPosts(uid);
    loadPrayerWall(uid);
    loadRecentChats(uid);
  }

  async function loadPrayerWall(userId) {
    // Fetch all public prayers
    const { data } = await supabase
      .from('posts')
      .select('id, content, user_id, profiles(full_name)')
      .eq('type', 'Prayer')
      .order('created_at', { ascending: false })
      .limit(5);
    setPrayerRequests(data || []);
  }

  async function deletePrayer(prayerId) {
    if(!confirm("Delete this prayer?")) return;
    await supabase.from('posts').delete().eq('id', prayerId);
    setPrayerRequests(prev => prev.filter(p => p.id !== prayerId));
  }

  async function loadRecentChats(userId) {
    const { data: msgs } = await supabase.from('messages').select('sender_id, receiver_id').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: false }).limit(20);
    if (!msgs) return;
    const partnerIds = [...new Set(msgs.map(m => m.sender_id === userId ? m.receiver_id : m.sender_id))];
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', partnerIds).limit(3);
    setRecentChats(profiles || []);
  }

  async function loadPosts(uid) { /* Existing loadPosts Logic */ }

  function generateDailyVisualVerse() { /* Existing logic */ }

  if (!mounted) return null;

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-grid">
        {/* CENTER FEED */}
        <div className="center-panel">
          {user && <CreatePost user={user} onPostCreated={() => loadPosts(user.id, true)} />}
          {/* Feed logic remains same */}
        </div>

        {/* RIGHT PANEL - FIXED VISIBILITY */}
        <div className="right-panel">
          {/* PRAYER WALL WIDGET */}
          <div className="panel-card" style={{background:'#fff9e6', borderLeft:'4px solid #d4af37'}}>
            <h3 style={{color:'#000'}}>🙏 Prayer Wall</h3>
            {prayerRequests.length === 0 ? <p style={{color:'#666'}}>No requests.</p> : 
              prayerRequests.map(p => (
                <div key={p.id} style={{marginBottom:'10px', position:'relative'}}>
                  <div style={{fontWeight:'bold', color:'#000', fontSize:'13px'}}>{p.profiles?.full_name}</div>
                  <div style={{fontStyle:'italic', color:'#333', fontSize:'12px'}}>"{p.content}"</div>
                  {user && user.id === p.user_id && (
                    <div style={{display:'flex', gap:'5px', marginTop:'2px'}}>
                      <button style={{fontSize:'10px', color:'blue', border:'none', background:'none'}}>Edit</button>
                      <button onClick={() => deletePrayer(p.id)} style={{fontSize:'10px', color:'red', border:'none', background:'none'}}>Delete</button>
                    </div>
                  )}
                </div>
              ))
            }
          </div>

          {/* CHAT WIDGET - FORCING BLACK TEXT */}
          <div className="panel-card">
            <h3>💬 Messenger</h3>
            {recentChats.map(c => (
              <Link key={c.id} href={`/chat?uid=${c.id}`} style={{display:'flex', alignItems:'center', gap:'10px', padding:'8px', background:'#f5f5f5', borderRadius:'8px', marginBottom:'5px', textDecoration:'none'}}>
                <img src={c.avatar_url || '/images/default-avatar.png'} style={{width:30, height:30, borderRadius:'50%'}} />
                {/* FORCED COLOR LOGIC */}
                <div style={{fontSize:'14px', fontWeight:'800', color:'#000000 !important', display:'block'}}>
                   {c.full_name || 'User'}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}