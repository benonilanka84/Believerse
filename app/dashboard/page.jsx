"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CreatePost from "@/components/CreatePost";
import BibleWidget from "@/components/BibleWidget"; // Imported the new widget
import Link from "next/link";
import "@/styles/dashboard.css";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  // Data States
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // Verse Image State
  const [verseImage, setVerseImage] = useState(null);
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
        // Fetch Profile for "Welcome [Name]"
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
        loadPosts(user.id);
      }
    };
    getUser();
  }, [mounted]);

  // --- LOGIC: Visual Verse (Req #10) ---
  function generateDailyVisualVerse() {
    // Logic: Keywords map to specific Christian-safe Unsplash IDs
    const verses = [
      { text: "I am the good shepherd. The good shepherd lays down his life for the sheep.", ref: "John 10:11", keyword: "sheep" },
      { text: "The Lord is my light and my salvation; whom shall I fear?", ref: "Psalm 27:1", keyword: "light" },
      { text: "He leads me beside still waters.", ref: "Psalm 23:2", keyword: "water" }
    ];
    
    // Pick based on date to rotate daily
    const dayIndex = new Date().getDate() % verses.length;
    const todayVerse = verses[dayIndex];
    setVerseData(todayVerse);

    // Backgrounds (Shepherd, Sun, Water)
    const backgrounds = {
      sheep: "https://images.unsplash.com/photo-1484557985045-6f5c98486c90?auto=format&fit=crop&w=800&q=80",
      light: "https://images.unsplash.com/photo-1505322022379-7c3353ee6291?auto=format&fit=crop&w=800&q=80",
      water: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80"
    };

    setVerseImage(backgrounds[todayVerse.keyword]);
  }

  // --- LOGIC: Real Posts ---
  async function loadPosts(currentUserId) {
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from('posts')
      .select(`*, profiles (username, full_name, avatar_url), amens (user_id)`)
      .order('created_at', { ascending: false });

    if (!error) {
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

  // --- LOGIC: Actions (Amen/Spread) ---
  async function handleAmen(postId, currentlyAmened) {
    // Optimistic UI update
    setPosts(posts.map(p => p.id === postId ? 
      { ...p, hasAmened: !currentlyAmened, amenCount: currentlyAmened ? p.amenCount - 1 : p.amenCount + 1 } : p
    ));

    if (currentlyAmened) {
      await supabase.from('amens').delete().match({ user_id: user.id, post_id: postId });
    } else {
      await supabase.from('amens').insert({ user_id: user.id, post_id: postId });
    }
  }

  function handleSpread(post) {
    if (navigator.share) {
      navigator.share({
        title: 'The Believerse',
        text: `Check out this testimony on The Believerse: "${post.content}"`
      });
    } else {
      alert("Link copied to clipboard! Spread the word.");
    }
  }

  if (!mounted) return null;

  // Req #8: Header Logic (First Name split)
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Believer';

  return (
    <div className="dashboard-wrapper">
      {/* Req #8: Header - Green, Welcome Name, Tagline */}
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "25px 30px", borderRadius: "12px", color: "white", marginBottom: "25px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <span style={{fontSize:'2rem'}}>🏠</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.8rem" }}>Welcome, {firstName}</h2>
            <p style={{ margin: "5px 0 0 0", opacity: 0.9, fontSize: '14px' }}>Walking with God and fellow Believers</p>
          </div>
        </div>
      </div>

      {/* Req #9: Grid Layout (1/4 - 1/2 - 1/4) */}
      <div className="dashboard-grid">
        
        {/* LEFT PANEL (1/4) */}
        <div className="left-panel">
          
          {/* Req #7: Bible Widget */}
          <BibleWidget />

          {/* Req #10: Visual Verse of the Day */}
          <div className="panel-card" style={{padding:0, overflow:'hidden', position:'relative'}}>
            <div style={{padding:'15px', background:'#0b2e4a', color:'white'}}>
              <h3 style={{margin:0, color:'white', fontSize:'16px'}}>Verse of the Day</h3>
            </div>
            <div style={{
              backgroundImage: `url(${verseImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '300px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
              textAlign: 'center',
              color: 'white',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)'
            }}>
              <p style={{fontSize:'18px', fontWeight:'bold', fontFamily:'Georgia'}}>"{verseData?.text}"</p>
              <p style={{marginTop:'10px'}}>{verseData?.ref}</p>
              <img src="/images/final-logo.png" style={{width:'30px', marginTop:'15px', opacity:0.8}} />
            </div>
            <div style={{display:'flex', borderTop:'1px solid #eee'}}>
              <button style={{flex:1, padding:'12px', border:'none', background:'white', cursor:'pointer', borderRight:'1px solid #eee', color:'#2e8b57', fontWeight:'bold'}}>🙏 Amen</button>
              <button style={{flex:1, padding:'12px', border:'none', background:'white', cursor:'pointer', color:'#0b2e4a', fontWeight:'bold'}}>📢 Spread</button>
            </div>
          </div>

        </div>

        {/* CENTER PANEL (1/2) - The Walk */}
        <div className="center-panel">
          {/* Req #12: Create Post */}
          {user && <CreatePost user={user} onPostCreated={() => loadPosts(user.id)} />}
          
          <div className="panel-card">
            <h3 style={{marginBottom:'20px'}}>🏠 The Walk</h3>
            {loadingPosts ? <p>Loading...</p> : posts.map((post) => (
              <div key={post.id} style={{ border: "1px solid #e0e0e0", borderRadius: "12px", padding: "15px", marginBottom: "15px", background: "#fafafa" }}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                  <img src={post.author?.avatar_url || '/images/default-avatar.png'} style={{width:40, height:40, borderRadius:'50%'}} />
                  <div>
                    <div style={{fontWeight:'bold'}}>{post.author?.full_name}</div>
                    <div style={{fontSize:'12px', color:'#666'}}>{new Date(post.created_at).toDateString()}</div>
                  </div>
                  <span style={{marginLeft:'auto', fontSize:'12px', background:'#e8f5e9', padding:'4px 8px', borderRadius:'10px', color:'#2e8b57'}}>{post.type}</span>
                </div>

                {/* Post Title */}
                {post.title && <h4 style={{margin:'0 0 8px 0', color:'#0b2e4a'}}>{post.title}</h4>}
                
                <p style={{whiteSpace:'pre-wrap', color:'#333'}}>{post.content}</p>
                
                {/* Actions */}
                <div style={{display:'flex', gap:'20px', marginTop:'15px', borderTop:'1px solid #eee', paddingTop:'10px'}}>
                  <button onClick={() => handleAmen(post.id, post.hasAmened)} style={{border:'none', background:'none', color: post.hasAmened ? '#2e8b57':'#666', fontWeight:'bold', cursor:'pointer'}}>
                    🙏 Amen ({post.amenCount})
                  </button>
                  <button onClick={() => handleSpread(post)} style={{border:'none', background:'none', color:'#666', cursor:'pointer'}}>
                    📢 Spread
                  </button>
                  <button style={{border:'none', background:'none', color:'#666', cursor:'pointer'}}>
                    💬 Comment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL (1/4) */}
        <div className="right-panel">
          {/* Req #13: Suggested Believers */}
          <div className="panel-card">
            <h3>🤝 Suggested Believers</h3>
            {[1,2,3].map(i => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', margin:'10px 0'}}>
                <span>Believer {i}</span>
                <button style={{fontSize:'12px', padding:'2px 8px', background:'#f0f0f0', border:'none', borderRadius:'4px'}}>+ Connect</button>
              </div>
            ))}
          </div>

          {/* Prayer Requests */}
          <div className="panel-card" style={{background:'#fff9e6', borderLeft:'4px solid #d4af37'}}>
            <h3>🙏 Prayer Wall</h3>
            <p style={{fontStyle:'italic', fontSize:'14px'}}>"Pray for my healing..."</p>
            <button style={{width:'100%', padding:'8px', background:'#2e8b57', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}>I'll Pray</button>
          </div>

          {/* Chat Feature */}
          <div className="panel-card">
            <h3>💬 Chat</h3>
            <div style={{padding:'10px', background:'#f5f5f5', borderRadius:'8px', textAlign:'center', color:'#666'}}>
              No active chats
            </div>
            <Link href="/chat" style={{display:'block', textAlign:'center', marginTop:'10px', fontSize:'12px'}}>Open Messenger</Link>
          </div>
        </div>

      </div>
    </div>
  );
}