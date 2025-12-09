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
  
  // Invite/Edit Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedEventForInvite, setSelectedEventForInvite] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Bulk Invite State
  const [selectedFriends, setSelectedFriends] = useState([]);

  // Create Form
  const [newEvent, setNewEvent] = useState({
    title: "", description: "", date: "", time: "", location: "",
    type: "Fellowship", isOnline: false, meetingLink: "",
    shareToFeed: false // NEW OPTION
  });

  const eventTypes = [{ value: "Fellowship" }, { value: "Prayer" }, { value: "Bible Study" }, { value: "Worship" }];

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
      .select(`*, event_rsvps(status)`)
      .order('event_date', { ascending: true });
    
    if (data) {
      const processed = data.map(e => ({
        ...e,
        attending: e.event_rsvps.filter(r => r.status === 'attending').length,
        maybe: e.event_rsvps.filter(r => r.status === 'maybe').length,
        not_attending: e.event_rsvps.filter(r => r.status === 'not_attending').length
      }));
      setAllEvents(processed);
    }
  }

  async function loadConnections(userId) {
    const { data: conns } = await supabase.from('connections').select('*').or(`user_a.eq.${userId},user_b.eq.${userId}`).eq('status', 'connected');
    if (!conns) return;
    const friendIds = conns.map(c => c.user_a === userId ? c.user_b : c.user_a);
    const { data: friends } = await supabase.from('profiles').select('*').in('id', friendIds);
    setMyConnections(friends || []);
  }

  async function handleRSVP(eventId, status) {
    const { error } = await supabase.from('event_rsvps').upsert({
      event_id: eventId, user_id: user.id, status: status
    }, { onConflict: 'event_id, user_id' }); 

    if (!error) {
      alert(`RSVP Updated: ${status}`);
      loadEvents(); 
    }
  }

  // --- CREATE / EDIT EVENT ---
  async function handleCreateEvent(e) {
    e.preventDefault();
    if (!user) return;
    const payload = {
      user_id: user.id,
      title: newEvent.title, description: newEvent.description,
      event_date: newEvent.date, event_time: newEvent.time,
      location: newEvent.isOnline ? "Online" : newEvent.location,
      is_online: newEvent.isOnline, meeting_link: newEvent.meetingLink
    };

    let error;
    if (editingEvent) {
      ({ error } = await supabase.from('events').update(payload).eq('id', editingEvent.id));
    } else {
      ({ error } = await supabase.from('events').insert(payload));
      
      // CONDITIONAL POST TO FEED
      if (!error && newEvent.shareToFeed) {
        const postContent = `📅 New Event: ${newEvent.title}\n\n${newEvent.description}\n\nJoin us on ${newEvent.date} at ${newEvent.time}!`;
        await supabase.from('posts').insert({
          user_id: user.id,
          content: postContent,
          type: "Event",
          title: newEvent.title
        });
      }
    }

    if (error) alert("Error: " + error.message);
    else {
      alert(editingEvent ? "Event Updated!" : "Event Created!");
      setShowCreateForm(false);
      setEditingEvent(null);
      // Reset form
      setNewEvent({ title: "", description: "", date: "", time: "", location: "", type: "Fellowship", isOnline: false, meetingLink: "", shareToFeed: false });
      loadEvents();
    }
  }

  async function handleDeleteEvent(id) {
    if(!confirm("Delete this event?")) return;
    await supabase.from('events').delete().eq('id', id);
    loadEvents();
  }

  function startEdit(event) {
    setEditingEvent(event);
    setNewEvent({
      title: event.title, description: event.description,
      date: event.event_date, time: event.event_time,
      location: event.location, isOnline: event.is_online,
      meetingLink: event.meeting_link || "",
      shareToFeed: false // Usually don't re-share on edit
    });
    setShowCreateForm(true);
  }

  // --- BULK INVITE LOGIC ---
  function toggleFriendSelection(id) {
    if (selectedFriends.includes(id)) {
      setSelectedFriends(selectedFriends.filter(fid => fid !== id));
    } else {
      setSelectedFriends([...selectedFriends, id]);
    }
  }

  function toggleSelectAll() {
    if (selectedFriends.length === myConnections.length) {
      setSelectedFriends([]); 
    } else {
      setSelectedFriends(myConnections.map(c => c.id));
    }
  }

  async function sendBulkInvites() {
    if (!selectedEventForInvite || selectedFriends.length === 0) return;

    const invites = selectedFriends.map(fid => ({
      event_id: selectedEventForInvite.id,
      sender_id: user.id,
      receiver_id: fid,
      status: 'pending'
    }));

    const { error } = await supabase.from('event_invites').insert(invites);

    if (error) alert("Error sending invites: " + error.message);
    else {
      alert(`✅ Sent invites to ${selectedFriends.length} believers!`);
      setInviteModalOpen(false);
      setSelectedFriends([]);
    }
  }

  function toLocalISODate(date) {
    const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const visibleEvents = viewMode === "my" ? allEvents.filter(e => e.user_id === user?.id) : allEvents;
  const eventsOnDate = visibleEvents.filter(e => e.event_date === toLocalISODate(selectedDate));

  if (!mounted) return null;
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedDate);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "30px", borderRadius: "16px", color: "white", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>📅 Events</h1>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setViewMode("all")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: viewMode === "all" ? "#0b2e4a" : "white", color: viewMode === "all" ? "white" : "#333", fontWeight: "bold" }}>🌐 All Events</button>
        <button onClick={() => setViewMode("my")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: viewMode === "my" ? "#0b2e4a" : "white", color: viewMode === "my" ? "white" : "#333", fontWeight: "bold" }}>👤 My Events</button>
      </div>

      <button onClick={() => { setShowCreateForm(!showCreateForm); setEditingEvent(null); setNewEvent({ title: "", description: "", date: "", time: "", location: "", type: "Fellowship", isOnline: false, meetingLink: "", shareToFeed: false }); }} style={{ width: "100%", padding: "15px", background: "#f0fff4", color: "#2e8b57", border: "2px dashed #2e8b57", borderRadius: "12px", fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>
        {showCreateForm ? "Cancel" : "➕ Create New Event"}
      </button>

      {showCreateForm && (
        <div style={{ background: "white", padding: "25px", borderRadius: "12px", marginBottom: "20px" }}>
          <h3 style={{marginTop:0}}>{editingEvent ? "Edit Event" : "New Event"}</h3>
          <form onSubmit={handleCreateEvent} style={{ display: "grid", gap: "15px" }}>
            <input type="text" placeholder="Title" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
            <textarea placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
              <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
            </div>
            
            <div style={{display:'flex', gap:'20px'}}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" checked={newEvent.isOnline} onChange={e => setNewEvent({...newEvent, isOnline: e.target.checked})} /> <label style={{color:"#333"}}>Online</label>
              </div>
              
              {/* NEW SHARE OPTION */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" checked={newEvent.shareToFeed} onChange={e => setNewEvent({...newEvent, shareToFeed: e.target.checked})} /> <label style={{color:"#333", fontWeight:'bold'}}>Share to The Walk (Feed)</label>
              </div>
            </div>

            {newEvent.isOnline ? <input type="text" placeholder="Link" value={newEvent.meetingLink} onChange={e => setNewEvent({...newEvent, meetingLink: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} /> : <input type="text" placeholder="Location" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />}
            <button type="submit" style={{ padding: "12px", background: "#2e8b57", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>{editingEvent ? "Update" : "Publish"}</button>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "20px" }}>
        {/* Calendar UI */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", height: "fit-content" }}>
          <div style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold", color: "#0b2e4a" }}>{monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
            {["S","M","T","W","T","F","S"].map(d => <div key={d} style={{ fontSize: "12px", textAlign: "center", color: "#888" }}>{d}</div>)}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => { 
                const day = i + 1; 
                const dateCheck = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                const dateString = toLocalISODate(dateCheck);
                
                const isSelected = day === selectedDate.getDate();
                const hasEvent = visibleEvents.some(e => e.event_date === dateString);

                return (
                  <div key={day} onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))} 
                    style={{ 
                      textAlign: "center", padding: "8px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", 
                      background: isSelected ? "#2e8b57" : (hasEvent ? "#e0f2f1" : "transparent"), 
                      color: isSelected ? "white" : (hasEvent ? "#00695c" : "#333"), 
                      fontWeight: isSelected || hasEvent ? "bold" : "normal",
                      border: hasEvent && !isSelected ? "1px solid #2e8b57" : "1px solid transparent"
                    }}>
                    {day}
                  </div>
                ) 
            })}
          </div>
        </div>

        <div>
          <h3 style={{ marginTop: 0, color: "#0b2e4a", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Events for {selectedDate.toDateString()}</h3>
          {eventsOnDate.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#999", background: "white", borderRadius: "12px" }}>No events.</div> : eventsOnDate.map(event => (
            <div key={event.id} style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "15px", borderLeft: "4px solid #2e8b57" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ margin: "0 0 5px 0", color: "#0b2e4a" }}>{event.title}</h3>
                {event.user_id === user?.id && (
                  <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={() => startEdit(event)} style={{border:'none', background:'none', color:'#2d6be3', cursor:'pointer', fontWeight:'bold'}}>Edit</button>
                    <button onClick={() => handleDeleteEvent(event.id)} style={{border:'none', background:'none', color:'red', cursor:'pointer', fontWeight:'bold'}}>Delete</button>
                  </div>
                )}
              </div>
              <p style={{color:'#555', margin:'5px 0'}}>{event.description}</p>
              <div style={{ color: "#666", fontSize: "14px", marginBottom: "10px" }}>🕒 {event.event_time} • {event.is_online ? "🌐 Online" : `📍 ${event.location}`}</div>
              
              {event.user_id !== user?.id && (
                <div style={{display:'flex', gap:'10px', marginTop:'10px', fontSize:'13px'}}>
                  <button onClick={() => handleRSVP(event.id, 'attending')} style={{padding:'5px 10px', borderRadius:'4px', border:'1px solid #2e8b57', background:'#e8f5e9', cursor:'pointer'}}>Going ({event.attending})</button>
                  <button onClick={() => handleRSVP(event.id, 'maybe')} style={{padding:'5px 10px', borderRadius:'4px', border:'1px solid #d4af37', background:'#fff9e6', cursor:'pointer'}}>Maybe ({event.maybe})</button>
                  <button onClick={() => handleRSVP(event.id, 'not_attending')} style={{padding:'5px 10px', borderRadius:'4px', border:'1px solid #999', background:'#f0f0f0', cursor:'pointer'}}>Not Going ({event.not_attending})</button>
                </div>
              )}
              {user && event.user_id === user.id && (
                <div style={{marginTop:'10px', fontSize:'12px', color:'#666'}}>
                  Going: {event.attending} | Maybe: {event.maybe} | Not Going: {event.not_attending}
                </div>
              )}
              <div style={{marginTop:'10px'}}>
                 <button onClick={() => { setSelectedEventForInvite(event); setInviteModalOpen(true); }} style={{ padding: "6px 12px", background: "#0b2e4a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize:'12px' }}>📩 Invite Believers</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* BULK INVITE MODAL */}
      {inviteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px', maxHeight: '80vh', display:'flex', flexDirection:'column' }}>
            <h3 style={{ marginTop: 0, color:'#0b2e4a' }}>Invite Believers</h3>
            <p style={{fontSize:'13px', color:'#666', marginBottom:'15px'}}>Inviting to: <b>{selectedEventForInvite?.title}</b></p>
            
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
              <button onClick={toggleSelectAll} style={{fontSize:'12px', color:'#2d6be3', background:'none', border:'none', cursor:'pointer', fontWeight:'bold'}}>
                {selectedFriends.length === myConnections.length ? "Deselect All" : "Select All"}
              </button>
              <span style={{fontSize:'12px', color:'#666'}}>{selectedFriends.length} selected</span>
            </div>

            <div style={{ overflowY: 'auto', marginBottom: '15px', flex:1, border:'1px solid #eee', borderRadius:'8px', padding:'5px' }}>
              {myConnections.length === 0 ? (
                <p style={{padding:'20px', textAlign:'center', color:'#666'}}>No connections yet. Connect with believers first!</p>
              ) : (
                myConnections.map(friend => (
                  <div key={friend.id} onClick={() => toggleFriendSelection(friend.id)} 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap:'10px', padding: '10px', borderBottom: '1px solid #eee', cursor:'pointer',
                      background: selectedFriends.includes(friend.id) ? '#e8f5e9' : 'transparent' 
                    }}>
                    <input 
                      type="checkbox" 
                      checked={selectedFriends.includes(friend.id)} 
                      readOnly 
                      style={{accentColor:'#2e8b57'}}
                    />
                    <span style={{color:'#333', fontWeight:'500'}}>{friend.full_name}</span>
                  </div>
                ))
              )}
            </div>
            
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={() => setInviteModalOpen(false)} style={{ flex:1, padding: '10px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer', color:'#333' }}>Cancel</button>
              <button onClick={sendBulkInvites} disabled={selectedFriends.length === 0} style={{ flex:1, padding: '10px', background: '#2e8b57', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight:'bold', opacity: selectedFriends.length===0?0.5:1 }}>
                Send Invites ({selectedFriends.length})
              </button>
            </div>
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