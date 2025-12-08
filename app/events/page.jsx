"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function EventsPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Create Event State
  const [newEvent, setNewEvent] = useState({
    title: "", description: "", date: "", time: "", location: "",
    type: "Fellowship", isOnline: false, meetingLink: ""
  });

  const eventTypes = [
    { value: "Fellowship", icon: "👥", color: "#2e8b57" },
    { value: "Prayer", icon: "🙏", color: "#8b5cf6" },
    { value: "Bible Study", icon: "📖", color: "#2d6be3" },
    { value: "Worship", icon: "🎵", color: "#d4af37" },
    { value: "Outreach", icon: "🤝", color: "#ff6b6b" }
  ];

  useEffect(() => {
    setMounted(true);
    // Load Dummy Events for Demo
    const today = new Date().toISOString().split('T')[0];
    const dummy = [
      { id: 1, title: "Morning Prayer", date: today, time: "06:00", type: "Prayer", isOnline: true },
      { id: 2, title: "Youth Meet", date: "2025-12-25", time: "17:00", type: "Fellowship", location: "City Church" }
    ];
    setEvents(dummy);
    filterEventsByDate(new Date(), dummy);
  }, []);

  function filterEventsByDate(date, allEvents) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const filtered = allEvents.filter(e => e.date === dateStr);
    setFilteredEvents(filtered);
  }

  function handleDateClick(day) {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    setSelectedDate(newDate);
    filterEventsByDate(newDate, events);
  }

  function handleCreateEvent(e) {
    e.preventDefault();
    const created = { ...newEvent, id: Date.now(), attendees: 0 };
    const updatedEvents = [...events, created];
    setEvents(updatedEvents);
    filterEventsByDate(selectedDate, updatedEvents);
    setShowCreateForm(false);
    alert("✅ Event Created!");
  }

  if (!mounted) return null;

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "30px", borderRadius: "16px", color: "white", marginBottom: "30px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
        <h1 style={{ margin: 0, fontSize: "2.2rem" }}>📅 Events</h1>
        <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>Join gatherings or create your own</p>
      </div>

      <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ width: "100%", padding: "15px", background: "#f0fff4", color: "#2e8b57", border: "2px dashed #2e8b57", borderRadius: "12px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginBottom: "20px" }}>
        {showCreateForm ? "Cancel Creation" : "➕ Create New Event"}
      </button>

      {/* CREATE FORM */}
      {showCreateForm && (
        <div style={{ background: "white", padding: "25px", borderRadius: "12px", marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <form onSubmit={handleCreateEvent} style={{ display: "grid", gap: "15px" }}>
            <input type="text" placeholder="Event Title" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
              <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
            </div>

            <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}>
              {eventTypes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.value}</option>)}
            </select>

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

      {/* CALENDAR & LIST LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "20px" }}>
        
        {/* Left: Calendar */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", height: "fit-content", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold", color: "#0b2e4a" }}>
            {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
            {["S","M","T","W","T","F","S"].map(d => <div key={d} style={{ fontSize: "12px", textAlign: "center", color: "#888" }}>{d}</div>)}
            
            {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateCheck = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
              // Adjust for timezone to match string comparison
              const year = dateCheck.getFullYear();
              const month = String(dateCheck.getMonth() + 1).padStart(2, '0');
              const d = String(dateCheck.getDate()).padStart(2, '0');
              const checkDate = `${year}-${month}-${d}`;
              
              const hasEvent = events.some(e => e.date === checkDate);
              const isSelected = day === selectedDate.getDate();

              return (
                <div key={day} onClick={() => handleDateClick(day)}
                  style={{ 
                    textAlign: "center", padding: "8px", borderRadius: "8px", cursor: "pointer", fontSize: "14px",
                    background: isSelected ? "#2e8b57" : (hasEvent ? "#e8f5e9" : "transparent"),
                    color: isSelected ? "white" : (hasEvent ? "#2e8b57" : "#333"),
                    fontWeight: isSelected || hasEvent ? "bold" : "normal"
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: List */}
        <div>
          <h3 style={{ marginTop: 0, color: "#0b2e4a", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>
            Events for {selectedDate.toDateString()}
          </h3>
          
          {filteredEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#999", background: "white", borderRadius: "12px" }}>
              No events scheduled for this day.
            </div>
          ) : (
            filteredEvents.map(event => (
              <div key={event.id} style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "15px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderLeft: "4px solid #2e8b57" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <h3 style={{ margin: "0 0 5px 0", color: "#0b2e4a" }}>{event.title}</h3>
                  <span style={{ fontSize: "12px", background: "#f0f0f0", padding: "4px 8px", borderRadius: "4px" }}>{event.type}</span>
                </div>
                <div style={{ color: "#666", fontSize: "14px", marginBottom: "10px" }}>
                  🕒 {event.time} • {event.isOnline ? "🌐 Online" : `📍 ${event.location}`}
                </div>
                {event.isOnline && event.meetingLink && (
                  <a href={event.meetingLink} target="_blank" style={{ color: "#2d6be3", fontWeight: "bold", fontSize: "14px" }}>Join Meeting →</a>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

function getDaysInMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return { 
    daysInMonth: new Date(year, month + 1, 0).getDate(), 
    startingDayOfWeek: new Date(year, month, 1).getDay() 
  };
}