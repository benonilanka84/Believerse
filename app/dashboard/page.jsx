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
  
  // Data
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Verse State
  const [verseData, setVerseData] = useState(null);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    setMounted(true);
    generateDailyVisualVerse();
    loadEvents(); // Load dummy events
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
        loadPosts(user.id);
      }
    };
    getUser();
  }, [mounted]);

  // --- 1. VISUAL VERSE LOGIC (Fixed) ---
  function generateDailyVisualVerse() {
    const verses = [
      { 
        text: "I am the good shepherd. The good shepherd lays down his life for the sheep.", 
        ref: "John 10:11", 
        bg: "https://images.unsplash.com/photo-1484557985045-6f5c98486c90?auto=format&fit=crop&w=800&q=80" // Sheep
      },
      { 
        text: "The Lord is my light and my salvation; whom shall I fear?", 
        ref: "Psalm 27:1", 
        bg: "https://images.unsplash.com/photo-1505322022379-7c3353ee6291?auto=format&fit=crop&w=800&q=80" // Light
      },
      { 
        text: "He leads me beside still waters.", 
        ref: "Psalm 23:2", 
        bg: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80" // Water
      }
    ];
    // Rotate by day
    const dayIndex = new Date().getDate() % verses.length;
    setVerseData(verses[dayIndex]);
  }

  // --- 2. EVENTS LOGIC ---
  function loadEvents() {
    // Dummy events for now
    const today = new Date().toISOString().split('T')[0];
    setEvents([
      { id: 1, title: "Morning Prayer", date: today, time: "06:00 AM" },
      { id: 2, title: "Youth Fellowship", date: "2025-12-10", time: "05:00 PM" }
    ]);
  }

  function getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  }

  // --- 3. FEED LOGIC (Supabase) ---
  async function loadPosts(currentUserId) {
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from('posts')
      .select(`*, profiles (username, full_name, avatar_url), amens (user_id)`)
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

  async function handleAmen(postId, currentlyAmened) {
    // Optimistic UI
    setPosts(posts.map(p => p.id === postId ? 
      { ...p, hasAmened: !currentlyAmened, amenCount: currentlyAmened ? p.amenCount - 1 : p.amenCount + 1 } : p
    ));
    // Database call
    if (currentlyAmened) {
      await supabase.from('amens').delete().match({ user_id: user.id, post_id: postId });
    } else {
      await supabase.from('amens').insert({ user_id: user.id, post_id: postId });
    }
  }

  function getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    return { 
      daysInMonth: new Date(year, month + 1, 0).getDate(), 
      startingDayOfWeek: new Date(year, month, 1).getDay() 
    };
  }

  if (!mounted) return null;

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);
  const selectedDayEvents = getEventsForDate(selectedDate);
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Believer';

  return (
    <div className="dashboard-wrapper">
      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "20px 30px", borderRadius: "12px", color: "white", marginBottom: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <span style={{fontSize:'2.5rem'}}>🏠</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.8rem" }}>Welcome, {firstName}</h2>
            <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>Walking with God and fellow Believers</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* LEFT: Verse & Events */}
        <div className="left-panel">
          {/* Visual Verse (Fixed) */}
          {verseData && (
            <div className="panel-card" style={{padding:0, overflow:'hidden', position:'relative', borderRadius:'12px', border:'none', boxShadow: "0 4px 12px rgba(0,0,0,0.15)"}}>
              <div style={{padding:'10px 15px', background:'#0b2e4a', color:'white'}}>
                <h3 style={{margin:0, color:'white', fontSize:'14px', fontWeight:'600'}}>Verse of the Day</h3>
              </div>
              <div style={{
                backgroundImage: `url(${verseData.bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '250px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                textAlign: 'center',
                color: 'white',
                position: 'relative'
              }}>
                <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.3)'}} />
                <div style={{position:'relative', zIndex:2, textShadow: '0 2px 8px rgba(0,0,0,0.9)'}}>
                  <p style={{fontSize:'16px', fontWeight:'bold', fontFamily:'Georgia', lineHeight:'1.5', margin: 0}}>"{verseData.text}"</p>
                  <p style={{marginTop:'10px', fontSize:'13px', fontWeight:'500'}}>{verseData.ref}</p>
                </div>
              </div>
              <div style={{display:'flex', borderTop:'1px solid #eee'}}>
                <button style={{flex:1, padding:'12px', border:'none', background:'white', cursor:'pointer', borderRight:'1px solid #eee', color:'#2e8b57', fontWeight:'bold', fontSize:'13px'}}>🙏 Amen</button>
                <button style={{flex:1, padding:'12px', border:'none', background:'white', cursor:'pointer', color:'#0b2e4a', fontWeight:'bold', fontSize:'13px'}}>📢 Spread</button>
              </div>
            </div>
          )}

          {/* Functional Calendar */}
          <div className="panel-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0 }}>📅 Events</h3>
              <Link href="/events" style={{ fontSize: "12px", color: "#2e8b57", fontWeight: "600", textDecoration: 'none' }}>View All →</Link>
            </div>
            
            {/* Calendar Grid */}
            <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "10px", marginBottom: "15px" }}>
              <div style={{ textAlign:'center', marginBottom:'10px', fontWeight:'bold', color:'#0b2e4a', fontSize:'14px'}}>
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom:'5px' }}>
                {["S","M","T","W","T","F","S"].map(d => <div key={d} style={{fontSize:'10px', textAlign:'center', color:'#666'}}>{d}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isSelected = day === selectedDate.getDate();
                  const dateCheck = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).toISOString().split('T')[0];
                  const hasEvent = events.some(e => e.date === dateCheck);

                  return (
                    <div 
                      key={day} 
                      onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                      style={{ 
                        textAlign: "center", 
                        fontSize: "12px", 
                        padding: "6px", 
                        background: isSelected ? "#2e8b57" : (hasEvent ? "#e8f5e9" : "transparent"), 
                        color: isSelected ? "white" : (hasEvent ? "#2e8b57" : "#333"), 
                        borderRadius: "6px",
                        cursor: 'pointer',
                        fontWeight: isSelected || hasEvent ? 'bold' : 'normal'
                      }}>
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event List for selected date */}
            <div>
               <p style={{fontSize:'12px', color:'#666', marginBottom:'8px'}}>Events for {selectedDate.toLocaleDateString()}:</p>
               {selectedDayEvents.length > 0 ? (
                 selectedDayEvents.map(event => (
                  <div key={event.id} style={{ padding: "10px", background: "#f0fff4", borderRadius: "6px", marginBottom: "6px", borderLeft: "3px solid #2e8b57" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color:'#0b2e4a' }}>{event.title}</div>
                    <div style={{ fontSize: "11px", color: "#666" }}>⏰ {event.time}</div>
                  </div>
                 ))
               ) : (
                 <div style={{fontSize:'12px', color:'#999', fontStyle:'italic'}}>No events this day.</div>
               )}
            </div>
          </div>
        </div>

        {/* CENTER: The Walk */}
        <div className="center-panel">
          {user && <CreatePost user={user} onPostCreated={() => loadPosts(user.id)} />}
          
          <div className="panel-card">
            <h3>🏠 The Walk</h3>
            
            {loadingPosts ? (
              <p style={{padding:20, textAlign:'center'}}>Loading...</p>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px", color: "#666" }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "15px", opacity:0.5 }}>📝</div>
                <h4 style={{ color: "#0b2e4a", marginBottom: "10px", fontSize:'18px' }}>The Walk is quiet.</h4>
                <p style={{ fontSize: "15px" }}>Be the first to share what's in your heart !!!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} style={{ border: "1px solid #e0e0e0", borderRadius: "12px", padding: "15px", marginBottom: "15px", background: "#fafafa" }}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                    {/* Avatar */}
                    {post.author?.avatar_url ? (
                      <img src={post.author.avatar_url} style={{width:40, height:40, borderRadius:'50%', objectFit:'cover'}} />
                    ) : (
                      <div style={{width:40, height:40, borderRadius:'50%', background:'#2e8b57', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold'}}>
                        {post.author?.full_name?.[0] || 'B'}
                      </div>
                    )}
                    <div>
                      <div style={{fontWeight:'bold', color:'#0b2e4a'}}>{post.author?.full_name}</div>
                      <div style={{fontSize:'12px', color:'#666'}}>{new Date(post.created_at).toDateString()}</div>
                    </div>
                    <span style={{marginLeft:'auto', fontSize:'11px', background:'white', border:'1px solid #ddd', padding:'4px 8px', borderRadius:'12px', color:'#666'}}>{post.type}</span>
                  </div>

                  {post.title && <h4 style={{margin:'0 0 8px 0', color:'#0b2e4a', fontSize:'16px'}}>{post.title}</h4>}
                  <p style={{whiteSpace:'pre-wrap', color:'#333', lineHeight:'1.6', fontSize:'15px'}}>{post.content}</p>
                  
                  <div style={{display:'flex', gap:'20px', marginTop:'15px', borderTop:'1px solid #eee', paddingTop:'12px'}}>
                    <button onClick={() => handleAmen(post.id, post.hasAmened)} style={{border:'none', background:'none', color: post.hasAmened ? '#2e8b57':'#666', fontWeight: post.hasAmened ? '700':'500', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', gap:'5px'}}>
                      🙏 {post.hasAmened ? 'Amened' : 'Amen'} {post.amenCount > 0 && `(${post.amenCount})`}
                    </button>
                    <button style={{border:'none', background:'none', color:'#666', cursor:'pointer', fontSize:'14px', fontWeight:'500'}}>📢 Spread</button>
                    <button style={{border:'none', background:'none', color:'#666', cursor:'pointer', fontSize:'14px', fontWeight:'500'}}>💬 Comment</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Suggestions & Chat */}
        <div className="right-panel">
          <div className="panel-card">
            <h3>🤝 Suggested Believers</h3>
            {[1,2,3].map(i => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', margin:'12px 0', paddingBottom:'10px', borderBottom:'1px solid #f0f0f0'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                   <div style={{width:32, height:32, background:'#ddd', borderRadius:'50%'}} />
                   <span style={{fontSize:'14px', fontWeight:'500'}}>Believer {i}</span>
                </div>
                <button style={{fontSize:'18px', background:'none', border:'none', color:'#2e8b57', cursor:'pointer'}} title="Connect">⊕</button>
              </div>
            ))}
          </div>

          <div className="panel-card" style={{background:'#fff9e6', borderLeft:'4px solid #d4af37'}}>
            <h3>🙏 Prayer Wall</h3>
            <p style={{fontStyle:'italic', fontSize:'14px', color:'#555', margin:'10px 0'}}>"Pray for my healing..."</p>
            <button style={{width:'100%', padding:'8px', background:'#2e8b57', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'13px'}}>I'll Pray</button>
          </div>

          <div className="panel-card">
            <h3>💬 Chat</h3>
            <div style={{padding:'10px', background:'#f5f5f5', borderRadius:'8px', marginBottom:'5px'}}>
              <div style={{fontWeight:'bold', fontSize:'13px'}}>John Doe</div>
              <div style={{fontSize:'11px', color:'#666'}}>God bless you! 🙏</div>
            </div>
            <Link href="/chat" style={{display:'block', textAlign:'center', marginTop:'10px', fontSize:'12px', color:'#2e8b57', fontWeight:'600', textDecoration:'none'}}>Open Messenger →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}