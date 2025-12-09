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
  
  // Widget Data
  const [suggestedBelievers, setSuggestedBelievers] = useState([]);
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [recentChats, setRecentChats] = useState([]);

  // Verse State
  const [verseData, setVerseData] = useState(null);
  const [verseAmenCount, setVerseAmenCount] = useState(0); 
  const [hasAmenedVerse, setHasAmenedVerse] = useState(false);

  // Events State
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredEvents, setFilteredEvents] = useState([]);

  // Post Menu State
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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

  function loadAllData(uid) {
    loadPosts(uid);
    loadSuggestedBelievers(uid);
    loadPrayerWall(uid);
    loadRecentChats(uid);
    loadUpcomingEvents();
  }

  // --- 1. VERSE LOGIC ---
  function generateDailyVisualVerse() {
    const verses = [
      { text: "I am the good shepherd. The good shepherd lays down his life for the sheep.", ref: "John 10:11", bg: "https://images.unsplash.com/photo-1484557985045-6f5c98486c90?auto=format&fit=crop&w=800&q=80" },
      { text: "The Lord is my light and my salvation; whom shall I fear?", ref: "Psalm 27:1", bg: "https://images.unsplash.com/photo-1505322022379-7c3353ee6291?auto=format&fit=crop&w=800&q=80" },
      { text: "He leads me beside still waters.", ref: "Psalm 23:2", bg: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80" }
    ];
    const dayIndex = new Date().getDate() % verses.length;
    setVerseData(verses[dayIndex]);
  }

  function handleVerseAmen() {
    if (hasAmenedVerse) { setVerseAmenCount(c => c - 1); setHasAmenedVerse(false); }
    else { setVerseAmenCount(c => c + 1); setHasAmenedVerse(true); }
  }

  // --- 2. WIDGETS ---
  async function loadSuggestedBelievers(userId) {
    const { data } = await supabase.from('profiles').select('*').neq('id', userId).limit(3);
    if (data) setSuggestedBelievers(data);
  }

  // FIXED: Prayer Wall Logic
  async function loadPrayerWall(userId) {
    // 1. Get Friend IDs
    const { data: conns } = await supabase
      .from('connections')
      .select('user_a, user_b')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .eq('status', 'connected');

    let friendIds = [userId]; 
    if (conns) {
      conns.forEach(c => {
        friendIds.push(c.user_a === userId ? c.user_b : c.user_a);
      });
    }

    // 2. Fetch Prayers
    const { data } = await supabase
      .from('posts')
      .select('id, content, profiles(full_name)')
      .eq('type', 'Prayer')
      .in('user_id', friendIds)
      .order('created_at', { ascending: false })
      .limit(5);
    
    setPrayerRequests(data || []);
  }

  // FIXED: Chat Logic
  async function loadRecentChats(userId) {
    const { data: msgs } = await supabase.from('messages').select('sender_id, receiver_id').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: false }).limit(20);
    if (!msgs) return;
    const partnerIds = new Set();
    msgs.forEach(m => {
      if (m.sender_id !== userId) partnerIds.add(m.sender_id);
      if (m.receiver_id !== userId) partnerIds.add(m.receiver_id);
    });
    if (partnerIds.size > 0) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', Array.from(partnerIds)).limit(3);
      setRecentChats(profiles || []);
    }
  }

  // --- 3. EVENTS ---
  async function loadUpcomingEvents() {
    const { data } = await supabase.from('events').select('*').gte('event_date', new Date().toISOString().split('T')[0]).order('event_date', { ascending: true });
    if (data) {
      setEvents(data);
      filterEventsByDate(selectedDate, data);
    }
  }

  function filterEventsByDate(date, allEvents) {
    const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    setFilteredEvents(allEvents.filter(e => e.event_date === dateStr));
  }

  function handleDateClick(day) {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    setSelectedDate(newDate);
    filterEventsByDate(newDate, events);
  }

  // --- 4. FEED (Fixed Refresh) ---
  async function loadPosts(currentUserId, isRefresh = false) {
    if (!isRefresh) setLoadingPosts(true);
    
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

  // --- 5. ACTIONS ---
  async function handleAmen(postId, currentlyAmened) {
    setPosts(posts.map(p => p.id === postId ? { ...p, hasAmened: !currentlyAmened, amenCount: currentlyAmened ? p.amenCount - 1 : p.amenCount + 1 } : p));
    if (currentlyAmened) await supabase.from('amens').delete().match({ user_id: user.id, post_id: postId });
    else await supabase.from('amens').insert({ user_id: user.id, post_id: postId });
  }

  async function handleDeletePost(postId) {
    if (!confirm("Are you sure?")) return;
    await supabase.from('posts').delete().eq('id', postId);
    setPosts(posts.filter(p => p.id !== postId));
  }

  async function handleUpdatePost(postId) {
    await supabase.from('posts').update({ content: editContent }).eq('id', postId);
    setPosts(posts.map(p => p.id === postId ? { ...p, content: editContent } : p));
    setEditingPost(null);
  }

  function startEditing(post) {
    setEditingPost(post.id);
    setEditContent(post.content);
    setOpenMenuId(null);
  }

  function handleShare(text) {
    if (navigator.share) navigator.share({ title: 'The Believerse', text: text });
    else alert("Link copied!");
  }

  if (!mounted) return null;
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Believer';

  return (
    <div className="dashboard-wrapper">
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "20px 30px", borderRadius: "12px", color: "white", marginBottom: "20px" }}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <span style={{fontSize:'2rem'}}>🏠</span>
          <div><h2 style={{ margin: 0 }}>Welcome, {firstName}</h2><p style={{ margin: 0, opacity: 0.9 }}>Walking with God and fellow Believers</p></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="left-panel">
          {verseData && (
            <div className="panel-card" style={{padding:0, overflow:'hidden', position:'relative', borderRadius:'12px', border:'none'}}>
              <div style={{padding:'10px 15px', background:'#0b2e4a', color:'white'}}><h3 style={{margin:0, fontSize:'14px'}}>Daily Bible Verse</h3></div>
              <div style={{ backgroundImage: `url(${verseData.bg})`, backgroundSize: 'cover', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center', color: 'white', position: 'relative' }}>
                <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.4)'}} />
                <div style={{position:'relative', zIndex:2, textShadow: '0 2px 8px rgba(0,0,0,0.9)'}}>
                  <p style={{fontSize:'16px', fontWeight:'bold', fontFamily:'Georgia'}}>"{verseData.text}"</p>
                  <p style={{marginTop:'10px', fontSize:'13px'}}>{verseData.ref}</p>
                </div>
              </div>
              <div style={{display:'flex', borderTop:'1px solid #eee'}}>
                <button onClick={handleVerseAmen} style={{flex:1, padding:'10px', border:'none', background:'white', cursor:'pointer', borderRight:'1px solid #eee', color: hasAmenedVerse ? '#2e8b57' : '#555', fontWeight:'bold'}}>🙏 Amen ({verseAmenCount})</button>
                <button onClick={() => handleShare(verseData.text)} style={{flex:1, padding:'10px', border:'none', background:'white', cursor:'pointer', color:'#0b2e4a', fontWeight:'bold'}}>📢 Spread</button>
              </div>
            </div>
          )}
          
          <div className="panel-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}><h3 style={{ margin: 0 }}>📅 Events</h3><Link href="/events" style={{ fontSize: "12px", color: "#2e8b57", fontWeight: "600", textDecoration:'none' }}>View All →</Link></div>
            <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "10px", marginBottom: "15px" }}>
              <div style={{ textAlign:'center', marginBottom:'10px', fontWeight:'bold', color:'#0b2e4a', fontSize:'14px'}}>{monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {["S","M","T","W","T","F","S"].map(d => <div key={d} style={{ fontSize: "10px", textAlign: "center", color: "#888" }}>{d}</div>)}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => { const day = i + 1; const isSelected = day === selectedDate.getDate(); return <div key={day} onClick={() => handleDateClick(day)} style={{ textAlign: "center", padding: "6px", background: isSelected ? "#2e8b57" : "transparent", color: isSelected ? "white" : "#333", borderRadius: "6px", cursor: 'pointer', fontSize:'12px' }}>{day}</div> })}
              </div>
            </div>
            {filteredEvents.length > 0 ? filteredEvents.map(e => <div key={e.id} style={{fontSize:'12px', padding:'5px', background:'#e8f5e9', marginBottom:'5px', color:'#000'}}>{e.title}</div>) : <div style={{fontSize:'12px', color:'#999'}}>No events.</div>}
          </div>
        </div>

        <div className="center-panel">
          {user && <CreatePost user={user} onPostCreated={() => loadPosts(user.id, true)} />}
          <div className="panel-card">
            <h3>🏠 The Walk</h3>
            {loadingPosts ? <p style={{textAlign:'center', padding:'20px'}}>Loading...</p> : 
             posts.length === 0 ? <div style={{textAlign:'center', padding:'40px', color:'#666'}}>The Walk is quiet. Be the first to share!</div> :
             posts.map(post => (
               <div key={post.id} style={{border:'1px solid #eee', borderRadius:'12px', padding:'15px', marginBottom:'15px', background:'#fafafa'}}>
                 <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                   <img src={post.author?.avatar_url || '/images/default-avatar.png'} style={{width:40, height:40, borderRadius:'50%', objectFit:'cover'}} />
                   <div><div style={{fontWeight:'bold', color:'#0b2e4a'}}>{post.author?.full_name}</div><div style={{fontSize:'12px', color:'#666'}}>{new Date(post.created_at).toDateString()}</div></div>
                   {user?.id === post.user_id && (
                     <div style={{marginLeft:'auto', position:'relative'}}>
                       <button onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} style={{border:'none', background:'none', fontSize:'20px', cursor:'pointer'}}>⋮</button>
                       {openMenuId === post.id && (
                         <div style={{position:'absolute', right:0, top:'25px', background:'white', border:'1px solid #eee', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', borderRadius:'8px', zIndex:10, width:'100px'}}>
                           <button onClick={() => startEditing(post)} style={{width:'100%', padding:'8px', textAlign:'left', border:'none', background:'white', cursor:'pointer', fontSize:'13px', color:'#333'}}>Edit</button>
                           <button onClick={() => handleDeletePost(post.id)} style={{width:'100%', padding:'8px', textAlign:'left', border:'none', background:'white', cursor:'pointer', color:'red', fontSize:'13px'}}>Delete</button>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
                 {editingPost === post.id ? (
                   <div style={{marginBottom:'10px'}}>
                     <textarea value={editContent} onChange={e => setEditContent(e.target.value)} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #ddd'}} />
                     <div style={{marginTop:'5px', display:'flex', gap:'5px'}}>
                       <button onClick={() => handleUpdatePost(post.id)} style={{padding:'6px 12px', background:'#2e8b57', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}>Save</button>
                       <button onClick={() => setEditingPost(null)} style={{padding:'6px 12px', background:'#ccc', border:'none', borderRadius:'4px', cursor:'pointer'}}>Cancel</button>
                     </div>
                   </div>
                 ) : (
                   <>
                     {post.title && <h4 style={{margin:'0 0 5px 0'}}>{post.title}</h4>}
                     <p style={{whiteSpace:'pre-wrap', color:'#333'}}>{post.content}</p>
                     {post.media_url && <img src={post.media_url} style={{width:'100%', borderRadius:'8px', marginTop:'10px'}} />}
                   </>
                 )}
                 <div style={{display:'flex', justifyContent:'space-between', marginTop:'15px', borderTop:'1px solid #eee', paddingTop:'10px'}}>
                   <button onClick={() => handleAmen(post.id, post.hasAmened)} style={{background:'none', border:'none', color: post.hasAmened ? '#2e8b57' : '#666', fontWeight: post.hasAmened ? 'bold' : 'normal', cursor:'pointer'}}>🙏 Amen ({post.amenCount})</button>
                   <button style={{background:'none', border:'none', color:'#d4af37', fontWeight:'bold', cursor:'pointer'}}>✨ Bless</button>
                   <button onClick={() => handleShare(post.content)} style={{background:'none', border:'none', color:'#666', cursor:'pointer'}}>📢 Spread</button>
                 </div>
               </div>
             ))
            }
          </div>
        </div>

        <div className="right-panel">
          <div className="panel-card">
            <h3>🤝 Suggested Believers</h3>
            {suggestedBelievers.map(b => (
              <div key={b.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <img src={b.avatar_url || '/images/default-avatar.png'} style={{width:30, height:30, borderRadius:'50%'}} />
                  <span style={{fontSize:'13px', color:'#0b2e4a', fontWeight:'bold'}}>{b.full_name?.split(' ')[0]}</span>
                </div>
                <Link href={`/chat?uid=${b.id}`} style={{textDecoration:'none', fontSize:'16px'}}>💬</Link>
              </div>
            ))}
            <Link href="/believers" style={{fontSize:'12px', color:'#2e8b57', fontWeight:'bold', display:'block', marginTop:'5px', textDecoration:'none'}}>Find More →</Link>
          </div>
          <div className="panel-card" style={{background:'#fff9e6', borderLeft:'4px solid #d4af37'}}>
            <h3>🙏 Prayer Wall</h3>
            {prayerRequests.length === 0 ? <p style={{fontSize:'12px', color:'#666'}}>No requests from friends.</p> : 
              prayerRequests.map(p => (
                <div key={p.id} style={{marginBottom:'8px', fontSize:'12px'}}>
                  <div style={{fontWeight:'bold', color:'#000'}}>{p.profiles?.full_name}</div>
                  <div style={{fontStyle:'italic', color:'#555'}}>"{p.content.substring(0, 40)}..."</div>
                </div>
              ))
            }
            <button style={{width:'100%', padding:'8px', background:'#2e8b57', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', marginTop:'5px'}}>I'll Pray</button>
          </div>
          <div className="panel-card">
            <h3>💬 Recent Chats</h3>
            {recentChats.map(c => (
              <Link key={c.id} href={`/chat?uid=${c.id}`} style={{display:'flex', alignItems:'center', gap:'10px', padding:'8px', background:'#f5f5f5', borderRadius:'8px', marginBottom:'5px', textDecoration:'none'}}>
                <img src={c.avatar_url || '/images/default-avatar.png'} style={{width:30, height:30, borderRadius:'50%'}} />
                <div style={{fontSize:'13px', fontWeight:'bold', color:'#0b2e4a'}}>{c.full_name}</div>
              </Link>
            ))}
            <Link href="/chat" style={{display:'block', textAlign:'center', marginTop:'10px', fontSize:'12px', color:'#2e8b57', fontWeight:'600', textDecoration:'none'}}>Open Messenger →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDaysInMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return { daysInMonth: new Date(year, month + 1, 0).getDate(), startingDayOfWeek: new Date(year, month, 1).getDay() };
}