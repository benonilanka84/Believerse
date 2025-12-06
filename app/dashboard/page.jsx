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
  
  // Visual Verse State
  const [verseData, setVerseData] = useState(null);

  // Events State
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredEvents, setFilteredEvents] = useState([]);

  // Dummy Chat Data
  const [conversations, setConversations] = useState([
    { id: 1, believerName: "John Doe", lastMessage: "God bless you! 🙏", lastMessageTime: new Date().toISOString(), unread: 2 }
  ]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    setMounted(true);
    generateDailyVisualVerse();
    loadDummyEvents();
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
        bg: "https://images.unsplash.com/photo-1484557985045-6f5c98486c90?q=80&w=800&auto=format&fit=crop" // Sheep
      },
      { 
        text: "The Lord is my light and my salvation; whom shall I fear?", 
        ref: "Psalm 27:1", 
        bg: "https://images.unsplash.com/photo-1505322022379-7c3353ee6291?q=80&w=800&auto=format&fit=crop" // Light
      },
      { 
        text: "He leads me beside still waters.", 
        ref: "Psalm 23:2", 
        bg: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop" // Water
      },
      { 
        text: "I look to the mountains; where will my help come from?", 
        ref: "Psalm 121:1", 
        bg: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop" // Mountains
      }
    ];
    
    // Rotate based on day of the month
    const dayIndex = new Date().getDate() % verses.length;
    setVerseData(verses[dayIndex]);
  }

  // --- 2. EVENTS LOGIC (Fully Functional) ---
  function loadDummyEvents() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const dummyEvents = [
      { id: