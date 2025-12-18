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
  const [editTitle, setEditTitle] = useState("");

  // Comments State
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState({}); 

  // Modals
  const [blessModalUser, setBlessModalUser] = useState(null); 
  const [supportModalOpen, setSupportModalOpen] = useState(false); 

  // Widget Edit State
  const [editingPrayerId, setEditingPrayerId] = useState(null);
  const [prayerEditContent, setPrayerEditContent] = useState("");

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const PLATFORM_UPI_ID = "your-platform-upi@okhdfcbank"; 

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

  // Razorpay Script Loader
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  function loadAllData(uid) {
    loadPosts(uid);
    loadSuggestedBelievers(uid);
    loadPrayerWall(uid);
    loadRecentChats(uid);
    loadUpcomingEvents();
  }

  // --- DYNAMIC LOCAL IMAGE BANK ---
  const backgroundBank = Array.from({ length: 30 }, (_, i) => `/verses/${i + 1}.jpg`);

  async function generateDailyVisualVerse() {
    const today = new Date().toISOString().split('T')[0];
    const dayOfMonth = new Date().getDate(); 

    // Fetch Text
    const { data, error } = await supabase
      .from('daily_verses')
      .select('*')
      .eq('verse_date', today)
      .single();

    // Select Background
    const bgIndex = (dayOfMonth - 1) % backgroundBank.length;
    const selectedBg = backgroundBank[bgIndex];

    if (data) {
      setVerseData({
        text: data.verse_text,
        ref: data.verse_ref,
        bg: selectedBg
      });
    } else {
      // Fallback
      const verses = [
        { text: "I am the good shepherd.", ref: "John 10:11" },
        { text: "The Lord is my light.", ref: "Psalm 27:1" },
        { text: "He leads me beside still waters.", ref: "Psalm 23:2" }
      ];
      const fallbackIndex = dayOfMonth % verses.length;
      
      setVerseData({
        ...verses[fallbackIndex],
        bg: selectedBg
      });
    }
  }

  function handleVerseAmen() {
    if (hasAmenedVerse) { setVerseAmenCount(c => c - 1); setHasAmenedVerse(false); }
    else { setVerseAmenCount(c => c + 1); setHasAmenedVerse(true); }
  }

  // --- BADGE UI HELPER ---
  const getBadgeUI = () => {
    if (!profile || !profile.subscription_plan) return null;
    const plan = profile.subscription_plan.trim().toLowerCase();
    
    if (plan.includes('platinum')) {
      return (
        <span style={{ 
          background: "linear-gradient(45deg, #29b6f6, #0288d1)", 
          color: "white", padding: "4px 10px", borderRadius: "12px", 
          fontSize: "12px", fontWeight: "bold", display: "inline-flex", 
          alignItems: "center", gap: "4px", marginLeft: "10px", boxShadow: "0 2px 5px rgba(41, 182, 246, 0.4)"
        }}>
          💎 Platinum Partner
        </span>
      );
    }
    if (plan.includes('gold')) {
      return (
        <span style={{ 
          background: "linear-gradient(45deg, #d4af37, #f9d976)", 
          color: "#0b2e4a", padding: "4px 10px", borderRadius: "12px", 
          fontSize: "12px", fontWeight: "bold", display: "inline-flex", 
          alignItems: "center", gap: "4px", marginLeft: "10px", boxShadow: "0 2px 5px rgba(212, 175, 55, 0.4)"
        }}>
          🥇 Gold Supporter
        </span>
      );
    }
    return null;
  };

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

  async function deletePrayerFromWidget(prayerId) {
    if(!confirm("Delete this prayer request?")) return;
    await supabase.from('posts').delete().eq('id', prayerId);
    setPrayerRequests(prev => prev.filter(p => p.id !== prayerId));
    setPosts(prev => prev.filter(p => p.id !== prayerId));
  }

  async function updatePrayerInWidget(prayerId) {
    await supabase.from('posts').update({ content: prayerEditContent }).eq('id', prayerId);
    setPrayerRequests(prev => prev.map(p => p.id === prayerId ? { ...p, content: prayerEditContent } : p));
    setEditingPrayerId(null);
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
    if (data) { setEvents(data); filterEventsByDate(selectedDate, data); }
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

  async function loadPosts(currentUserId, isRefresh = false) {
    if (!isRefresh) setLoadingPosts(true);
    const { data, error } = await supabase.from('posts').select(`*, profiles (username, full_name, avatar_url, upi_id), amens (user_id)`).neq('type', 'Glimpse').neq('type', 'Prayer').order('created_at', { ascending: false });
    if (!error && data) { const formatted = data.map(p => ({ ...p, author: p.profiles, amenCount: p.amens.length, hasAmened: p.amens.some(a => a.user_id === currentUserId) })); setPosts(formatted); }
    setLoadingPosts(false);
  }

  // --- ACTIONS ---

  async function checkIsIndia() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      return data.country_code === "IN";
    } catch (e) {
      return true; 
    }
  }

  async function handleBlessClick(author) {
    if (!author?.upi_id) { alert(`God bless! ${author.full_name} has not set up their UPI ID yet.`); return; }
    const isIndia = await checkIsIndia();
    if (isIndia) { setBlessModalUser(author); } 
    else { alert("🌍 International Blessing is coming soon!\n\nCurrently, direct blessings are available for UPI (India) users only."); }
  }

  async function handlePartnerClick() {
    const isIndia = await checkIsIndia();
    if (isIndia) {
      setSupportModalOpen(true);
    } else {
      let inputAmount = prompt("Enter the amount you wish to gift in USD ($):", "10");
      if (inputAmount === null) return;
      const amount = parseFloat(inputAmount);
      if (isNaN(amount) || amount < 1) { alert("Please enter a valid amount (Minimum $1)."); return; }
      
      const res = await loadRazorpayScript();
      if (!res) { alert("Payment gateway failed to load."); return; }
      
      try {
        const response = await fetch("/api/razorpay", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amount, currency: "USD" }), 
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Order creation failed");

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
          amount: data.order.amount,
          currency: data.order.currency,
          name: "The Believerse",
          description: "Partner Contribution",
          image: "/images/final-logo.png",
          order_id: data.order.id,
          handler: function (response) {
            alert(`Thank you for your generous gift of $${amount}! \nPayment ID: ${response.razorpay_payment_id}`);
          },
          theme: { color: "#2e8b57" },
        };
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } catch (error) { console.error(error); alert("Unable to initiate international payment. Please try again."); }
    }
  }

  async function handleAmen(post, currentlyAmened) {
    setPosts(posts.map(p => p.id === post.id ? { ...p, hasAmened: !currentlyAmened, amenCount: currentlyAmened ? p.amenCount - 1 : p.amenCount + 1 } : p));
    if (currentlyAmened) await supabase.from('amens').delete().match({ user_id: user.id, post_id: post.id });
    else { await supabase.from('amens').insert({ user_id: user.id, post_id: post.id }); if (user && user.id !== post.user_id) await supabase.from('notifications').insert({ user_id: post.user_id, actor_id: user.id, type: 'amen', content: `${profile?.full_name} said Amen to your post.`, link: '/dashboard' }); }
  }

  async function handleDeletePost(postId) {
    if (!confirm("Are you sure?")) return;
    await supabase.from('posts').delete().eq('id', postId);
    setPosts(posts.filter(p => p.id !== postId));
  }

  async function handleUpdatePost(postId) {
    await supabase.from('posts').update({ title: editTitle, content: editContent }).eq('id', postId);
    setPosts(posts.map(p => p.id === postId ? { ...p, title: editTitle, content: editContent } : p));
    setEditingPost(null);
  }

  function startEditing(post) { setEditingPost(post.id); setEditContent(post.content); setEditTitle(post.title || ''); setOpenMenuId(null); }
  
  function handleShare(text) { 
    const shareUrl = window.location.origin; 
    const fullText = `${text}\n\nVia The Believerse: ${shareUrl}`;

    if (navigator.share) {
        navigator.share({ 
            title: 'The Believerse', 
            text: fullText,
            url: shareUrl 
        }); 
    } else {
        navigator.clipboard.writeText(fullText);
        alert("Link and text copied to clipboard!"); 
    }
  }

  // --- COMMENTS LOGIC ---
  async function toggleComments(postId) {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    } else {
      setActiveCommentPostId(postId);
      // Load comments for this post if not already loaded
      if (!comments[postId]) {
        const { data } = await supabase
          .from('comments')
          .select('*, profiles(full_name, avatar_url)')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });
        setComments(prev => ({ ...prev, [postId]: data || [] }));
      }
    }
  }

  async function postComment(postId) {
    if (!newComment.trim()) return;
    
    // Optimistic Update
    const tempComment = {
      id: Date.now(),
      post_id: postId,
      content: newComment,
      created_at: new Date().toISOString(),
      profiles: { full_name: profile.full_name, avatar_url: profile.avatar_url }
    };
    
    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), tempComment]
    }));
    setNewComment("");

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      content: tempComment.content
    });

    if (error) alert("Failed to post comment");
  }

  if (!mounted) return null;
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Believer';

  return (
    <div className="dashboard-wrapper">
      
      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "20px 30px", borderRadius: "12px", color: "white", marginBottom: "20px", display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <span style={{fontSize:'2.5rem'}}>🏠</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', display:'flex', alignItems:'center', gap:'5px' }}>
              Welcome, {firstName} 
              {getBadgeUI()}
            </h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>Walking with God and fellow Believers</p>
          </div>
        </div>
        
        <button 
          onClick={handlePartnerClick} 
          style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '30px', padding: '10px 24px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: '700', transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <span style={{fontSize:'28px'}}>🕊️</span> Partner
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="left-panel">
          
          {/* VERSE WIDGET */}
          {verseData && (
            <div className="panel-card" style={{padding:0, overflow:'hidden', position:'relative', borderRadius:'12px', border:'none', background:'#000'}}>
              <div style={{padding:'10px 15px', background:'#0b2e4a', color:'white', fontWeight:'bold'}}>Daily Bible Verse</div>
              
              <div style={{ 
                backgroundImage: `url('${verseData.bg}')`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                height: '350px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: '30px', 
                textAlign: 'center', 
                color: 'white', 
                position: 'relative' 
              }}>
                <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.4)'}} />
                
                <div style={{position:'relative', zIndex:2, textShadow: '0 2px 8px black'}}>
                  <p style={{fontSize:'22px', fontWeight:'bold', fontFamily:'Georgia', lineHeight:'1.5'}}>
                    "{verseData.text}"
                  </p>
                  <p style={{marginTop:'15px', fontSize:'16px', color:'#eee'}}>
                    {verseData.ref}
                  </p>
                </div>
              </div>

              <div style={{display:'flex', borderTop:'1px solid #333', background:'white'}}>
                <button onClick={handleVerseAmen} style={{flex:1, padding:'12px', border:'none', background:'transparent', cursor:'pointer', borderRight:'1px solid #eee', color: hasAmenedVerse ? '#2e8b57' : '#555', fontWeight:'bold', fontSize:'14px'}}>🙏 Amen ({verseAmenCount})</button>
                <button onClick={() => handleShare(`${verseData.text} (${verseData.ref})`)} style={{flex:1, padding:'12px', border:'none', background:'transparent', cursor:'pointer', color:'#0b2e4a', fontWeight:'bold', fontSize:'14px'}}>📢 Spread</button>
              </div>
            </div>
          )}
          
          <div className="panel-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}><h3 style={{ margin: 0, fontSize:'16px' }}>📅 Events</h3><Link href="/events" style={{ fontSize: "12px", color: "#2e8b57", fontWeight: "600", textDecoration:'none' }}>View All →</Link></div>
            <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "10px", marginBottom: "15px" }}>
              <div style={{ textAlign:'center', marginBottom:'10px', fontWeight:'bold', color:'#0b2e4a', fontSize:'14px'}}>{monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {["S","M","T","W","T","F","S"].map(d => <div key={d} style={{ fontSize: "10px", textAlign: "center", color: "#888" }}>{d}</div>)}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => { 
                  const day = i + 1; const dateCheck = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day); const dateStr = `${dateCheck.getFullYear()}-${String(dateCheck.getMonth() + 1).padStart(2, '0')}-${String(dateCheck.getDate()).padStart(2, '0')}`; const isSelected = day === selectedDate.getDate(); const hasEvent = events.some(e => e.event_date === dateStr);
                  return (<div key={day} onClick={() => handleDateClick(day)} style={{ textAlign: "center", padding: "6px", borderRadius: "6px", cursor: 'pointer', fontSize:'12px', background: isSelected ? "#2e8b57" : (hasEvent ? "#e8f5e9" : "transparent"), color: isSelected ? "white" : (hasEvent ? "#2e8b57" : "#333"), fontWeight: isSelected || hasEvent ? 'bold' : 'normal', border: hasEvent ? "1px solid #2e8b57" : "1px solid transparent" }}>{day}</div>);
                })}
              </div>
            </div>
            {filteredEvents.length > 0 ? filteredEvents.map(e => <div key={e.id} style={{fontSize:'12px', padding:'5px', background:'#e8f5e9', marginBottom:'5px', color:'#000'}}>{e.title}</div>) : <div style={{fontSize:'12px', color:'#999'}}>No events on this date.</div>}
          </div>
        </div>

        <div className="center-panel">
          {user && <CreatePost user={user} onPostCreated={() => { loadPosts(user.id, true); loadPrayerWall(user.id); }} />}
          
          <div className="panel-card">
            <h3>🏠 The Walk</h3>
            {loadingPosts ? <p style={{textAlign:'center', padding:'20px'}}>Loading...</p> : 
             posts.length === 0 ? <div style={{textAlign:'center', padding:'40px', color:'#666'}}>The Walk is quiet. Be the first to share!</div> :
             posts.map(post => (
               <div key={post.id} style={{border:'1px solid #eee', borderRadius:'12px', padding:'15px', marginBottom:'15px', background:'#fafafa'}}>
                 {/* Post Header */}
                 <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                   <Link href={`/profile/${post.user_id}`}>
                      <img src={post.author?.avatar_url || '/images/default-avatar.png'} style={{width:40, height:40, borderRadius:'50%', objectFit:'cover', cursor: 'pointer'}} />
                   </Link>
                   <div>
                      <Link href={`/profile/${post.user_id}`} style={{textDecoration:'none'}}>
                        <div style={{fontWeight:'bold', color:'#0b2e4a', cursor: 'pointer'}}>{post.author?.full_name}</div>
                      </Link>
                      <div style={{fontSize:'12px', color:'#666'}}>{new Date(post.created_at).toDateString()}</div>
                   </div>
                   
                   {/* UPDATED: Kebab Menu for Everyone (Author: Edit/Delete, Viewer: Report) */}
                   <div style={{marginLeft:'auto', position:'relative'}}>
                       <button onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} style={{border:'none', background:'none', fontSize:'20px', cursor:'pointer', padding:'5px', color:'#666'}}>⋮</button>
                       {openMenuId === post.id && (
                         <div style={{position:'absolute', right:0, top:'30px', background:'white', border:'1px solid #eee', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', borderRadius:'8px', zIndex:10, width:'150px', overflow:'hidden'}}>
                           {user?.id === post.user_id ? (
                             <>
                               <button onClick={() => startEditing(post)} style={{width:'100%', padding:'10px', textAlign:'left', border:'none', background:'white', cursor:'pointer', fontSize:'13px', color:'#333', borderBottom:'1px solid #f5f5f5'}}>📝 Edit</button>
                               <button onClick={() => handleDeletePost(post.id)} style={{width:'100%', padding:'10px', textAlign:'left', border:'none', background:'white', cursor:'pointer', color:'red', fontSize:'13px'}}>🗑️ Delete</button>
                             </>
                           ) : (
                             <button onClick={() => {
                                 if(confirm("Report this post?")) alert("Reported.");
                                 setOpenMenuId(null);
                             }} style={{width:'100%', padding:'10px', textAlign:'left', border:'none', background:'white', cursor:'pointer', color:'#d4af37', fontSize:'13px'}}>🚩 Report</button>
                           )}
                         </div>
                       )}
                   </div>
                 </div>

                 {/* Post Content */}
                 {editingPost === post.id ? (
                   <div style={{marginBottom:'10px'}}>
                     <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" style={{width:'100%', padding:'8px', marginBottom:'5px', borderRadius:'4px', border:'1px solid #ddd'}} />
                     <textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="Content" style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #ddd', minHeight:'100px'}} />
                     <div style={{marginTop:'5px', display:'flex', gap:'5px', justifyContent:'flex-end'}}>
                       <button onClick={() => handleUpdatePost(post.id)} style={{padding:'6px 12px', background:'#2e8b57', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}>Save</button>
                       <button onClick={() => setEditingPost(null)} style={{padding:'6px 12px', background:'#ccc', border:'none', borderRadius:'4px', cursor:'pointer'}}>Cancel</button>
                     </div>
                   </div>
                 ) : (
                   <>
                     {post.title && <h4 style={{margin:'0 0 5px 0', color: '#0b2e4a'}}>{post.title}</h4>}
                     <p style={{whiteSpace:'pre-wrap', color:'#333'}}>{post.content}</p>
                     {post.media_url && <img src={post.media_url} style={{width:'100%', borderRadius:'8px', marginTop:'10px'}} />}
                   </>
                 )}
                 
                 {/* UPDATED FOOTER: Space Between Alignment */}
                 <div style={{
                    display:'flex', 
                    justifyContent:'space-between', 
                    alignItems:'center',
                    marginTop:'15px', 
                    borderTop:'1px solid #eee', 
                    paddingTop:'10px',
                    width:'100%'
                 }}>
                     <button onClick={() => handleAmen(post, post.hasAmened)} style={{background:'none', border:'none', color: post.hasAmened ? '#2e8b57' : '#666', fontWeight: post.hasAmened ? 'bold' : 'normal', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>🙏 Amen ({post.amenCount})</button>
                     <button onClick={() => toggleComments(post.id)} style={{background:'none', border:'none', color:'#666', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>💬 Comment</button>
                     <button onClick={() => handleBlessClick(post.author)} style={{background:'none', border:'none', color:'#d4af37', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>✨ Bless</button>
                     <button onClick={() => handleShare(post.content)} style={{background:'none', border:'none', color:'#666', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>📢 Spread</button>
                 </div>

                 {/* COMMENTS SECTION */}
                 {activeCommentPostId === post.id && (
                   <div style={{marginTop:'15px', background:'#f9f9f9', padding:'10px', borderRadius:'8px'}}>
                     {/* Comment List */}
                     <div style={{maxHeight:'200px', overflowY:'auto', marginBottom:'10px'}}>
                       {comments[post.id]?.length > 0 ? comments[post.id].map(c => (
                         <div key={c.id} style={{display:'flex', gap:'10px', marginBottom:'8px'}}>
                           <img src={c.profiles?.avatar_url || '/images/default-avatar.png'} style={{width:25, height:25, borderRadius:'50%'}} />
                           <div style={{background:'white', padding:'5px 10px', borderRadius:'10px', fontSize:'13px', flex:1}}>
                             <div style={{fontWeight:'bold', fontSize:'12px'}}>{c.profiles?.full_name}</div>
                             {c.content}
                           </div>
                         </div>
                       )) : <p style={{fontSize:'12px', color:'#999'}}>No comments yet. Be the first!</p>}
                     </div>
                     
                     {/* Comment Input */}
                     <div style={{display:'flex', gap:'10px'}}>
                       <input 
                         type="text" 
                         placeholder="Write a comment..." 
                         value={newComment} 
                         onChange={e => setNewComment(e.target.value)} 
                         style={{flex:1, padding:'8px', borderRadius:'20px', border:'1px solid #ddd', fontSize:'13px'}}
                         onKeyDown={e => e.key === 'Enter' && postComment(post.id)}
                       />
                       <button onClick={() => postComment(post.id)} style={{background:'#0b2e4a', color:'white', border:'none', borderRadius:'50%', width:'35px', height:'35px', cursor:'pointer'}}>➤</button>
                     </div>
                   </div>
                 )}

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
                  <Link href={`/profile/${b.id}`}>
                     <img src={b.avatar_url || '/images/default-avatar.png'} style={{width:30, height:30, borderRadius:'50%', cursor: 'pointer'}} />
                  </Link>
                  <Link href={`/profile/${b.id}`} style={{textDecoration:'none'}}>
                     <span style={{fontSize:'13px', color:'#0b2e4a', fontWeight:'bold', cursor: 'pointer'}}>{b.full_name?.split(' ')[0]}</span>
                  </Link>
                </div>
                <Link href={`/chat?uid=${b.id}`} style={{textDecoration:'none', fontSize:'16px'}}>💬</Link>
              </div>
            ))}
            <Link href="/believers" style={{fontSize:'12px', color:'#2e8b57', fontWeight:'bold', display:'block', marginTop:'5px', textDecoration:'none'}}>Find More →</Link>
          </div>
          
          <div className="panel-card">
            <h3>💬 Recent Chats</h3>
            {recentChats.map(c => (
              <Link key={c.id} href={`/chat?uid=${c.id}`} style={{display:'flex', alignItems:'center', gap:'10px', padding:'8px', background:'#f5f5f5', borderRadius:'8px', marginBottom:'5px', textDecoration:'none'}}>
                <img src={c.avatar_url || '/images/default-avatar.png'} style={{width:30, height:30, borderRadius:'50%'}} />
                <div style={{fontSize:'13px', fontWeight:'bold', color:'#000'}}>{c.full_name}</div>
              </Link>
            ))}
            <Link href="/chat" style={{display:'block', textAlign:'center', marginTop:'10px', fontSize:'12px', color:'#2e8b57', fontWeight:'600', textDecoration:'none'}}>Open Messenger →</Link>
          </div>
        </div>
      </div>

      {/* BLESS MODAL */}
      {blessModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '350px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#0b2e4a' }}>Bless {blessModalUser.full_name}</h3>
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${blessModalUser.upi_id}&pn=${encodeURIComponent(blessModalUser.full_name)}&cu=INR`)}`} style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
            </div>
            <a href={`upi://pay?pa=${blessModalUser.upi_id}&pn=${encodeURIComponent(blessModalUser.full_name)}&cu=INR`} target="_blank" style={{ display: 'block', width: '100%', padding: '12px', background: '#2e8b57', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', marginBottom: '10px' }}>Open Payment App</a>
            <button onClick={() => setBlessModalUser(null)} style={{ width: '100%', padding: '12px', background: '#f0f0f0', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* PARTNER MODAL */}
      {supportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '350px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#0b2e4a' }}>🕊️ Partner with Us</h3>
            <p style={{fontSize:'13px', color:'#666', marginBottom:'20px'}}>Your gift keeps this community free and safe.</p>
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${PLATFORM_UPI_ID}&pn=TheBelieverse&cu=INR`)}`} style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
            </div>
            <a href={`upi://pay?pa=${PLATFORM_UPI_ID}&pn=TheBelieverse&cu=INR`} target="_blank" style={{ display: 'block', width: '100%', padding: '12px', background: '#d4af37', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', marginBottom: '10px' }}>Donate via UPI</a>
            <button onClick={() => setSupportModalOpen(false)} style={{ width: '100%', padding: '12px', background: '#f0f0f0', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}