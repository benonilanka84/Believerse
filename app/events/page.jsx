"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function EventsPage() {
  const [user, setUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    type: "Fellowship",
    isOnline: false,
    meetingLink: ""
  });

  const eventTypes = [
    { value: "Fellowship", icon: "👥", color: "#2e8b57" },
    { value: "Prayer Meeting", icon: "🙏", color: "#8b5cf6" },
    { value: "Bible Study", icon: "📖", color: "#2d6be3" },
    { value: "Worship Service", icon: "🎵", color: "#d4af37" },
    { value: "Youth Event", icon: "🎉", color: "#ff6b6b" },
    { value: "Community Outreach", icon: "🤝", color: "#4ecdc4" },
    { value: "Conference", icon: "🎤", color: "#ff9800" },
    { value: "Other", icon: "📅", color: "#666" }
  ];

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        loadEvents();
      }
    }
    loadUser();
  }, []);

  function loadEvents() {
    const saved = JSON.parse(localStorage.getItem("events") || "[]");
    setEvents(saved);
  }

  function handleCreateEvent(e) {
    e.preventDefault();
    
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      alert("Please fill in all required fields");
      return;
    }

    const event = {
      id: Date.now(),
      userId: user.id,
      userName: user.email.split('@')[0],
      ...newEvent,
      createdAt: new Date().toISOString(),
      attendees: [user.id],
      attendeeCount: 1
    };

    const allEvents = [...events, event];
    localStorage.setItem("events", JSON.stringify(allEvents));
    setEvents(allEvents);
    
    setNewEvent({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      type: "Fellowship",
      isOnline: false,
      meetingLink: ""
    });
    setShowCreateForm(false);
    alert("✅ Event created successfully!");
  }

  function handleRSVP(eventId) {
    if (!user) return;

    const updated = events.map(e => {
      if (e.id === eventId) {
        const isAttending = e.attendees?.includes(user.id);
        
        if (isAttending) {
          return {
            ...e,
            attendees: e.attendees.filter(id => id !== user.id),
            attendeeCount: e.attendeeCount - 1
          };
        } else {
          return {
            ...e,
            attendees: [...(e.attendees || []), user.id],
            attendeeCount: e.attendeeCount + 1
          };
        }
      }
      return e;
    });

    localStorage.setItem("events", JSON.stringify(updated));
    setEvents(updated);
  }

  function isAttending(event) {
    return event.attendees?.includes(user?.id);
  }

  // Calendar functions
  function getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  }

  function getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)",
        padding: "30px",
        borderRadius: "16px",
        color: "white",
        marginBottom: "30px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ margin: 0, fontSize: "2.2rem" }}>📅 Events</h1>
        <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "1.1rem" }}>
          Discover and join Christian events and gatherings
        </p>
      </div>

      {/* Create Event Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            width: "100%",
            padding: "15px",
            background: "#2e8b57",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            marginBottom: "20px",
            boxShadow: "0 4px 12px rgba(46,139,87,0.2)"
          }}
        >
          ➕ Create New Event
        </button>
      )}

      {/* Create Event Form */}
      {showCreateForm && (
        <div style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{ marginTop: 0, color: "#0b2e4a" }}>Create New Event</h3>
          
          <form onSubmit={handleCreateEvent}>
            <div style={{ display: "grid", gap: "15px" }}>
              
              {/* Event Title */}
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#333" }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="e.g., Sunday Morning Service"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "14px"
                  }}
                  required
                />
              </div>

              {/* Event Type */}
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#333" }}>
                  Event Type
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "14px"
                  }}
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.value}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#333" }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      fontSize: "14px"
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#333" }}>
                    Time *
                  </label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      fontSize: "14px"
                    }}
                    required
                  />
                </div>
              </div>

              {/* Online/In-Person */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px",
                background: "#f5f5f5",
                borderRadius: "8px"
              }}>
                <input
                  type="checkbox"
                  id="isOnline"
                  checked={newEvent.isOnline}
                  onChange={(e) => setNewEvent({...newEvent, isOnline: e.target.checked})}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <label htmlFor="isOnline" style={{ cursor: "pointer", fontSize: "14px" }}>
                  This is an online event
                </label>
              </div>

              {/* Location or Meeting Link */}
              {newEvent.isOnline ? (
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#333" }}>
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={newEvent.meetingLink}
                    onChange={(e) => setNewEvent({...newEvent, meetingLink: e.target.value})}
                    placeholder="https://zoom.us/j/..."
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      fontSize: "14px"
                    }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#333" }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    placeholder="e.g., Grace Community Church, 123 Main St"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      fontSize: "14px"
                    }}
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#333" }}>
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="Describe your event..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    padding: "10px 20px",
                    background: "#f0f0f0",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    background: "#2e8b57",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  📅 Create Event
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Calendar and Events Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "350px 1fr",
        gap: "20px"
      }}>
        
        {/* Calendar Widget */}
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          height: "fit-content"
        }}>
          {/* Month/Year Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
              style={{
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                padding: "5px 10px"
              }}
            >
              ◀
            </button>
            <h3 style={{ margin: 0, color: "#0b2e4a" }}>
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </h3>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
              style={{
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                padding: "5px 10px"
              }}
            >
              ▶
            </button>
          </div>

          {/* Day Headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "5px",
            marginBottom: "10px"
          }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} style={{
                textAlign: "center",
                fontSize: "12px",
                fontWeight: "600",
                color: "#666"
              }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "5px"
          }}>
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} style={{ aspectRatio: "1" }} />
            ))}
            
            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
              const dateStr = date.toISOString().split('T')[0];
              const dayEvents = getEventsForDate(date);
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              
              return (
                <div
                  key={day}
                  style={{
                    aspectRatio: "1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    background: isToday ? "#2e8b57" : dayEvents.length > 0 ? "#e8f5e9" : "transparent",
                    color: isToday ? "white" : "#333",
                    borderRadius: "8px",
                    cursor: dayEvents.length > 0 ? "pointer" : "default",
                    fontWeight: isToday ? "bold" : "normal",
                    position: "relative"
                  }}
                >
                  {day}
                  {dayEvents.length > 0 && (
                    <div style={{
                      width: "6px",
                      height: "6px",
                      background: isToday ? "white" : "#2e8b57",
                      borderRadius: "50%",
                      marginTop: "2px"
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Events List */}
        <div>
          <h3 style={{ color: "#0b2e4a", marginBottom: "15px" }}>
            Upcoming Events ({events.length})
          </h3>
          
          <div style={{ display: "grid", gap: "15px" }}>
            {events
              .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
              .map((event) => {
                const eventType = eventTypes.find(t => t.value === event.type) || eventTypes[0];
                const eventDate = new Date(event.date + 'T' + event.time);
                const isPast = eventDate < new Date();
                
                return (
                  <div
                    key={event.id}
                    style={{
                      background: "white",
                      padding: "20px",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      borderLeft: `4px solid ${eventType.color}`,
                      opacity: isPast ? 0.6 : 1
                    }}
                  >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: "10px"
                    }}>
                      <div>
                        <div style={{
                          display: "inline-block",
                          background: eventType.color,
                          color: "white",
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          marginBottom: "8px"
                        }}>
                          {eventType.icon} {event.type}
                        </div>
                        <h4 style={{ margin: "5px 0", color: "#0b2e4a" }}>
                          {event.title}
                        </h4>
                      </div>
                    </div>

                    <p style={{
                      margin: "10px 0",
                      color: "#666",
                      fontSize: "14px",
                      lineHeight: "1.5"
                    }}>
                      {event.description}
                    </p>

                    <div style={{
                      display: "grid",
                      gap: "8px",
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: "15px"
                    }}>
                      <div>📅 {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      <div>🕐 {event.time}</div>
                      {event.isOnline ? (
                        <div>🌐 Online Event {event.meetingLink && <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#2d6be3" }}>Join Meeting</a>}</div>
                      ) : (
                        event.location && <div>📍 {event.location}</div>
                      )}
                      <div>👥 {event.attendeeCount} attending</div>
                    </div>

                    {!isPast && (
                      <button
                        onClick={() => handleRSVP(event.id)}
                        style={{
                          padding: "10px 20px",
                          background: isAttending(event) ? "#f0f0f0" : eventType.color,
                          color: isAttending(event) ? "#666" : "white",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        {isAttending(event) ? "✓ Attending" : "📝 RSVP"}
                      </button>
                    )}
                    {isPast && (
                      <div style={{ color: "#999", fontSize: "14px", fontStyle: "italic" }}>
                        Event has ended
                      </div>
                    )}
                  </div>
                );
              })}

            {events.length === 0 && (
              <div style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#666"
              }}>
                <div style={{ fontSize: "4rem", marginBottom: "20px" }}>📅</div>
                <h3 style={{ color: "#0b2e4a", marginBottom: "10px" }}>
                  No events yet
                </h3>
                <p>Create an event to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}