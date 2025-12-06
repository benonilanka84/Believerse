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
  
  // Data States
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [verse, setVerse] = useState(null);
  const [verseImage, setVerseImage] = useState(null); // Restored
  
  // Restored States for UI
  const [events, setEvents] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    setMounted(true);
    fetchVerseOfTheDay();
    loadDummyEvents(); // Restored
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch full profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        setProfile(profileData);
        loadPosts(user.id);
        loadDummyConversations(user.id); // Restored
      }
    };

    getUser();
  }, [mounted]);

  // --- 1. REAL SUPABASE POSTS ---
  async function loadPosts(currentUserId) {
    setLoadingPosts(true);
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (username, full_name, avatar_url),
        amens (user_id)
      `)
      .order('created_at', { ascending: false });

    if (!error) {
      const formattedPosts = data.map(post => ({
        ...post,
        author: post.profiles,
        amenCount: post.amens.length,
        hasAmened: post.amens.some(amen => amen.user_id === currentUserId)
      }));
      setPosts(formattedPosts);
    }
    setLoadingPosts(false);
  }

  async function handlePostCreated() {
    if (user) loadPosts(user.id);
  }

  async function handleDeletePost(postId) {
    if (!confirm("Remove this from The Walk?")) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
    if (!error) setPosts(posts.filter(p => p.id !== postId));
  }

  async function handleAmen(postId, currentlyAmened) {
    // Optimistic Update
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          hasAmened: !currentlyAmened,
          amenCount: currentlyAmened ? p.amenCount - 1 : p.amenCount + 1
        };
      }
      return p;
    }));

    if (currentlyAmened) {
      await supabase.from('amens').delete().match({ user_id: user.id, post_id: postId });
    } else {
      await supabase.from('amens').insert({ user_id: user.id, post_id: postId });
    }
  }

  // --- 2. RESTORED DUMMY DATA (Events & Chat) ---
  function loadDummyEvents() {
    // Using static data so the UI isn't empty
    setEvents([
      { id: 1, title: "Morning Prayer", date: new Date().toISOString().split('T')[0], time: "06:00 AM" },
      { id: 2, title: "Youth Fellowship", date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: "05:00 PM" }
    ]);
  }

  function loadDummyConversations() {
    setConversations([
      { id: 1, believerName: "John Doe", lastMessage: "God bless you! 🙏", lastMessageTime: new Date().toISOString(), unread: 2 },
      { id: 2, believerName: "Mary Smith", lastMessage: "Praying for you", lastMessageTime: new Date().toISOString(), unread: 0 }
    ]);
  }

  // --- 3. UTILS & UI HELPERS ---
  function fetchVerseOfTheDay() {
    const bibleVerses = [
      { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
      { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" }
    ];
    const random = bibleVerses[Math.floor(Math.random() * bibleVerses.length)];
    setVerse(random);
    setVerseImage(generateVerseImage(random.text, random.ref));
  }

  function generateVerseImage(verseText, reference) {
    // Simple SVG generation for the image feature
    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900"><rect width="600" height="900" fill="#2e8b57" /><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="30" font-family="Georgia">${verseText}</text></svg>`;
  }

  function getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    return { 
      daysInMonth: new Date(year, month + 1, 0).getDate(), 
      startingDayOfWeek: new Date(year, month, 1).getDay() 
    };
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  function getPostTypeColor(type) {
    const colors = { Testimony: "#2e8b57", Scripture: "#2d6be3", Prayer: "#8b5cf6" };
    return colors[type] || "#2e8b57";
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);
  const upcomingEvents = events.slice(0, 3); // Simple slice for demo

  if (!mounted) return null;

  return (
    <div className="dashboard-wrapper">
      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "20px 30px", borderRadius: "12px", color: "white", marginBottom: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
        <h2 style={{ margin: 0, fontSize: "1.8rem" }}>🏠 The Walk</h2>
        <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>Walking with {profile?.full_name || "Believer"}</p>
      </div>

      <div className="dashboard-grid">
        
        {/* LEFT PANEL: Verse & Calendar (RESTORED) */}
        <div className="left-panel">
          <div className="panel-card">
            <h3>📖 Verse of the Day</h3>
            {verse && (
              <>
                <p className="verse-text">"{verse.text}"<br /><span className="verse-ref">— {verse.ref}</span></p>
                <div className="btn-row">
                  <button className="btn" onClick={() => navigator.clipboard.writeText(verse.text)}>Copy</button>
                </div>
              </>
            )}
          </div>

          <div className="panel-card verse-image-panel">
            <h3>🖼️ Verse Image</h3>
            {verseImage && <div className="verse-image-box" dangerouslySetInnerHTML={{ __html: verseImage }} />}
          </div>

          <div className="panel-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0 }}>📅 Events</h3>
              <Link href="/events" style={{ fontSize: "12px", color: "#2e8b57", fontWeight: "600" }}>View All →</Link>
            </div>
            
            {/* Calendar UI */}
            <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "10px", marginBottom: "15px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: "12px", padding: "5px", background: (i+1) === new Date().getDate() ? "#2e8b57" : "transparent", color: (i+1) === new Date().getDate() ? "white" : "black", borderRadius: "4px" }}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {upcomingEvents.map(event => (
              <div key={event.id} style={{ padding: "10px", background: "#f9f9f9", borderRadius: "8px", marginBottom: "8px", borderLeft: "3px solid #2e8b57" }}>
                <div style={{ fontSize: "13px", fontWeight: "600" }}>{event.title}</div>
                <div style={{ fontSize: "11px", color: "#666" }}>📅 {event.date} • {event.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER PANEL: Feed (REAL SUPABASE) */}
        <div className="center-panel">
          {user && <CreatePost user={user} profile={profile} onPostCreated={handlePostCreated} />}
          
          <div className="panel-card">
            <h3>🏠 Your Walk</h3>
            {loadingPosts ? (
              <p style={{padding: 20, textAlign: 'center'}}>Loading The Walk...</p>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>📝</div>
                <h4 style={{ color: "#0b2e4a", marginBottom: "8px" }}>The Walk is quiet</h4>
                <p style={{ fontSize: "14px" }}>Be the first to share a testimony!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} style={{ border: "1px solid #e0e0e0", borderRadius: "12px", padding: "15px", marginBottom: "15px", background: "#fafafa", borderLeft: `4px solid ${getPostTypeColor(post.type)}` }}>
                  
                  {/* Post Header */}
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "10px", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {post.author?.avatar_url ? (
                         <img src={post.author.avatar_url} style={{ width: "40px", height: "40px", borderRadius: "50%", marginRight: "10px", objectFit: "cover"}} />
                      ) : (
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#2e8b57", marginRight: "10px", display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                          {post.author?.full_name?.[0] || "B"}
                        </div>
                      )}
                      <div>
                        <strong>{post.author?.full_name || "Unknown Believer"}</strong>
                        <div style={{ fontSize: "12px", color: "#666" }}>@{post.author?.username} • {new Date(post.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      <span style={{ background: getPostTypeColor(post.type), color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>
                        {post.type}
                      </span>
                      {post.user_id === user?.id && (
                        <button onClick={() => handleDeletePost(post.id)} style={{ border: "none", background: "none", cursor: "pointer", color: '#d62828' }}>🗑️</button>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <p style={{ margin: "10px 0", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{post.content}</p>
                  
                  {/* Bible Reference Box */}
                  {post.bible_verse_text && (
                    <div style={{ background: "#f0f7ff", padding: "10px", borderRadius: "8px", marginTop: "10px", borderLeft: "3px solid #2d6be3", fontSize: "14px", fontStyle: "italic" }}>
                      "{post.bible_verse_text}" 
                      <div style={{fontWeight: 'bold', marginTop: 5, fontStyle: 'normal'}}>— {post.bible_verse_ref}</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "20px", borderTop: "1px solid #e0e0e0", paddingTop: "10px", marginTop: "10px" }}>
                    <button 
                      onClick={() => handleAmen(post.id, post.hasAmened)} 
                      style={{ 
                        background: "none", 
                        border: "none", 
                        cursor: "pointer", 
                        color: post.hasAmened ? "#2e8b57" : "#666", 
                        fontWeight: post.hasAmened ? "700" : "400",
                        display: "flex", alignItems: "center", gap: "5px"
                      }}>
                      🙏 {post.hasAmened ? "Amened" : "Amen"} ({post.amenCount})
                    </button>
                    <button style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}>
                      💬 Comment
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Suggestions & Chat (RESTORED) */}
        <div className="right-panel">
          <div className="panel-card">
            <h3>🤝 Connect</h3>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "#2e8b57", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: "bold", marginRight: "10px" }}>{String.fromCharCode(65 + i)}</div>
                  <div><strong style={{ fontSize: "14px" }}>Believer {i}</strong></div>
                </div>
                <button className="btn" style={{ padding: "6px 12px", fontSize: "12px" }}>➕ Connect</button>
              </div>
            ))}
          </div>

          <div className="panel-card" style={{ background: "#fff9e6", borderLeft: "4px solid #d4af37" }}>
            <h3>🙏 Prayer Request</h3>
            <p style={{ fontSize: "14px", marginBottom: "10px" }}>"Please pray for my job interview"</p>
            <button className="btn" style={{ width: "100%", background: "#2e8b57", color: "white" }}>🙏 I'll Pray</button>
          </div>

          <div className="panel-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0 }}>💬 Messages</h3>
              <Link href="/chat" style={{ fontSize: "12px", color: "#2e8b57", fontWeight: "600" }}>View All →</Link>
            </div>
            {conversations.map(convo => (
              <div key={convo.id} style={{ padding: "10px", background: "#f9f9f9", borderRadius: "8px", marginBottom: "10px" }}>
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>{convo.believerName}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>{convo.lastMessage}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}