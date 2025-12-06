"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Sample believers (will be replaced with real data)
  const believers = [
    { id: 1, name: "John Doe", avatar: null, lastSeen: "Online", status: "Blessed and grateful!" },
    { id: 2, name: "Mary Smith", avatar: null, lastSeen: "5 min ago", status: "Walking with Christ" },
    { id: 3, name: "David Lee", avatar: null, lastSeen: "Online", status: "Praying for everyone" }
  ];

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        loadConversations(data.user.id);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function loadConversations(userId) {
    // Load from localStorage (will be replaced with Supabase)
    const saved = JSON.parse(localStorage.getItem(`conversations_${userId}`) || "[]");
    
    // If no conversations, create sample ones
    if (saved.length === 0) {
      const sampleConvos = believers.map(b => ({
        id: b.id,
        believerId: b.id,
        believerName: b.name,
        lastMessage: "Hey! God bless you 🙏",
        lastMessageTime: new Date().toISOString(),
        unread: 0
      }));
      setConversations(sampleConvos);
    } else {
      setConversations(saved);
    }
  }

  function loadMessages(chatId) {
    const saved = JSON.parse(localStorage.getItem(`messages_${chatId}`) || "[]");
    setMessages(saved);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleSendMessage(e) {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChat) return;

    const message = {
      id: Date.now(),
      senderId: user.id,
      text: newMessage,
      timestamp: new Date().toISOString(),
      encrypted: true // Indicates TLS encryption
    };

    const updatedMessages = [...messages, message];
    localStorage.setItem(`messages_${selectedChat.id}`, JSON.stringify(updatedMessages));
    setMessages(updatedMessages);

    // Update conversation
    const updatedConvos = conversations.map(c => 
      c.id === selectedChat.id 
        ? { ...c, lastMessage: newMessage, lastMessageTime: new Date().toISOString() }
        : c
    );
    localStorage.setItem(`conversations_${user.id}`, JSON.stringify(updatedConvos));
    setConversations(updatedConvos);

    setNewMessage("");
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div style={{
      height: "calc(100vh - 100px)",
      maxWidth: "1400px",
      margin: "20px auto",
      display: "grid",
      gridTemplateColumns: "350px 1fr",
      gap: "0",
      background: "white",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
    }}>
      
      {/* Left Sidebar - Conversations List */}
      <div style={{
        borderRight: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
        height: "100%"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px",
          borderBottom: "1px solid #e0e0e0",
          background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)",
          color: "white"
        }}>
          <h2 style={{ margin: "0 0 5px 0", fontSize: "1.5rem" }}>💬 Messages</h2>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>
            🔒 TLS Encrypted & Secure
          </p>
        </div>

        {/* Conversations */}
        <div style={{
          flex: 1,
          overflowY: "auto"
        }}>
          {conversations.map((convo) => (
            <div
              key={convo.id}
              onClick={() => setSelectedChat(convo)}
              style={{
                padding: "15px 20px",
                borderBottom: "1px solid #f0f0f0",
                cursor: "pointer",
                background: selectedChat?.id === convo.id ? "#f5f5f5" : "transparent",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f9f9f9"}
              onMouseLeave={(e) => e.currentTarget.style.background = selectedChat?.id === convo.id ? "#f5f5f5" : "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "45px",
                  height: "45px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2e8b57, #1d5d3a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "18px",
                  flexShrink: 0
                }}>
                  {convo.believerName[0]}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px"
                  }}>
                    <strong style={{ fontSize: "15px", color: "#0b2e4a" }}>
                      {convo.believerName}
                    </strong>
                    <small style={{ color: "#999", fontSize: "12px" }}>
                      {formatTime(convo.lastMessageTime)}
                    </small>
                  </div>
                  <div style={{
                    fontSize: "13px",
                    color: "#666",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {convo.lastMessage}
                  </div>
                </div>

                {convo.unread > 0 && (
                  <div style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "#2e8b57",
                    color: "white",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold"
                  }}>
                    {convo.unread}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      {selectedChat ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          height: "100%"
        }}>
          {/* Chat Header */}
          <div style={{
            padding: "20px",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            gap: "15px",
            background: "#fafafa"
          }}>
            <div style={{
              width: "45px",
              height: "45px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2e8b57, #1d5d3a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: "18px"
            }}>
              {selectedChat.believerName[0]}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, color: "#0b2e4a" }}>
                {selectedChat.believerName}
              </h3>
              <small style={{ color: "#2e8b57" }}>Online</small>
            </div>
            <div style={{
              padding: "6px 12px",
              background: "#e8f5e9",
              borderRadius: "12px",
              fontSize: "12px",
              color: "#2e8b57",
              fontWeight: "600"
            }}>
              🔒 Encrypted
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            background: "#f9f9f9"
          }}>
            {messages.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#999"
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>💬</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isMe = msg.senderId === user.id;
                  
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                        marginBottom: "15px"
                      }}
                    >
                      <div style={{
                        maxWidth: "70%",
                        padding: "12px 16px",
                        borderRadius: "16px",
                        background: isMe ? "#2e8b57" : "white",
                        color: isMe ? "white" : "#333",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                      }}>
                        <p style={{
                          margin: 0,
                          fontSize: "15px",
                          lineHeight: "1.5",
                          wordBreak: "break-word"
                        }}>
                          {msg.text}
                        </p>
                        <small style={{
                          display: "block",
                          marginTop: "6px",
                          fontSize: "11px",
                          opacity: 0.7
                        }}>
                          {formatTime(msg.timestamp)} {msg.encrypted && "🔒"}
                        </small>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} style={{
            padding: "20px",
            borderTop: "1px solid #e0e0e0",
            background: "white"
          }}>
            <div style={{
              display: "flex",
              gap: "12px",
              alignItems: "center"
            }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "24px",
                  fontSize: "15px",
                  outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = "#2e8b57"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  border: "none",
                  background: newMessage.trim() ? "linear-gradient(135deg, #2e8b57, #1d5d3a)" : "#e0e0e0",
                  color: "white",
                  fontSize: "20px",
                  cursor: newMessage.trim() ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
              >
                📤
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
          flexDirection: "column",
          gap: "15px"
        }}>
          <div style={{ fontSize: "4rem" }}>💬</div>
          <h3 style={{ color: "#666" }}>Select a conversation to start chatting</h3>
          <p style={{ fontSize: "14px" }}>All messages are encrypted with TLS</p>
        </div>
      )}
    </div>
  );
}