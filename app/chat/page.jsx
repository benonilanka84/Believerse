"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

function ChatContent() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({}); 
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  const searchParams = useSearchParams();
  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    initialize();
    
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  async function initialize() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      await loadRecentChats(data.user.id);
      
      const targetId = searchParams.get('uid');
      if (targetId) loadChatWithUser(targetId, data.user.id);
    }
  }

  // --- REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}` 
        },
        (payload) => {
          const incomingMsg = payload.new;
          
          if (incomingMsg.sender_id === activeChatRef.current) {
            setMessages((prev) => [...prev, incomingMsg]);
            // Mark as read immediately if chat is open
            supabase.from('messages').update({ is_read: true }).eq('id', incomingMsg.id);
            setTimeout(scrollToBottom, 100);
          } else {
            // Update the red dot indicator for the specific sender ONLY
            setUnreadCounts(prev => ({
              ...prev,
              [incomingMsg.sender_id]: (prev[incomingMsg.sender_id] || 0) + 1
            }));
            showNotification(incomingMsg);
            loadRecentChats(user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  function showNotification(msg) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("The Believerse", {
        body: `New message received!`,
        icon: "/images/final-logo.png"
      });
      const audio = new Audio('/sounds/notification.mp3'); 
      audio.play().catch(() => {});
    }
  }

  async function loadRecentChats(myId) {
    const { data } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, created_at, is_read')
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .order('created_at', { ascending: false });
      
    if (!data) return;

    const uniqueIds = new Set();
    const newUnread = {};

    data.forEach(m => {
      // Add everyone we've talked to to the sidebar
      if (m.sender_id !== myId) uniqueIds.add(m.sender_id);
      if (m.receiver_id !== myId) uniqueIds.add(m.receiver_id);

      // RED DOT LOGIC FIX: Only count if I am the receiver AND it is unread
      if (m.receiver_id === myId && m.is_read === false) {
        newUnread[m.sender_id] = (newUnread[m.sender_id] || 0) + 1;
      }
    });

    setUnreadCounts(newUnread);

    if (uniqueIds.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(uniqueIds));
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

    // Clear the unread dot locally and in database for THIS user
    setUnreadCounts(prev => ({ ...prev, [partnerId]: 0 }));
    await supabase.from('messages').update({ is_read: true }).match({ sender_id: partnerId, receiver_id: myId, is_read: false });

    // Fetch messages
    const { data } = await supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true });

    const clearTimestamp = localStorage.getItem(`chat_cleared_${myId}_${partnerId}`);
    if (clearTimestamp) {
      const filtered = data.filter(m => new Date(m.created_at) > new Date(clearTimestamp));
      setMessages(filtered);
    } else {
      setMessages(data || []);
    }
    
    setTimeout(scrollToBottom, 100);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const msgContent = newMessage;
    setNewMessage(""); 

    const { data, error } = await supabase.from('messages').insert({
      sender_id: user.id, 
      receiver_id: activeChat, 
      content: msgContent,
      is_read: false // Default to unread for the recipient
    }).select().single();

    if (!error && data) {
      setMessages(prev => [...prev, data]);
      setTimeout(scrollToBottom, 100);
    }
  }

  function clearHistory() {
    if (!confirm("Wipe chat history locally? This won't delete messages from the database.")) return;
    const now = new Date().toISOString();
    localStorage.setItem(`chat_cleared_${user.id}_${activeChat}`, now);
    setMessages([]);
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
          <div key={c.id} onClick={() => loadChatWithUser(c.id, user.id)} style={{ padding: '15px', cursor: 'pointer', background: activeChat === c.id ? '#e8f5e9' : 'transparent', borderBottom: '1px solid #f0f0f0', display:'flex', alignItems:'center', gap:'10px', position: 'relative' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ccc', overflow:'hidden' }}>
               <img src={c.avatar_url || '/images/default-avatar.png'} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
            </div>
            <div style={{fontWeight:'bold', fontSize:'14px', color:'#000', flex: 1}}>{c.full_name}</div>
            
            {/* RED DOT INDICATOR - Only shows for actual unread messages */}
            {unreadCounts[c.id] > 0 && (
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#e74c3c', marginRight: '5px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {activeChat ? (
          <>
            <div style={{padding:'15px', borderBottom:'1px solid #eee', fontWeight:'bold', background:'#fff', color:'#0b2e4a', display:'flex', alignItems:'center', justifyContent: 'space-between'}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <img src={activeChatUser?.avatar_url || '/images/default-avatar.png'} style={{width:30, height:30, borderRadius:'50%'}} />
                {activeChatUser?.full_name}
              </div>
              <button onClick={clearHistory} style={{ background: 'none', border: '1px solid #ddd', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', color: '#666' }}>
                Clear History
              </button>
            </div>
            
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#fff' }}>
              {messages.map(m => {
                const isMe = m.sender_id === user.id;
                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: '15px' }}>
                    <div style={{ maxWidth: '70%', padding: '10px 15px', borderRadius: '12px', background: isMe ? '#2e8b57' : '#f0f0f0', color: isMe ? 'white' : '#333', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                      {m.content}
                    </div>
                    <span style={{ fontSize: '10px', color: '#999', marginTop: '4px', padding: '0 5px' }}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
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

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{padding:50, textAlign:'center'}}>Loading Messenger...</div>}>
      <ChatContent />
    </Suspense>
  );
}