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

      channel = supabase.channel(`notifs-${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => fetchNotifications(user.id))
        .subscribe();
    };
    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    function clickOut(e) { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); }
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  async function fetchNotifications(uid) {
    const { data } = await supabase.from('notifications').select(`*, actor:actor_id(full_name, avatar_url)`).eq('user_id', uid).order('created_at', { ascending: false }).limit(10);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  }

  async function handleOpen() {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      setUnreadCount(0);
    }
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button onClick={handleOpen} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '5px' }}>
        <span style={{ fontSize: '24px', color: '#0b2e4a' }}>🔔</span>
        {unreadCount > 0 && <span style={{ position: 'absolute', top: '0px', right: '0px', background: '#e74c3c', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid white' }}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', right: 0, top: '45px', width: '320px', background: 'white', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.15)', border: '1px solid #eee', zIndex: 1000, overflow: 'hidden' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#0b2e4a' }}>Notifications</div>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {notifications.length === 0 ? <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>No notifications yet.</div> : notifications.map((n) => (
              <Link href={n.link || '#'} key={n.id} style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
                <div style={{ padding: '12px 15px', borderBottom: '1px solid #f9f9f9', display: 'flex', gap: '12px', background: n.is_read ? 'white' : '#f0f9ff' }}>
                  <img src={n.actor?.avatar_url || '/images/default-avatar.png'} style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#333' }}><span style={{ fontWeight: 'bold' }}>{n.actor?.full_name}</span> {n.content}</p>
                    <span style={{ fontSize: '11px', color: '#999' }}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}