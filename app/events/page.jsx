"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function EventsPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Event Data
  const [allEvents, setAllEvents] = useState([]);
  const [viewMode, setViewMode] = useState("all"); // 'all' or 'my'
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Create Event State
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
    }
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    
    if (data) setAllEvents(data);
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!user) return;

    // 1. Insert Event into DB
    const { data: eventData, error } = await supabase.from('events').insert({
      user_id: user.id,
      title: newEvent.title,
      description: newEvent.description,
      event_date: newEvent.date,
      event_time: newEvent.time,
      location: newEvent.isOnline ? "Online" : newEvent.location,
      is_online: newEvent.isOnline,
      meeting_link: newEvent.meetingLink
    }).select().single();

    if (error) {
      alert("Error creating event: " + error.message);
      return;
    }

    // 2. Auto-Share to The Walk (Feed) so friends see it
    const postContent = `📅 New Event: ${newEvent.title}\n\n${newEvent.description}\n\nJoin us on ${newEvent.date} at ${newEvent.time}!`;
    await supabase.from('posts').insert({
      user_id: user.id,
      content: postContent,
      type: "Event",
      title: "📅 Upcoming Event"
    });

    alert("✅ Event Created & Shared to The Walk!");
    setShowCreateForm(false);
    loadEvents(); // Refresh list
  }

  // Filter Logic
  const visibleEvents = viewMode === "my" 
    ? allEvents.filter(e => e.user_id === user?.id)
    : allEvents;

  const eventsOnSelectedDate = visibleEvents.filter(e => e.event_date === selectedDate.toISOString().split('T')[0]);

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

            <button type="submit" style={{ padding: "12px", background: "#2e8b57", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Publish & Share</button>
          </form>
        </div>
      )}

      {/* Events List */}
      <div>
        <h3 style={{ color: "#0b2e4a", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>
          {viewMode === 'my' ? 'My Events' : 'Upcoming Events'}
        </h3>
        
        {visibleEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#999", background: "white", borderRadius: "12px" }}>
            No events found.
          </div>
        ) : (
          visibleEvents.map(event => (
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
                <button onClick={() => {
                   if(navigator.share) navigator.share({title: event.title, text: event.description});
                   else alert("Link copied!");
                }} style={{ padding: "6px 12px", background: "#e8f5e9", color: "#2e8b57", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize:'13px' }}>
                  📢 Spread
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}