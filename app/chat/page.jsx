"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

export default function ChatPage() {
  // ... (keep existing state and logic: mounted, user, chats, activeChat, messages, etc.) ...
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const searchParams = useSearchParams();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, []);

  async function initialize() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      await loadRecentChats(data.user.id);
      
      const targetId = searchParams.get('uid');
      if (targetId) loadChatWithUser(targetId, data.user.id);
    }
  }

  async function loadRecentChats(myId) {
    const { data } = await supabase.from('messages').select('sender_id, receiver_id').or(`sender_id.eq.${myId},receiver_id.eq.${myId}`);
    if (!data) return;

    const uniqueIds = new Set();
    data.forEach(m => {
      if (m.sender_id !== myId) uniqueIds.add(m.sender_id);
      if (m.receiver_id !== myId) uniqueIds.add(m.receiver_id);
    });

    if (uniqueIds.size > 0) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', Array.from(uniqueIds));
      setChats(profiles || []);
    }
  }

  async function loadChatWithUser(partnerId, myId) {
    if (!myId && user) myId = user.id;
    if (!myId) return;

    let partnerProfile = chats.find(c => c.id === partnerId);
    if (!partnerProfile) {
        const { data } = await supabase.from('profiles').select('*').eq('id', partnerId).single();
        if (data) {
            partnerProfile = data;
            setChats(prev => {
                if (prev.find(p => p.id === data.id)) return prev;
                return [data, ...prev];
            });
        }
    }
    
    setActiveChat(partnerId);
    setActiveChatUser(partnerProfile);

    const { data } = await supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true });
      
    setMessages(data || []);
    scrollToBottom();
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id, receiver_id: activeChat, content: newMessage
    });

    if (!error) {
      setNewMessage("");
      loadChatWithUser(activeChat, user.id);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  if (!mounted) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: 'calc(100vh - 80px)', maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ddd' }}>
      
      {/* Sidebar */}
      <div style={{ borderRight: '1px solid #eee', background: '#f9f9f9', overflowY:'auto' }}>
        <div style={{ padding: '20px', fontWeight: 'bold', color: '#0b2e4a', borderBottom:'1px solid #eee' }}>💬 Messages</div>
        {chats.map(c => (
          <div key={c.id} onClick={() => loadChatWithUser(c.id, user.id)} style={{ padding: '15px', cursor: 'pointer', background: activeChat === c.id ? '#e8f5e9' : 'transparent', borderBottom: '1px solid #f0f0f0', display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ccc', overflow:'hidden' }}>
               {c.avatar_url ? <img src={c.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : null}
            </div>
            {/* FIXED COLOR HERE */}
            <div style={{fontWeight:'bold', fontSize:'14px', color:'#000'}}>{c.full_name}</div>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {activeChat ? (
          <>
            <div style={{padding:'15px', borderBottom:'1px solid #eee', fontWeight:'bold', background:'#fff', color:'#0b2e4a'}}>
              {activeChatUser?.full_name || "Chat"}
            </div>
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#fff' }}>
              {messages.map(m => {
                const isMe = m.sender_id === user.id;
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                    <div style={{ maxWidth: '70%', padding: '10px 15px', borderRadius: '12px', background: isMe ? '#2e8b57' : '#f0f0f0', color: isMe ? 'white' : '#333' }}>
                      {m.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} style={{ padding: '15px', background: '#f9f9f9', display: 'flex', gap: '10px', borderTop:'1px solid #eee' }}>
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline:'none', color:'#333' }} />
              <button type="submit" style={{ padding: '0 20px', background: '#2e8b57', color: 'white', borderRadius: '8px', border: 'none', fontWeight:'bold', cursor:'pointer' }}>Send</button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>Select a believer to chat</div>
        )}
      </div>
    </div>
  );
}