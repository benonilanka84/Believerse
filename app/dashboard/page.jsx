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

  // BLESS MODAL STATE
  const [blessModalUser, setBlessModalUser] = useState(null);

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
    const year = date.getFullYear(); 
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    setFilteredEvents(allEvents.filter(e => e.event_date === dateStr));
  }

  function handleDateClick(day) {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    setSelectedDate(newDate);
    filterEventsByDate(newDate, events);
  }

  // --- 4. FEED ---
  async function loadPosts(currentUserId, isRefresh = false) {
    if (!isRefresh) setLoadingPosts(true);
    
    const { data, error } = await supabase
      .from('posts')
      .select(`*, profiles (username, full_name, avatar_url, upi_id), amens (user_id)`) 
      .neq('type', 'Glimpse') // Exclude Glimpses from Feed
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

  // --- 5. ACTIONS (With Notifications) ---
  
  // Bless Action
  async function handleBlessClick(author) {
    if (!author?.upi_id) {
      alert(`God bless! ${author.full_name} has not set up their UPI ID yet.`);
      return;
    }
    setBlessModalUser(author);
    
    // SEND NOTIFICATION TO AUTHOR
    if (user && user.id !== author.id) { // Don't notify self
      await supabase.from('notifications').insert({
        user_id: author.id, // Receiver (The person being blessed)
        actor_id: user.id, // Sender (Me)
        type: 'bless',
        content: `${profile?.full_name} opened your Bless link.`,
        link: '/dashboard'
      });
    }
  }

  // Amen Action
  async function handleAmen(post, currentlyAmened) {
    // Optimistic Update
    setPosts(posts.map(p => p.id === post.id ? { ...p, hasAmened: !currentlyAmened, amenCount: currentlyAmened ? p.amenCount - 1 : p.amenCount + 1 } : p));
    
    if (currentlyAmened) {
      // Remove Amen
      await supabase.from('amens').delete().match({ user_id: user.id, post_id: post.id });
    } else {
      // Add Amen
      await supabase.from('amens').insert({ user_id: user.id, post_id: post.id });
      
      // SEND NOTIFICATION TO POST AUTHOR
      if (user && user.id !== post.user_id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id, // Post Author
          actor_id: user.id, // Me
          type: 'amen',
          content: `${profile?.full_name} said Amen to your post.`,
          link: '/dashboard' // In future, link to specific post ID
        });
      }