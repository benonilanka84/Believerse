"use client";

import DailyVerseWidget from "@/components/DailyVerseWidget";
import DailyPrayerWidget from "@/components/DailyPrayerWidget";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CreatePost from "@/components/CreatePost";
import Link from "next/link";
import "@/styles/dashboard.css";
import LiveNowFeed from "@/components/LiveNowFeed";

export default function Dashboard() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#0b2e4a" }}>Loading Sanctuary...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [suggestedBelievers, setSuggestedBelievers] = useState([]);
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState({}); 
  const [blessModalUser, setBlessModalUser] = useState(null); 
  const [supportModalOpen, setSupportModalOpen] = useState(false); 
  const [showFounderWelcome, setShowFounderWelcome] = useState(false);
  const [editingPrayerId, setEditingPrayerId] = useState(null);
  const [prayerEditContent, setPrayerEditContent] = useState("");

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (searchParams.get("status") === "welcome_founder") {
      setShowFounderWelcome(true);
    }
  }, [searchParams]);

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

  useEffect(() => {
    const targetPostId = searchParams.get('postId');
    if (targetPostId && posts.length > 0) {
      setActiveCommentPostId(targetPostId);
      if (!comments[targetPostId]) {
        toggleComments(targetPostId);
      }
      
      setTimeout(() => {
        const element = document.getElementById(`post-${targetPostId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [searchParams, posts.length]);

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

  const getBadgeUI = () => {
    if (!profile || !profile.subscription_tier) return null;
    const plan = profile.subscription_tier.trim().toLowerCase();
    // Logic updated to ensure Platinum Partner shows correctly
    if (plan.includes('platinum')) {
      return (
        <span style={{ background: "linear-gradient(45deg, #29b6f6, #0288d1)", color: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px", marginLeft: "10px", boxShadow: "0 2px 5px rgba(41, 182, 246, 0.4)" }}>
          💎 Platinum Partner
        </span>
      );
    }
    if (plan.includes('gold')) {
      return (
        <span style={{ background: "linear-gradient(45deg, #d4af37, #f9d976)", color: "#0b2e4a", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px", marginLeft: "10px", boxShadow: "0 2px 5px rgba(212, 175, 55, 0.4)" }}>
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
    else { alert("🌍 International Blessing is coming soon!"); }
  }

  async function handlePartnerClick() {
    const isIndia = await checkIsIndia();
    if (isIndia) { setSupportModalOpen(true); } 
    else {
      let inputAmount = prompt("Enter the amount in USD ($):", "10");
      if (inputAmount === null) return;
      const amount = parseFloat(inputAmount);
      if (isNaN(amount) || amount < 1) return;
      const res = await loadRazorpayScript();
      if (!res) return;
      try {
        const response = await fetch("/api/razorpay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: amount, currency: "USD" }) });
        const data = await response.json();
        const options = { key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount: data.order.amount, currency: data.order.currency, name: "The Believerse", order_id: data.order.id, handler: function (response) { alert(`Thank you for your gift of $${amount}!`); }, theme: { color: "#2e8b57" } };
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } catch (error) { console.error(error); }
    }
  }

  async function handleAmen(post, currentlyAmened) {
    setPosts(posts.map(p => p.id === post.id ? { ...p, hasAmened: !currentlyAmened, amenCount: currentlyAmened ? p.amenCount - 1 : p.amenCount + 1 } : p));
    if (currentlyAmened) { await supabase.from('amens').delete().match({ user_id: user.id, post_id: post.id }); } 
    else { 
        await supabase.from('amens').insert({ user_id: user.id, post_id: post.id });
        if (user && user.id !== post.user_id) { 
          await supabase.from('notifications').insert({ 
            user_id: post.user_id, 
            actor_id: user.id, 
            type: 'amen', 
            content: 'said Amen to your post.', 
            link: `/dashboard?postId=${post.id}#post-${post.id}` 
          }); 
        }
    }
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

  async function handleSpread(post) {
    const shareUrl = `${window.location.origin}/walk/${post.id}`;
    const marketingText = `Check out this testimony on The Believerse sanctuary! 📖\n\n"${post.content.substring(0, 100)}..."\n\nJoin us: ${shareUrl}`;
    
    try {
      if (post.media_url && !post.media_url.includes('iframe')) {
        const response = await fetch(post.media_url);
        const blob = await response.blob();
        const file = new File([blob], `the-walk-post.png`, { type: blob.type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'The Believerse',
            text: marketingText
          });
          return;
        }
      }

      if (navigator.share) {
        await navigator.share({ title: 'The Believerse', text: marketingText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${marketingText}`);
        alert("Spread link and content copied to clipboard!");
      }
    } catch (err) {
      console.error("Spread failed:", err);
    }
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
    const { data, error } = await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content: newComment }).select('*, profiles(full_name, avatar_url)').single();
    if (data) {
      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data] }));
      setNewComment("");
      
      const targetPost = posts.find(p => p.id === postId);
      if (user && user.id !== targetPost.user_id) {
        await supabase.from('notifications').insert({
          user_id: targetPost.user_id,
          actor_id: user.id,
          type: 'comment',
          content: 'commented on your post.',
          link: `/dashboard?postId=${postId}#post-${postId}`
        });
      }
    }
  }

  async function deleteComment(postId, commentId) {
    if (!confirm("Delete your comment?")) return;
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) {
      setComments(prev => ({ ...prev, [postId]: prev[postId].filter(c => c.id !== commentId) }));
    }
  }

  async function reportComment(commentId) {
    if (confirm("Report this comment for community guideline violations?")) {
      await supabase.from('reports').insert({ target_type: 'comment', target_id: commentId, reporter_id: user.id });
      alert("Thank you. Leadership will review this comment.");
    }
  }

  if (!mounted) return null;
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Believer';

  return (
    <div className="dashboard-wrapper">
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "20px 30px", borderRadius: "12px", color: "white", marginBottom: "20px", display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <span style={{fontSize:'2.5rem'}}>🏠</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', display:'flex', alignItems:'center', gap:'5px' }}>Welcome, {firstName} {getBadgeUI()}</h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>Walking with God and fellow Believers</p>
          </div>
        </div>
      </div>

      <div style={{ width: "100%", marginBottom: "40px" }}><LiveNowFeed /></div>

      <div className="dashboard-grid">
        <div className="left-panel">
          <DailyVerseWidget key={new Date().toDateString()} /><DailyPrayerWidget />
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
          {/* UPDATED: Passing the subscription_tier to CreatePost for Guardrail recognition */}
          {user && <CreatePost user={user} tier={profile?.subscription_tier} onPostCreated={() => { loadPosts(user.id, true); loadPrayerWall(user.id); }} />}
          <div className="panel-card">
            <h3>🏠 The Walk</h3>
            {loadingPosts ? <p style={{textAlign:'center', padding:'20px'}}>Loading...</p> : 
             posts.length === 0 ? <div style={{textAlign:'center', padding:'40px', color:'#666'}}>The Walk is quiet. Be the first to share!</div> :
             posts.map(post => (
               <div 
                 key={post.id} 
                 id={`post-${post.id}`}
                 style={{
                   border: searchParams.get('postId') === post.id ? '2px solid #d4af37' : '1px solid #eee', 
                   borderRadius:'12px', 
                   padding:'15px', 
                   marginBottom:'15px', 
                   background: searchParams.get('postId') === post.id ? '#fff9e6' : '#fafafa',
                   transition: 'all 0.4s ease'
                 }}
               >
                 <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                   <Link href={`/profile/${post.user_id}`}><img src={post.author?.avatar_url || '/images/default-avatar.png'} style={{width:40, height:40, borderRadius:'50%', objectFit:'cover', cursor: 'pointer'}} /></Link>
                   <div>
                      <Link href={`/profile/${post.user_id}`} style={{textDecoration:'none'}}><div style={{fontWeight:'bold', color:'#0b2e4a', cursor: 'pointer'}}>{post.author?.full_name}</div></Link>
                      <div style={{fontSize:'12px', color:'#666'}}>{new Date(post.created_at).toDateString()}</div>
                   </div>
                   <div style={{marginLeft:'auto', position:'relative'}}>
                       <button onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} style={{border:'none', background:'none', fontSize:'20px', cursor:'pointer', padding:'5px', color:'#666'}}>⋮</button>
                       {openMenuId === post.id && (
                         <div style={{position:'absolute', right:0, top:'30px', background:'white', border:'1px solid #eee', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', borderRadius:'8px', zIndex:10, width:'150px', overflow:'hidden'}}>
                           {user?.id === post.user_id ? (
                             <><button onClick={() => startEditing(post)} style={{width:'100%', padding:'10px', textAlign:'left', border:'none', background:'white', cursor:'pointer', fontSize:'13px', color:'#333', borderBottom:'1px solid #f5f5f5'}}>📝 Edit</button><button onClick={() => handleDeletePost(post.id)} style={{width:'100%', padding:'10px', textAlign:'left', border:'none', background:'white', cursor:'pointer', color:'red', fontSize:'13px'}}>🗑️ Delete</button></>
                           ) : (
                             <button onClick={() => { if(confirm("Report this post?")) alert("Reported."); setOpenMenuId(null); }} style={{width:'100%', padding:'10px', textAlign:'left', border:'none', background:'white', cursor:'pointer', color:'#d4af37', fontSize:'13px'}}>🚩 Report</button>
                           )}
                         </div>
                       )}
                   </div>
                 </div>
                 {editingPost === post.id ? (
                   <div style={{marginBottom:'10px'}}><input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" style={{width:'100%', padding:'8px', marginBottom:'5px', borderRadius:'4px', border:'1px solid #ddd'}} /><textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="Content" style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #ddd', minHeight:'100px'}} /><div style={{marginTop:'5px', display:'flex', gap:'5px', justifyContent:'flex-end'}}><button onClick={() => handleUpdatePost(post.id)} style={{padding:'6px 12px', background:'#2e8b57', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}>Save</button><button onClick={() => setEditingPost(null)} style={{padding:'6px 12px', background:'#ccc', border:'none', borderRadius:'4px', cursor:'pointer'}}>Cancel</button></div></div>
                 ) : (
                   <>{post.title && <h4 style={{margin:'0 0 5px 0', color: '#0b2e4a'}}>{post.title}</h4>}<p style={{whiteSpace:'pre-wrap', color:'#333'}}>{post.content}</p>{post.media_url && ((post.media_url.includes("iframe.mediadelivery.net") || post.media_url.includes("video.bunnycdn")) ? (<div style={{ position: 'relative', width: '100%', height: 0, paddingBottom: post.type === 'Glimpse' ? '177.77%' : '56.25%', marginTop: '10px', background: 'black', borderRadius: '8px', overflow: 'hidden' }}><iframe src={post.media_url + "?autoplay=false&loop=false"} loading="lazy" style={{ position: 'absolute', top: 0, left: 0, border: 'none', width: '100%', height: '100%' }} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowFullScreen={true} /></div>) : (<img src={post.media_url} style={{width:'100%', borderRadius:'8px', marginTop:'10px', objectFit:'cover'}} onError={(e) => { e.target.style.display='none'; }} />))}</>
                 )}
                 <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'15px', borderTop:'1px solid #eee', paddingTop:'10px', width:'100%'}}>
                     <button onClick={() => handleAmen(post, post.hasAmened)} style={{background:'none', border:'none', color: post.hasAmened ? '#2e8b57' : '#666', fontWeight: post.hasAmened ? 'bold' : 'normal', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>🙏 Amen ({post.amenCount})</button>
                     <button onClick={() => toggleComments(post.id)} style={{background:'none', border:'none', color:'#666', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>💬 Comment</button>
                     <button onClick={() => handleBlessClick(post.author)} style={{background:'none', border:'none', color:'#d4af37', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>✨ Bless</button>
                     <button onClick={() => handleSpread(post)} style={{background:'none', border:'none', color:'#666', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>📢 Spread</button>
                 </div>
                 {activeCommentPostId === post.id && (
                   <div style={{marginTop:'15px', background:'#f9f9f9', padding:'10px', borderRadius:'8px'}}>
                     <div style={{maxHeight:'200px', overflowY:'auto', marginBottom:'10px'}}>
                       {comments[post.id]?.length > 0 ? comments[post.id].map(c => (
                         <div key={c.id} style={{display:'flex', gap:'10px', marginBottom:'8px', position:'relative'}}>
                           <img src={c.profiles?.avatar_url || '/images/default-avatar.png'} style={{width:25, height:25, borderRadius:'50%'}} />
                           <div style={{background:'white', padding:'5px 10px', borderRadius:'10px', fontSize:'13px', flex:1, color:'#333'}}>
                             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                               <div style={{fontWeight:'bold', fontSize:'12px', color:'#0b2e4a'}}>{c.profiles?.full_name}</div>
                               <div style={{display:'flex', gap:'5px'}}>
                                 {user?.id === c.user_id ? (
                                   <button onClick={() => deleteComment(post.id, c.id)} style={{border:'none', background:'none', cursor:'pointer', fontSize:'10px', color:'red'}}>🗑️</button>
                                 ) : (
                                   <button onClick={() => reportComment(c.id)} style={{border:'none', background:'none', cursor:'pointer', fontSize:'10px'}}>🚩</button>
                                 )}
                               </div>
                             </div>
                             {c.content}
                           </div>
                         </div>
                       )) : <p style={{fontSize:'12px', color:'#999'}}>No comments yet.</p>}
                     </div>
                     <div style={{display:'flex', gap:'10px'}}>
                       <input type="text" placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} style={{flex:1, padding:'8px', borderRadius:'20px', border:'1px solid #ddd', fontSize:'13px', color:'#333'}} onKeyDown={e => e.key === 'Enter' && postComment(post.id)} />
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
              <div key={b.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}><div style={{display:'flex', alignItems:'center', gap:'8px'}}><Link href={`/profile/${b.id}`}><img src={b.avatar_url || '/images/default-avatar.png'} style={{width:30, height:30, borderRadius:'50%', cursor: 'pointer'}} /></Link><Link href={`/profile/${b.id}`} style={{textDecoration:'none'}}><span style={{fontSize:'13px', color:'#0b2e4a', fontWeight:'bold', cursor: 'pointer'}}>{b.full_name?.split(' ')[0]}</span></Link></div><Link href={`/chat?uid=${b.id}`} style={{textDecoration:'none', fontSize:'16px'}}>💬</Link></div>
            ))}
            <Link href="/believers" style={{fontSize:'12px', color:'#2e8b57', fontWeight:'bold', display:'block', marginTop:'5px', textDecoration:'none'}}>Find More →</Link>
          </div>
          <div className="panel-card" style={{background:'#fff9e6', borderLeft:'4px solid #d4af37'}}>
            <h3>🙏 Prayer Wall</h3>
            {prayerRequests.length === 0 ? <p style={{fontSize:'12px', color:'#666'}}>No requests.</p> : prayerRequests.map(p => (<div key={p.id} style={{marginBottom:'8px', fontSize:'12px', position:'relative', borderBottom:'1px dotted #ccc', paddingBottom:'5px'}}><div style={{fontWeight:'bold', color:'#000', display:'flex', justifyContent:'space-between', alignItems:'center'}}><span>{p.profiles?.full_name}</span>{user && user.id === p.user_id && (<div style={{display:'flex', gap:'5px'}}><button onClick={() => { setEditingPrayerId(p.id); setPrayerEditContent(p.content); }} style={{border:'none', background:'none', color:'#2d6be3', cursor:'pointer', fontSize:'10px', padding:0}}>✏️</button><button onClick={() => deletePrayerFromWidget(p.id)} style={{border:'none', background:'none', color:'red', cursor:'pointer', fontSize:'10px', padding:0}}>🗑️</button></div>)}</div>{editingPrayerId === p.id ? (<div style={{marginTop:'5px'}}><textarea value={prayerEditContent} onChange={e => setPrayerEditContent(e.target.value)} style={{width:'100%', fontSize:'12px', border:'1px solid #ddd', borderRadius:'4px'}} /><div style={{display:'flex', gap:'5px', marginTop:'5px'}}><button onClick={() => updatePrayerInWidget(p.id)} style={{fontSize:'10px', background:'#2e8b57', color:'white', border:'none', borderRadius:'3px', padding:'2px 5px'}}>Save</button><button onClick={() => setEditingPrayerId(null)} style={{fontSize:'10px', background:'#ccc', border:'none', borderRadius:'3px', padding:'2px 5px'}}>Cancel</button></div></div>) : (<div style={{fontStyle:'italic', color:'#555'}}>"{p.content.substring(0, 40)}..."</div>)}</div>))}
            <button style={{width:'100%', padding:'8px', background:'#2e8b57', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', marginTop:'10px'}}>I'll Pray</button>
          </div>
          <div className="panel-card">
            <h3>💬 Recent Chats</h3>
            {recentChats.map(c => (<Link key={c.id} href={`/chat?uid=${c.id}`} style={{display:'flex', alignItems:'center', gap:'10px', padding:'8px', background:'#f5f5f5', borderRadius:'8px', marginBottom:'5px', textDecoration:'none'}}><img src={c.avatar_url || '/images/default-avatar.png'} style={{width:30, height:30, borderRadius:'50%'}} /><div style={{fontSize:'13px', fontWeight:'bold', color:'#000'}}>{c.full_name}</div></Link>))}
          </div>
        </div>
      </div>

      {blessModalUser && (<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}><div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '350px', textAlign: 'center' }}><h3 style={{ margin: '0 0 15px 0', color: '#0b2e4a' }}>Bless {blessModalUser.full_name}</h3><img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${blessModalUser.upi_id}&pn=${encodeURIComponent(blessModalUser.full_name)}&cu=INR`)}`} style={{ width: '100%', borderRadius: '8px' }} /><button onClick={() => setBlessModalUser(null)} style={{ width: '100%', padding: '12px', background: '#f0f0f0', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop:'10px' }}>Close</button></div></div>)}
      {supportModalOpen && (<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}><div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '350px', textAlign: 'center' }}><h3 style={{ margin: '0 0 10px 0', color: '#0b2e4a' }}>🕊️ Partner with Us</h3><button onClick={() => setSupportModalOpen(false)} style={{ width: '100%', padding: '12px', background: '#f0f0f0', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop:'10px' }}>Close</button></div></div>)}

      {showFounderWelcome && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11, 46, 74, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: "20px" }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '500px', textAlign: 'center', border: "4px solid #d4af37", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: "50px", marginBottom: "20px" }}>👑</div>
            <h2 style={{ color: "#0b2e4a", fontSize: "28px", margin: "0 0 15px 0", fontWeight: "800" }}>Welcome, Founding Steward</h2>
            <p style={{ color: "#334155", lineHeight: "1.6", fontSize: "16px", marginBottom: "30px" }}>Your account has been successfully provisioned with <strong>Lifetime Platinum Access</strong>.</p>
            <button onClick={() => setShowFounderWelcome(false)} style={{ background: "#d4af37", color: "white", padding: "14px 40px", borderRadius: "10px", border: "none", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>Enter the Sanctuary</button>
          </div>
        </div>
      )}
    </div>
  );
}

function getDaysInMonth(date) {
  const year = date.getFullYear(); const month = date.getMonth();
  return { daysInMonth: new Date(year, month + 1, 0).getDate(), startingDayOfWeek: new Date(year, month, 1).getDay() };
}