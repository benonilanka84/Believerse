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
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState({}); 
  const [blessModalUser, setBlessModalUser] = useState(null); 
  const [supportModalOpen, setSupportModalOpen] = useState(false); 
  const [editingPrayerId, setEditingPrayerId] = useState(null);
  const [prayerEditContent, setPrayerEditContent] = useState("");

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const PLATFORM_UPI_ID = "your-platform-upi@okhdfcbank"; 

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

  // Razorpay Script
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

  async function loadPosts(currentUserId, isRefresh = false) {
    if (!isRefresh) setLoadingPosts(true);
    const { data, error } = await supabase.from('posts').select(`*, profiles (username, full_name, avatar_url, upi_id), amens (user_id)`).neq('type', 'Prayer').order('created_at', { ascending: false });
    if (!error && data) {
      const formatted = data.map(p => ({ ...p, author: p.profiles, amenCount: p.amens.length, hasAmened: p.amens.some(a => a.user_id === currentUserId) }));
      setPosts(formatted);
    }
    setLoadingPosts(false);
  }

  // --- DATA LOADERS ---
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

  // --- ACTIONS ---
  async function checkIsIndia() {
    try { const res = await fetch('https://ipapi.co/json/'); const data = await res.json(); return data.country_code === "IN"; } catch (e) { return true; }
  }

  async function handleBlessClick(author) {
    if (!author?.upi_id) { alert(`God bless! ${author.full_name} has not set up their UPI ID yet.`); return; }
    const isIndia = await checkIsIndia();
    if (isIndia) { setBlessModalUser(author); } else { alert("🌍 International Blessing is coming soon!"); }
  }

  async function handlePartnerClick() {
    const isIndia = await checkIsIndia();
    if (isIndia) { setSupportModalOpen(true); } 
    else {
      let inputAmount = prompt("Enter amount ($):", "10");
      if (!inputAmount) return;
      const res = await loadRazorpayScript();
      if (!res) { alert("Payment gateway failed."); return; }
      try {
        const response = await fetch("/api/razorpay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: parseFloat(inputAmount), currency: "USD" }) });
        const data = await response.json();
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount: data.order.amount, currency: data.order.currency,
          name: "The Believerse", image: "/images/final-logo.png", order_id: data.order.id,
          handler: function (response) { alert(`Thank you! ID: ${response.razorpay_payment_id}`); }, theme: { color: "#2e8b57" }
        };
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } catch (error) { alert("Payment Error"); }
    }
  }

  async function handleAmen(post, currentlyAmened) {
    setPosts(posts.map(p => p.id === post.id ? { ...p, hasAmened: !currentlyAmened, amenCount: currentlyAmened ? p.amenCount - 1 : p.amenCount + 1 } : p));
    if (currentlyAmened) { await supabase.from('amens').delete().match({ user_id: user.id, post_id: post.id }); } 
    else { await supabase.from('amens').insert({ user_id: user.id, post_id: post.id }); }
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
    if (navigator.share) { navigator.share({ title: 'The Believerse', text: text, url: window.location.origin }); } 
    else { navigator.clipboard.writeText(text); alert("Copied!"); }
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

  const getBadgeUI = () => {
    if (!profile?.subscription_plan) return null;
    const plan = profile.subscription_plan.toLowerCase();
    if (plan.includes('platinum')) return <span style={{background:"linear-gradient(45deg, #29b6f6, #0288d1)", color:"white", padding:"4px 10px", borderRadius:"12px", fontSize:"12px", fontWeight:"bold", marginLeft:"10px"}}>💎 Platinum</span>;
    if (plan.includes('gold')) return <span style={{background:"linear-gradient(45deg, #d4af37, #f9d976)", color:"#0b2e4a", padding:"4px 10px", borderRadius:"12px", fontSize:"12px", fontWeight:"bold", marginLeft:"10px"}}>🥇 Gold</span>;
    return null;
  };

  if (!mounted) return null;
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Believer';
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);

  return (
    <div className="dashboard-wrapper">
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "20px 30px", borderRadius: "12px", color: "white", marginBottom: "20px", display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div><h2 style={{ margin: 0, fontSize: '24px', display:'flex', alignItems:'center' }}>Welcome, {firstName} {getBadgeUI()}</h2><p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>Walking with God and fellow Believers</p></div>
        <button onClick={handlePartnerClick} style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '30px', padding: '10px 24px', color: 'white', cursor: 'pointer', fontWeight: '700' }}>🕊️ Partner</button>
      </div>

      <div className="dashboard-grid">
        <div className="left-panel">
          <DailyVerseWidget />
          <DailyPrayerWidget />
          <div className="panel-card">
            <h3>📅 Events</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => <div key={i+1} onClick={() => handleDateClick(i+1)} style={{ textAlign: "center", padding: "6px", cursor: 'pointer', background: (i+1) === selectedDate.getDate() ? "#2e8b57" : "transparent", color: (i+1) === selectedDate.getDate() ? "white" : "#333" }}>{i+1}</div>)}
            </div>
          </div>
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
                   <div style={{marginLeft:'auto', position:'relative'}}>
                       <button onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} style={{border:'none', background:'none', fontSize:'20px', cursor:'pointer'}}>⋮</button>
                       {openMenuId === post.id && (
                         <div style={{position:'absolute', right:0, top:'30px', background:'white', border:'1px solid #eee', borderRadius:'8px', zIndex:10, width:'150px'}}>
                           {user?.id === post.user_id ? (
                             <><button onClick={() => startEditing(post)} style={{width:'100%', padding:'10px', textAlign:'left', border:'none', background:'white'}}>Edit</button><button onClick={() => handleDeletePost(post.id)} style={{width:'100%', padding:'10px', textAlign:'left', border:'none', background:'white', color:'red'}}>Delete</button></>
                           ) : <button onClick={() => alert("Reported")} style={{width:'100%', padding:'10px', textAlign:'left', border:'none', background:'white', color:'orange'}}>Report</button>}
                         </div>
                       )}
                   </div>
                 </div>
                 
                 {editingPost === post.id ? (
                   <div>
                     <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{width:'100%', padding:'5px', marginBottom:'5px'}} />
                     <textarea value={editContent} onChange={e => setEditContent(e.target.value)} style={{width:'100%', height:'100px'}} />
                     <button onClick={() => handleUpdatePost(post.id)} style={{marginRight:'5px'}}>Save</button><button onClick={() => setEditingPost(null)}>Cancel</button>
                   </div>
                 ) : (
                   <>
                     {post.title && <h4>{post.title}</h4>}
                     <p>{post.content}</p>
                     
                     {/* --- FIXED VIDEO RENDERER --- */}
                     {post.media_url && (
                       <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', background: '#000', width: '100%', position: 'relative' }}>
                         {post.media_url.includes("iframe.mediadelivery.net") || post.media_url.includes("video.bunnycdn") ? (
                           <div style={{ 
                             position: 'relative', 
                             width: '100%', 
                             paddingBottom: post.type === 'Glimpse' ? '177.77%' : '56.25%', // 9:16 vs 16:9 Aspect Ratio Hack
                             height: 0 
                           }}>
                             <iframe 
                               src={post.media_url} 
                               style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} 
                               allowFullScreen 
                             />
                           </div>
                         ) : (
                           post.media_url.match(/\.(mp4|webm|ogg|mov)$/i) ? 
                             <video src={post.media_url} controls style={{ width: '100%', height: 'auto', display: 'block' }} /> : 
                             <img src={post.media_url} style={{ width: '100%', display: 'block' }} />
                         )}
                       </div>
                     )}
                   </>
                 )}

                 <div style={{display:'flex', gap:'15px', marginTop:'15px'}}>
                   <button onClick={() => handleAmen(post, post.hasAmened)} style={{border:'none', background:'none', color: post.hasAmened ? 'green' : 'grey', cursor:'pointer'}}>🙏 Amen ({post.amenCount})</button>
                   <button onClick={() => toggleComments(post.id)} style={{border:'none', background:'none', cursor:'pointer'}}>💬 Comment</button>
                   <button onClick={() => handleBlessClick(post.author)} style={{border:'none', background:'none', cursor:'pointer'}}>✨ Bless</button>
                   <button onClick={() => handleShare(post.content)} style={{border:'none', background:'none', cursor:'pointer'}}>📢 Share</button>
                 </div>
                 
                 {activeCommentPostId === post.id && (
                   <div style={{marginTop:'10px', background:'#f9f9f9', padding:'10px', borderRadius:'8px'}}>
                     {comments[post.id]?.map(c => (
                       <div key={c.id} style={{fontSize:'13px', marginBottom:'5px'}}><b>{c.profiles?.full_name}:</b> {c.content}</div>
                     ))}
                     <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." style={{width:'80%', padding:'5px'}} />
                     <button onClick={() => postComment(post.id)} style={{width:'18%', marginLeft:'2%'}}>Post</button>
                   </div>
                 )}
               </div>
            ))}
          </div>
        </div>

        <div className="right-panel">
          <div className="panel-card">
            <h3>🤝 Suggested</h3>
            {suggestedBelievers.map(b => (
              <div key={b.id} style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                <img src={b.avatar_url || '/images/default-avatar.png'} style={{width:30, height:30, borderRadius:'50%'}} />
                <Link href={`/profile/${b.id}`} style={{textDecoration:'none', color:'#000', fontSize:'14px'}}>{b.full_name}</Link>
              </div>
            ))}
          </div>
          
          <div className="panel-card" style={{background:'#fff9e6'}}>
            <h3>🙏 Prayer Wall</h3>
            {prayerRequests.map(p => (
              <div key={p.id} style={{fontSize:'13px', borderBottom:'1px dotted #ccc', padding:'5px 0'}}>
                <b>{p.profiles?.full_name}</b>: {p.content}
                {user?.id === p.user_id && <button onClick={() => deletePrayerFromWidget(p.id)} style={{marginLeft:'5px', color:'red', border:'none', background:'none', cursor:'pointer'}}>x</button>}
              </div>
            ))}
          </div>

          {/* --- RESTORED CHAT WIDGET --- */}
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
    </div>
  );
}

function getDaysInMonth(date) {
  const year = date.getFullYear(); const month = date.getMonth();
  return { daysInMonth: new Date(year, month + 1, 0).getDate(), startingDayOfWeek: new Date(year, month, 1).getDay() };
}