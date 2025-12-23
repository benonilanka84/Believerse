"use client";

import DailyVerseWidget from "@/components/DailyVerseWidget";
import DailyPrayerWidget from "@/components/DailyPrayerWidget";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CreatePost from "@/components/CreatePost";
import Link from "next/link";
import "@/styles/dashboard.css";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  // Data States
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // Widget Data
  const [suggestedBelievers, setSuggestedBelievers] = useState([]);
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [recentChats, setRecentChats] = useState([]);

  // Events State
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredEvents, setFilteredEvents] = useState([]);

  // UI States
  const [openMenuId, setOpenMenuId] = useState(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState({}); 
  const [blessModalUser, setBlessModalUser] = useState(null); 
  const [supportModalOpen, setSupportModalOpen] = useState(false); 

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => { setMounted(true); }, []);

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

  function loadAllData(uid) {
    loadPosts(uid);
    loadSuggestedBelievers(uid);
    loadPrayerWall(uid);
    loadRecentChats(uid);
    loadUpcomingEvents();
  }

  async function loadPosts(currentUserId, isRefresh = false) {
    if (!isRefresh) setLoadingPosts(true);
    const { data, error } = await supabase.from('posts').select(`*, profiles (username, full_name, avatar_url, upi_id), amens (user_id)`).neq('type', 'Prayer').order('created_at', { ascending: false });
    if (!error && data) {
      const formatted = data.map(p => ({ ...p, author: p.profiles, amenCount: p.amens.length, hasAmened: p.amens.some(a => a.user_id === currentUserId) }));
      setPosts(formatted);
    }
    setLoadingPosts(false);
  }

  // --- DATA FETCHERS ---
  async function loadSuggestedBelievers(userId) {
    const { data } = await supabase.from('profiles').select('*').neq('id', userId).limit(3);
    if (data) setSuggestedBelievers(data);
  }

  async function loadPrayerWall(userId) {
    const { data: conns } = await supabase.from('connections').select('user_a, user_b').or(`user_a.eq.${userId},user_b.eq.${userId}`).eq('status', 'connected');
    let friendIds = [userId]; 
    if (conns) { conns.forEach(c => { if (c.user_a !== userId) friendIds.push(c.user_a); if (c.user_b !== userId) friendIds.push(c.user_b); }); friendIds = Array.from(new Set(friendIds)); }
    const { data } = await supabase.from('posts').select('id, content, user_id, profiles(full_name)').eq('type', 'Prayer').in('user_id', friendIds).order('created_at', { ascending: false }).limit(5);
    setPrayerRequests(data || []);
  }

  async function loadRecentChats(userId) {
    const { data: msgs } = await supabase.from('messages').select('sender_id, receiver_id').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: false }).limit(20);
    if (!msgs) return;
    const partnerIds = new Set();
    msgs.forEach(m => { if (m.sender_id !== userId) partnerIds.add(m.sender_id); if (m.receiver_id !== userId) partnerIds.add(m.receiver_id); });
    if (partnerIds.size > 0) { const { data: profiles } = await supabase.from('profiles').select('*').in('id', Array.from(partnerIds)).limit(3); setRecentChats(profiles || []); }
  }

  async function loadUpcomingEvents() {
    const { data } = await supabase.from('events').select('*').gte('event_date', new Date().toISOString().split('T')[0]).order('event_date', { ascending: true });
    if (data) setEvents(data);
  }

  // --- ACTIONS ---
  async function handleAmen(post, currentlyAmened) {
    setPosts(posts.map(p => p.id === post.id ? { ...p, hasAmened: !currentlyAmened, amenCount: currentlyAmened ? p.amenCount - 1 : p.amenCount + 1 } : p));
    if (currentlyAmened) { await supabase.from('amens').delete().match({ user_id: user.id, post_id: post.id }); } 
    else { await supabase.from('amens').insert({ user_id: user.id, post_id: post.id }); }
  }

  async function toggleComments(postId) {
    if (activeCommentPostId === postId) { setActiveCommentPostId(null); } 
    else {
      setActiveCommentPostId(postId);
      if (!comments[postId]) {
        const { data } = await supabase.from('comments').select('*, profiles(full_name, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true });
        setComments(prev => ({ ...prev, [postId]: data || [] }));
      }
    }
  }

  async function postComment(postId) {
    if (!newComment.trim()) return;
    const tempComment = { id: Date.now(), post_id: postId, content: newComment, created_at: new Date().toISOString(), profiles: { full_name: profile.full_name, avatar_url: profile.avatar_url } };
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), tempComment] }));
    setNewComment("");
    await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content: tempComment.content });
  }

  if (!mounted) return null;
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Believer';

  return (
    <div className="dashboard-wrapper">
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "20px 30px", borderRadius: "12px", color: "white", marginBottom: "20px", display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div><h2 style={{ margin: 0 }}>Welcome, {firstName}</h2><p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>Walking with God and fellow Believers</p></div>
      </div>

      <div className="dashboard-grid">
        <div className="left-panel">
          <DailyVerseWidget />
          <DailyPrayerWidget />
        </div>

        <div className="center-panel">
          {user && <CreatePost user={user} onPostCreated={() => loadPosts(user.id, true)} />}
          <div className="panel-card">
            <h3>🏠 The Walk</h3>
            {loadingPosts ? <p>Loading...</p> : posts.map(post => (
               <div key={post.id} style={{ border:'1px solid #eee', borderRadius:'12px', padding:'15px', marginBottom:'15px', background:'#fafafa' }}>
                 <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                   <img src={post.author?.avatar_url || '/images/default-avatar.png'} style={{width:40, height:40, borderRadius:'50%', objectFit:'cover'}} />
                   <div><div style={{fontWeight:'bold', color:'#0b2e4a'}}>{post.author?.full_name}</div><div style={{fontSize:'12px', color:'#666'}}>{new Date(post.created_at).toDateString()}</div></div>
                 </div>
                 <p>{post.content}</p>
                 {post.media_url && (
                   <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', background: '#000', width: '100%' }}>
                     {post.media_url.includes("iframe.mediadelivery.net") || post.media_url.includes("video.bunnycdn") ? (
                       /* --- THE SMART ASPECT RATIO CONTAINER --- */
                       <div style={{ 
                         position: 'relative', 
                         width: '100%', 
                         aspectRatio: post.type === 'Glimpse' ? '9/16' : '16/9',
                         background: '#000'
                       }}>
                         <iframe 
                           src={post.media_url + "?autoplay=false&loop=false"} 
                           style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} 
                           allowFullScreen 
                         />
                       </div>
                     ) : (
                       <img src={post.media_url} style={{width:'100%', display:'block'}} />
                     )}
                   </div>
                 )}
                 <div style={{display:'flex', gap:'15px', marginTop:'15px'}}>
                   <button onClick={() => handleAmen(post, post.hasAmened)}>🙏 {post.amenCount}</button>
                   <button onClick={() => toggleComments(post.id)}>💬 Comment</button>
                 </div>
               </div>
            ))}
          </div>
        </div>

        <div className="right-panel">
          {/* RESTORED CHAT WIDGET */}
          <div className="panel-card">
            <h3>💬 Recent Chats</h3>
            {recentChats.map(c => (
              <Link key={c.id} href={`/chat?uid=${c.id}`} style={{display:'flex', alignItems:'center', gap:'10px', padding:'8px', background:'#f5f5f5', borderRadius:'8px', marginBottom:'5px', textDecoration:'none', color: '#000'}}>
                <img src={c.avatar_url || '/images/default-avatar.png'} style={{width:30, height:30, borderRadius:'50%'}} />
                <div style={{fontSize:'13px', fontWeight:'bold'}}>{c.full_name}</div>
              </Link>
            ))}
          </div>
          
          <div className="panel-card">
            <h3>🤝 Suggested</h3>
            {suggestedBelievers.map(b => (
              <div key={b.id} style={{padding:'5px 0', fontSize:'13px'}}>{b.full_name}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getDaysInMonth(date) {
  const year = date.getFullYear(); const month = date.getMonth();
  return { daysInMonth: new Date(year, month + 1, 0).getDate(), startingDayOfWeek: new Date(year, month, 1).getDay() };
}