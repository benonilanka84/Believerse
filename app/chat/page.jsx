"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]); // List of people
  const [activeChat, setActiveChat] = useState(null); // Current person ID
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
      loadRecentChats(data.user.id);
      
      // If URL has ?uid=XYZ, open that chat immediately
      const targetId = searchParams.get('uid');
      if (targetId) loadChatWithUser(targetId);
    }
  }

  // Load sidebar: people you've talked to
  async function loadRecentChats(myId) {
    // Determine unique users from messages table
    const { data } = await supabase
      .from('messages')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`);
    
    if (!data) return;

    const uniqueIds = new Set();
    data.forEach(m => {
      if (m.sender_id !== myId) uniqueIds.add(m.sender_id);
      if (m.receiver_id !== myId) uniqueIds.add(m.receiver_id);
    });

    if (uniqueIds.size === 0) return;

    // Fetch details for these users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', Array.from(uniqueIds));
      
    setChats(profiles || []);
  }

  async function loadChatWithUser(partnerId) {
    // 1. Set Active UI
    if (!chats.find(c => c.id === partnerId)) {
        // If not in sidebar, fetch details and add temporarily
        const { data } = await supabase.from('profiles').select('*').eq('id', partnerId).single();
        if(data) setChats(prev => [data, ...prev]);
    }
    setActiveChat(partnerId);

    // 2. Fetch Messages
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
      
    setMessages(data || []);
    scrollToBottom();
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: activeChat,
      content: newMessage
    });

    if (!error) {
      setNewMessage("");
      loadChatWithUser(activeChat); // Reload to show new message
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  if (!mounted) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: 'calc(100vh - 80px)', maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ddd' }}>
      
      {/* Sidebar */}
      <div style={{ borderRight: '1px solid #eee', background: '#f9f9f9' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#0b2e4a' }}>💬 Messages</div>
        <div>
          {chats.map(c => (
            <div key={c.id} onClick={() => loadChatWithUser(c.id)} style={{ padding: '15px', cursor: 'pointer', background: activeChat === c.id ? '#e8f5e9' : 'transparent', borderBottom: '1px solid #f0f0f0', display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ccc', overflow:'hidden' }}>
                 {c.avatar_url ? <img src={c.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : null}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{c.full_name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>@{c.username}</div>
              </div>
            </div>
          ))}
          {chats.length === 0 && <div style={{padding:'20px', color:'#999', fontSize:'13px'}}>No conversations yet. Find a believer to chat!</div>}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {activeChat ? (
          <>
            {/* Messages */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#fff' }}>
              {messages.map(m => {
                const isMe = m.sender_id === user.id;
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                    <div style={{ 
                      maxWidth: '70%', padding: '10px 15px', borderRadius: '12px', fontSize: '14px', lineHeight:'1.4',
                      background: isMe ? '#2e8b57' : '#f0f0f0', 
                      color: isMe ? 'white' : '#333',
                      borderBottomRightRadius: isMe ? '2px' : '12px',
                      borderBottomLeftRadius: isMe ? '12px' : '2px'
                    }}>
                      {m.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', background: '#f9f9f9' }}>
              <input 
                type="text" 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                placeholder="Type a message..." 
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }} 
              />
              <button type="submit" style={{ padding: '0 20px', background: '#2e8b57', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
            Select a believer to start chatting
          </div>
        )}
      </div>
    </div>
  );
}