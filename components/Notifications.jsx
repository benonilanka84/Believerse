"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let channel;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      fetchNotifications(user.id);

      // REAL-TIME LISTENER: Listens for Amens, Blesses, and Connects
      channel = supabase
        .channel(`user-notifications-${user.id}`)
        .on(
          'postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}` 
          }, 
          () => {
            // Re-fetch when a new activity occurs
            fetchNotifications(user.id);
          }
        )
        .subscribe();
    };

    init();

    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications(uid) {
    // 1. Get Count and Data in one go
    const { data, error } = await supabase
      .from('notifications')
      .select(`*, actor:actor_id(full_name, avatar_url)`)
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(15);
    
    if (!error && data) {
      setNotifications(data);
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    }
  }

  async function handleOpen() {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      // Mark as read in DB
      await supabase.from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      setUnreadCount(0);
    }
  }

  async function clearAll() {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('notifications').delete().eq('user_id', user.id);
    setNotifications([]);
    setUnreadCount(0);
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      
      {/* BELL ICON */}
      <button 
        onClick={handleOpen} 
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '5px', display: 'flex', alignItems: 'center' }}
      >
        <span style={{ fontSize: '22px' }}>🔔</span>
        
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: '#e74c3c',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            border: '2px solid white'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '45px',
          width: '320px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          border: '1px solid #eee',
          zIndex: 2000,
          overflow: 'hidden'
        }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#0b2e4a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize: '15px' }}>Activity</span>
            <button 
              onClick={clearAll}
              style={{ background: 'none', border: 'none', color: '#2e8b57', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
            >
              Clear All
            </button>
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                <div style={{ fontSize: '30px', marginBottom: '10px' }}>🌱</div>
                Your activity feed is quiet.
              </div>
            ) : (
              notifications.map((note) => (
                <Link 
                  href={note.link || '#'} 
                  key={note.id} 
                  style={{ textDecoration: 'none' }} 
                  onClick={() => setIsOpen(false)}
                >
                  <div style={{
                    padding: '12px 15px',
                    borderBottom: '1px solid #f5f5f5',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    background: note.is_read ? 'white' : '#f0f9ff',
                    transition: 'background 0.2s'
                  }}>
                    <img 
                      src={note.actor?.avatar_url || '/images/default-avatar.png'} 
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit:'cover', border: '1px solid #eee' }}
                    />
                    
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#333', lineHeight: '1.4' }}>
                        <span style={{ fontWeight: 'bold', color: '#0b2e4a' }}>{note.actor?.full_name}</span> {note.content}
                      </p>
                      <span style={{ fontSize: '11px', color: '#999' }}>
                        {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* DOT FOR UNREAD */}
                    {!note.is_read && <div style={{ width: '8px', height: '8px', background: '#2e8b57', borderRadius: '50%' }}></div>}
                  </div>
                </Link>
              ))
            )}
          </div>
          
          <Link 
            href="/dashboard" 
            style={{ display: 'block', padding: '12px', textAlign: 'center', background: '#fafafa', fontSize: '12px', fontWeight: 'bold', color: '#0b2e4a', textDecoration: 'none', borderTop: '1px solid #eee' }}
            onClick={() => setIsOpen(false)}
          >
            See Recent Walk Activity
          </Link>
        </div>
      )}
    </div>
  );
}