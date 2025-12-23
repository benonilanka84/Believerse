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

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    setMounted(true);
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

  function loadAllData(uid) {
    loadPosts(uid);
    loadSuggestedBelievers(uid);
    loadPrayerWall(uid);
    loadRecentChats(uid);
    loadUpcomingEvents();
  }

  async function loadPosts(currentUserId, isRefresh = false) {
    if (!isRefresh) setLoadingPosts(true);
    const { data, error } = await supabase
      .from('posts')
      .select(`*, profiles (username, full_name, avatar_url, upi_id), amens (user_id)`)
      .neq('type', 'Prayer')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formatted = data.map(p => ({
        ...p,
        author: p.profiles,
        amenCount: p.amens.length,
        hasAmened: p.amens.some(a => a.user_id === currentUserId)
      }));
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
    const { data } = await supabase.from('posts').select('id, content, profiles(full_name)').eq('type', 'Prayer').limit(5);
    setPrayerRequests(data || []);
  }

  async function loadRecentChats(userId) {
    const { data } = await supabase.from('profiles').select('*').limit(3);
    setRecentChats(data || []);
  }

  async function loadUpcomingEvents() {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    setEvents(data || []);
  }

  const handleDateClick = (day) => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day));

  // --- UI HELPERS ---
  const getBadgeUI = () => {
    if (!profile?.subscription_plan) return null;
    const plan = profile.subscription_plan.toLowerCase();
    if (plan.includes('platinum')) return <span className="badge-platinum">💎 Platinum</span>;
    if (plan.includes('gold')) return <span className="badge-gold">🥇 Gold</span>;
    return null;
  };

  if (!mounted) return null;
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Believer';
  const { daysInMonth, startingDayOfWeek } = { 
    daysInMonth: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate(), 
    startingDayOfWeek: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay() 
  };

  return (
    <div className="dashboard-wrapper">
      {/* HEADER SECTION */}
      <div className="dashboard-header" style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "25px", borderRadius: "15px", color: "white", marginBottom: "25px" }}>
        <h2 style={{ margin: 0 }}>Welcome, {firstName} {getBadgeUI()}</h2>
        <p style={{ margin: "5px 0 0 0", opacity: 0.8 }}>"Your word is a lamp to my feet..."</p>
      </div>

      <div className="dashboard-grid">
        {/* LEFT COLUMN: RESTORED FOR WIDGETS */}
        <div className="left-panel">
          <DailyVerseWidget />
          <DailyPrayerWidget />
          
          <div className="panel-card">
            <h3>📅 Events - {monthNames[selectedDate.getMonth()]}</h3>
            <div className="calendar-mini" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px", textAlign: "center", fontSize: "12px" }}>
               {["S","M","T","W","T","F","S"].map(d => <div key={d} style={{fontWeight:"bold"}}>{d}</div>)}
               {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={i} />)}
               {Array.from({ length: daysInMonth }).map((_, i) => (
                 <div key={i} onClick={() => handleDateClick(i+1)} style={{ padding: "5px", cursor: "pointer", background: (i+1) === selectedDate.getDate() ? "#2e8b57" : "transparent", color: (i+1) === selectedDate.getDate() ? "white" : "inherit", borderRadius: "4px" }}>
                   {i+1}
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: THE WALK */}
        <div className="center-panel">
          {user && <CreatePost user={user} onPostCreated={() => loadPosts(user.id, true)} />}
          
          <div className="feed-container">
            {loadingPosts ? <div className="loading">Loading The Walk...</div> : 
              posts.map(post => (
                <div key={post.id} className="post-card" style={{ background: "white", borderRadius: "12px", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "15px" }}>
                    <img src={post.author?.avatar_url || '/images/default-avatar.png'} style={{ width: 45, height: 45, borderRadius: "50%", objectFit: "cover" }} />
                    <div>
                      <div style={{ fontWeight: "bold", color: "#0b2e4a" }}>{post.author?.full_name}</div>
                      <div style={{ fontSize: "12px", color: "#888" }}>{new Date(post.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <p style={{ lineHeight: "1.6", color: "#333", marginBottom: "15px" }}>{post.content}</p>

                  {/* --- THE ULTIMATE VIDEO FIX --- */}
                  {post.media_url && (
                    <div style={{ borderRadius: "12px", overflow: "hidden", background: "#000", width: "100%", position: "relative" }}>
                      {post.media_url.includes("iframe") || post.media_url.includes("bunny") ? (
                        <div style={{ width: "100%", aspectRatio: post.type === "Glimpse" ? "9/16" : "16/9" }}>
                          <iframe 
                            src={post.media_url} 
                            style={{ width: "100%", height: "100%", border: "none" }} 
                            allowFullScreen 
                          />
                        </div>
                      ) : (
                        <img src={post.media_url} style={{ width: "100%", display: "block" }} />
                      )}
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </div>

        {/* RIGHT COLUMN: SOCIAL */}
        <div className="right-panel">
          <div className="panel-card">
            <h3>🤝 Suggested</h3>
            {suggestedBelievers.map(b => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <img src={b.avatar_url || '/images/default-avatar.png'} style={{ width: 30, height: 30, borderRadius: "50%" }} />
                <span style={{ fontSize: "14px" }}>{b.full_name}</span>
              </div>
            ))}
          </div>

          <div className="panel-card" style={{ background: "#fff9e6" }}>
            <h3>🙏 Prayer Wall</h3>
            {prayerRequests.map(p => (
              <div key={p.id} style={{ fontSize: "13px", borderBottom: "1px solid #eee", padding: "10px 0" }}>
                <strong>{p.profiles?.full_name}</strong>: {p.content.substring(0, 50)}...
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}