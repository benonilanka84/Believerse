"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function EventsPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Data
  const [allEvents, setAllEvents] = useState([]);
  const [myConnections, setMyConnections] = useState([]); 
  const [viewMode, setViewMode] = useState("all"); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedEventForInvite, setSelectedEventForInvite] = useState(null);

  // Create Form
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

  // FIXED: Two-Step Connection Loader (More Reliable)
  async function loadConnections(userId) {
    // 1. Get all connection rows where I am involved
    const { data: conns } = await supabase
      .from('connections')
      .select('*')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .eq('status', 'connected');

    if (!conns || conns.length === 0) {
      setMyConnections([]);
      return;
    }

    // 2. Extract the OTHER person's ID
    const friendIds = conns.map(c => c.user_a === userId ? c.user_b : c.user_a);

    // 3. Fetch their profiles
    const { data: friends } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds);

    setMyConnections(friends || []);
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!user) return;

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

    await supabase.from('event_invites').insert({
      event_id: selectedEventForInvite.id,
      sender_id: user.id,
      receiver_id: friendId
    });

    alert("Invite sent!");
    setInviteModalOpen(false);
  }

  const visibleEvents = viewMode === "my" 
    ? allEvents.filter(e => e.user_id === user?.id)
    : allEvents;

  // Filter events for the selected date
  const eventsOnDate = visibleEvents.filter(e => e.event_date === selectedDate.toISOString().split('T')[0]);

  if (!mounted) return null;

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "30px", borderRadius: "16px", color: "white", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>📅 Events</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setViewMode("all")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: viewMode === "all" ? "#0b2e4a" : "white", color: viewMode === "all" ? "white" : "#333", fontWeight: "bold" }}>
          🌐 All Events
        </button>
        <button onClick={() => setViewMode("my")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: viewMode === "my" ? "#0b2e4a" : "white", color: viewMode === "my" ? "white" : "#333", fontWeight: "bold" }}>
          👤 My Events
        </button>
      </div>

      <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ width: "100%", padding: "15px", background: "#f0fff4", color: "#2e8b57", border: "2px dashed #2e8b57", borderRadius: "12px", fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>
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
              <label style={{color:"#333"}}>Online Event</label>
            </div>
            {newEvent.isOnline ? (
              <input type="text" placeholder="Meeting Link" value={newEvent.meetingLink} onChange={e => setNewEvent({...newEvent, meetingLink: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
            ) : (
              <input type="text" placeholder="Location" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
            )}
            <button type="submit" style={{ padding: "12px", background: "#2e8b57", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>Publish Event</button>
          </form>
        </div>
      )}

      {/* Calendar & List */}
      <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "20px" }}>
        
        {/* Calendar */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", height: "fit-content" }}>
          <div style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold", color: "#0b2e4a" }}>
            {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
            {["S","M","T","W","T","F","S"].map(d => <div key={d} style={{ fontSize: "12px", textAlign: "center", color: "#888" }}>{d}</div>)}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateCheck = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
              const year = dateCheck.getFullYear();
              const month = String(dateCheck.getMonth() + 1).padStart(2, '0');
              const d = String(dateCheck.getDate()).padStart(2, '0');
              const checkDate = `${year}-${month}-${d}`;
              const hasEvent = visibleEvents.some(e => e.event_date === checkDate);
              const isSelected = day === selectedDate.getDate();

              return (
                <div key={day} onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                  style={{ 
                    textAlign: "center", padding: "8px", borderRadius: "8px", cursor: "pointer", fontSize: "14px",
                    background: isSelected ? "#2e8b57" : (hasEvent ? "#e8f5e9" : "transparent"),
                    // FIXED: Force text color to dark grey if not selected, White if selected
                    color: isSelected ? "white" : "#333",
                    fontWeight: isSelected || hasEvent ? "bold" : "normal"
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div>
          <h3 style={{ marginTop: 0, color: "#0b2e4a", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>
            Events for {selectedDate.toDateString()}
          </h3>
          
          {eventsOnDate.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#999", background: "white", borderRadius: "12px" }}>No events.</div>
          ) : (
            eventsOnDate.map(event => (
              <div key={event.id} style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "15px", borderLeft: "4px solid #2e8b57" }}>
                <h3 style={{ margin: "0 0 5px 0", color: "#0b2e4a" }}>{event.title}</h3>
                <p style={{color:'#555', margin:'5px 0'}}>{event.description}</p>
                <div style={{ color: "#666", fontSize: "14px", marginBottom: "10px" }}>
                  🕒 {event.event_time} • {event.is_online ? "🌐 Online" : `📍 ${event.location}`}
                </div>
                {/* Invite Button */}
                <button 
                  onClick={() => { setSelectedEventForInvite(event); setInviteModalOpen(true); }}
                  style={{ padding: "6px 12px", background: "#0b2e4a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize:'13px' }}
                >
                  📩 Invite Believers
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0 }}>Invite Believers</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' }}>
              {myConnections.length === 0 ? <p>No connections found.</p> : myConnections.map(friend => (
                <div key={friend.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                  <span>{friend.full_name}</span>
                  <button onClick={() => sendInvite(friend.id)} style={{ padding: '4px 8px', background: '#2e8b57', color: 'white', borderRadius: '4px', border: 'none' }}>Send</button>
                </div>
              ))}
            </div>
            <button onClick={() => setInviteModalOpen(false)} style={{ width: '100%', padding: '10px', background: '#f0f0f0', border: 'none', borderRadius: '8px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function getDaysInMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return { daysInMonth: new Date(year, month + 1, 0).getDate(), startingDayOfWeek: new Date(year, month, 1).getDay() };
}