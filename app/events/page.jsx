"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function EventsPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Data
  const [allEvents, setAllEvents] = useState([]);
  const [myConnections, setMyConnections] = useState([]); // For Invite list
  const [viewMode, setViewMode] = useState("all"); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedEventForInvite, setSelectedEventForInvite] = useState(null);

  // Create Form State
  const [newEvent, setNewEvent] = useState({
    title: "", description: "", date: "", time: "", location: "",
    type: "Fellowship", isOnline: false, meetingLink: ""
  });

  const eventTypes = [
    { value: "Fellowship", icon: "👥" }, { value: "Prayer", icon: "🙏" },
    { value: "Bible Study", icon: "📖" }, { value: "Worship", icon: "🎵" },
    { value: "Outreach", icon: "🤝" }
  ];

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      loadEvents();
      loadConnections(data.user.id);
    }
  }

  async function loadEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    if (data) setAllEvents(data);
  }

  async function loadConnections(userId) {
    // Fetch people I am connected with to invite them
    const { data } = await supabase
      .from('connections')
      .select('user_b, profiles:user_b(*)') // Assuming I am user_a
      .eq('user_a', userId)
      .eq('status', 'connected'); // Only show accepted friends if you have that status, else remove .eq('status')
    
    // Also fetch where I am user_b
    const { data: data2 } = await supabase
      .from('connections')
      .select('user_a, profiles:user_a(*)')
      .eq('user_b', userId)
      .eq('status', 'connected');

    const friends = [];
    if (data) data.forEach(d => friends.push(d.profiles));
    if (data2) data2.forEach(d => friends.push(d.profiles));
    
    // Remove duplicates and nulls
    const uniqueFriends = friends.filter((v,i,a)=>a.findIndex(v2=>(v2?.id===v?.id))===i && v);
    setMyConnections(uniqueFriends);
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!user) return;

    // 1. Create Event
    const { error } = await supabase.from('events').insert({
      user_id: user.id,
      title: newEvent.title,
      description: newEvent.description,
      event_date: newEvent.date,
      event_time: newEvent.time,
      location: newEvent.isOnline ? "Online" : newEvent.location,
      is_online: newEvent.isOnline,
      meeting_link: newEvent.meetingLink
    });

    if (error) {
      alert("Error: " + error.message);
      return;
    }

    alert("✅ Event Created!");
    setShowCreateForm(false);
    loadEvents();
  }

  async function sendInvite(friendId) {
    if (!selectedEventForInvite) return;

    // 1. Record Invite
    await supabase.from('event_invites').insert({
      event_id: selectedEventForInvite.id,
      sender_id: user.id,
      receiver_id: friendId
    });

    // 2. Send Chat Message (So they see it properly)
    const msg = `📅 I invited you to: ${selectedEventForInvite.title}\n${selectedEventForInvite.event_date} @ ${selectedEventForInvite.event_time}`;
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: friendId,
      content: msg
    });

    alert("Invite sent!");
  }

  // Filter Logic
  const visibleEvents = viewMode === "my" 
    ? allEvents.filter(e => e.user_id === user?.id)
    : allEvents;

  if (!mounted) return null;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "30px", borderRadius: "16px", color: "white", marginBottom: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
        <h1 style={{ margin: 0, fontSize: "2.2rem" }}>📅 Events</h1>
        <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>Join gatherings or create your own</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setViewMode("all")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: viewMode === "all" ? "#0b2e4a" : "white", color: viewMode === "all" ? "white" : "#333", fontWeight: "bold", cursor: "pointer" }}>
          🌐 All Events
        </button>
        <button onClick={() => setViewMode("my")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: viewMode === "my" ? "#0b2e4a" : "white", color: viewMode === "my" ? "white" : "#333", fontWeight: "bold", cursor: "pointer" }}>
          👤 My Events
        </button>
      </div>

      <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ width: "100%", padding: "15px", background: "#f0fff4", color: "#2e8b57", border: "2px dashed #2e8b57", borderRadius: "12px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginBottom: "20px" }}>
        {showCreateForm ? "Cancel Creation" : "➕ Create New Event"}
      </button>

      {/* Create Form */}
      {showCreateForm && (
        <div style={{ background: "white", padding: "25px", borderRadius: "12px", marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <form onSubmit={handleCreateEvent} style={{ display: "grid", gap: "15px" }}>
            <input type="text" placeholder="Event Title" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
            <textarea placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
              <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input type="checkbox" checked={newEvent.isOnline} onChange={e => setNewEvent({...newEvent, isOnline: e.target.checked})} />
              <label style={{color:"#333"}}>This is an Online Event</label>
            </div>

            {newEvent.isOnline ? (
              <input type="text" placeholder="Meeting Link (Zoom/Meet)" value={newEvent.meetingLink} onChange={e => setNewEvent({...newEvent, meetingLink: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
            ) : (
              <input type="text" placeholder="Location Address" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
            )}

            <button type="submit" style={{ padding: "12px", background: "#2e8b57", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Publish Event</button>
          </form>
        </div>
      )}

      {/* Events List */}
      <div>
        {visibleEvents.map(event => (
          <div key={event.id} style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "15px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderLeft: "4px solid #2e8b57" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: "0 0 5px 0", color: "#0b2e4a" }}>{event.title}</h3>
              <span style={{ fontSize: "12px", background: "#f0f0f0", padding: "4px 8px", borderRadius: "4px" }}>{event.event_date}</span>
            </div>
            <p style={{color:'#555', margin:'5px 0 10px 0'}}>{event.description}</p>
            <div style={{ color: "#666", fontSize: "14px", marginBottom: "10px" }}>
              🕒 {event.event_time} • {event.is_online ? "🌐 Online" : `📍 ${event.location}`}
            </div>
            
            <div style={{display:'flex', gap:'10px'}}>
              {/* Invite Believers Button */}
              {user && (
                <button 
                  onClick={() => { setSelectedEventForInvite(event); setInviteModalOpen(true); }}
                  style={{ padding: "6px 12px", background: "#0b2e4a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize:'13px' }}
                >
                  📩 Invite Believers
                </button>
              )}
              {event.is_online && event.meeting_link && (
                <a href={event.meeting_link} target="_blank" style={{ padding: "6px 12px", background: "#e8f5e9", color: "#2e8b57", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize:'13px', textDecoration:'none' }}>
                  Join Link
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0 }}>Invite to {selectedEventForInvite?.title}</h3>
            <p style={{ fontSize: '13px', color: '#666' }}>Select a believer to invite:</p>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' }}>
              {myConnections.length === 0 ? (
                <p>You have no connected believers yet.</p>
              ) : (
                myConnections.map(friend => (
                  <div key={friend.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee', alignItems:'center' }}>
                    <span>{friend.full_name}</span>
                    <button onClick={() => sendInvite(friend.id)} style={{ padding: '4px 8px', background: '#2e8b57', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Send</button>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setInviteModalOpen(false)} style={{ width: '100%', padding: '10px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}