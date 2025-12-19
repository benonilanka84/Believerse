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
    fetchNotifications();

    // OPTIONAL: Realtime Listener (Updates badge instantly when notification comes)
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, 
        (payload) => {
          // If the notification is for ME, update the count
          supabase.auth.getUser().then(({data}) => {
            if (data.user && payload.new.user_id === data.user.id) {
              setUnreadCount(prev => prev + 1);
              // Optionally fetch the new item immediately
              fetchNotifications();
            }
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [dropdownRef]);

  async function fetchNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get Unread Count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    setUnreadCount(count || 0);

    // 2. Get Recent Notifications (Limit 10)
    const { data } = await supabase
      .from('notifications')
      .select(`*, actor:actor_id(full_name, avatar_url)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setNotifications(data);
  }

  async function handleOpen() {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark all as read when opening
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
      setUnreadCount(0);
    }
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      
      {/* BELL ICON */}
      <button 
        onClick={handleOpen} 
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '5px' }}
      >
        <span style={{ fontSize: '24px', color: '#0b2e4a' }}>🔔</span>
        
        {/* RED BADGE */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            background: '#e74c3c',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            border: '2px solid white'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '40px',
          width: '320px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
          border: '1px solid #eee',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#0b2e4a', display:'flex', justifyContent:'space-between' }}>
            <span>Notifications</span>
            <span style={{fontSize:'12px', color:'#2e8b57', cursor:'pointer'}} onClick={() => setNotifications([])}>Clear</span>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((note) => (
                <Link href={note.link || '#'} key={note.id} style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
                  <div style={{
                    padding: '15px',
                    borderBottom: '1px solid #f9f9f9',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'start',
                    background: note.is_read ? 'white' : '#f0f9ff', // Highlight unread
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#fafafa'}
                  onMouseOut={(e) => e.currentTarget.style.background = note.is_read ? 'white' : '#f0f9ff'}
                  >
                    {/* Actor Avatar */}
                    <img 
                      src={note.actor?.avatar_url || '/images/default-avatar.png'} 
                      style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit:'cover' }}
                    />
                    
                    {/* Content */}
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#333', lineHeight: '1.4' }}>
                        <span style={{ fontWeight: 'bold' }}>{note.actor?.full_name}</span> {note.content}
                      </p>
                      <span style={{ fontSize: '11px', color: '#999' }}>
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          
          <div style={{ padding: '10px', textAlign: 'center', borderTop: '1px solid #eee', background: '#fafafa' }}>
            <Link href="/notifications" style={{ fontSize: '12px', fontWeight: 'bold', color: '#0b2e4a', textDecoration: 'none' }}>
              View All Activity
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}