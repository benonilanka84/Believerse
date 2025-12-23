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

  // --- HELPER DATA LOADERS ---
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
    const { data, error } = await supabase.from('posts').select(`*, profiles (username, full_name, avatar_url, upi_id), amens (user_id)`).neq('type', 'Prayer').order('created_at', { ascending: false });
    if (!error && data) { const formatted = data.map(p => ({ ...p, author: p.profiles, amenCount: p.amens.length, hasAmened: p.amens.some(a => a.user_id === currentUserId) })); setPosts(formatted); }
    setLoadingPosts(false);
  }

  // --- ACTIONS ---
  async function checkIsIndia() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      return data.country_code === "IN";
    } catch (e) { return true; }
  }

  async function handleBlessClick(author) {
    if (!author?.upi_id) { alert(`God bless! ${author.full_name} has not set up their UPI ID yet.`); return; }
    const isIndia = await checkIsIndia();
    if (isIndia) { setBlessModalUser(author); } 
    else { alert("🌍 International Blessing is coming soon!\n\nCurrently, direct blessings are available for UPI (India) users only."); }
  }

  async function handlePartnerClick() {
    const isIndia = await checkIsIndia();
    if (isIndia) { setSupportModalOpen(true); } 
    else {
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
          amount: data.order.amount, currency: data.order.currency,
          name: "The Believerse", description: "Partner Contribution",
          image: "/images/final-logo.png", order_id: data.order.id,
          handler: function (response) { alert(`Thank you! \nPayment ID: ${response.razorpay_payment_id}`); },
          theme: { color: "#2e8b57" },
        };
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } catch (error) { alert("Unable to initiate payment."); }
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
    const shareUrl = window.location.origin; 
    const fullText = `${text}\n\nVia The Believerse: ${shareUrl}`;
    if (navigator.share) { navigator.share({ title: 'The Believerse', text: fullText, url: shareUrl }); } 
    else { navigator.clipboard.writeText(fullText); alert("Copied!"); }
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

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Believer';

  return (
    <div className="dashboard-wrapper">
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "20px 30px", borderRadius: "12px", color: "white", marginBottom: "20px", display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <span style={{fontSize:'2.5rem'}}>🏠</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', display:'flex', alignItems:'center', gap:'5px' }}>
              Welcome, {firstName} {getBadgeUI()}
            </h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>Walking with God and fellow Believers</p>
          </div>
        </div>
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
                 </div>
                 <p>{post.content}</p>
                 {post.media_url && (
                   <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', background: '#000', width: '100%' }}>
                     {post.media_url.includes("iframe.mediadelivery.net") ? (
                       <div style={{ width: '100%', aspectRatio: post.type === 'Glimpse' ? '9/16' : '16/9' }}>
                         <iframe src={post.media_url} style={{ border: 'none', width: '100.5%', height: '100.5%', position: 'absolute', top: '-0.25%', left: '-0.25%' }} allowFullScreen={true} />
                       </div>
                     ) : <img src={post.media_url} style={{width:'100%', borderRadius:'8px'}} />}
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
          <div className="panel-card"><h3>🤝 Suggested</h3>{suggestedBelievers.map(b => <div key={b.id}>{b.full_name}</div>)}</div>
          <div className="panel-card"><h3>🙏 Prayer Wall</h3>{prayerRequests.map(p => <div key={p.id}>{p.content}</div>)}</div>
        </div>
      </div>
    </div>
  );
}

function getDaysInMonth(date) {
  const year = date.getFullYear(); const month = date.getMonth();
  return { daysInMonth: new Date(year, month + 1, 0).getDate(), startingDayOfWeek: new Date(year, month, 1).getDay() };
}