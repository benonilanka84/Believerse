"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function PrayerPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [prayers, setPrayers] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'my'
  
  // Stats
  const [stats, setStats] = useState({ active: 0, answered: 0, total: 0 });

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: "", content: "" });
  const [creating, setCreating] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      loadPrayers(data.user.id);
    }
  }

  async function loadPrayers(currentUserId) {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(full_name, avatar_url), amens(user_id)')
      .eq('type', 'Prayer')
      .order('created_at', { ascending: false });
    
    if (data) {
      const formatted = data.map(p => ({
        ...p,
        prayCount: p.amens.length,
        hasPrayed: p.amens.some(a => a.user_id === (currentUserId || user?.id))
      }));
      setPrayers(formatted);
      calculateStats(formatted);
    }
  }

  function calculateStats(data) {
    const answered = data.filter(p => p.title && p.title.includes("Answered")).length;
    const total = data.length;
    const active = total - answered;
    setStats({ active, answered, total });
  }

  // --- ACTIONS ---
  async function handleCreate(e) {
    e.preventDefault();
    if (!newRequest.content.trim()) return;
    setCreating(true);

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      title: newRequest.title || "Prayer Request",
      content: newRequest.content,
      type: "Prayer"
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Prayer Request Shared!");
      setIsCreateOpen(false);
      setNewRequest({ title: "", content: "" });
      loadPrayers(user.id);
    }
    setCreating(false);
  }

  async function handlePray(prayerId, hasPrayed) {
    if (!user) return;
    setPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, hasPrayed: !hasPrayed, prayCount: hasPrayed ? p.prayCount - 1 : p.prayCount + 1 } : p));

    if (hasPrayed) {
      await supabase.from('amens').delete().match({ user_id: user.id, post_id: prayerId });
    } else {
      await supabase.from('amens').insert({ user_id: user.id, post_id: prayerId });
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this prayer request?")) return;
    await supabase.from('posts').delete().eq('id', id);
    const updated = prayers.filter(p => p.id !== id);
    setPrayers(updated);
    calculateStats(updated);
  }

  async function handleUpdate(id) {
    await supabase.from('posts').update({ content: editContent }).eq('id', id);
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, content: editContent } : p));
    setEditingId(null);
  }

  async function toggleAnswered(id, currentStatus) {
    const newTitle = currentStatus ? "Prayer Request" : "✨ Answered Prayer";
    await supabase.from('posts').update({ title: newTitle }).eq('id', id);
    
    const updated = prayers.map(p => p.id === id ? { ...p, title: newTitle } : p);
    setPrayers(updated);
    calculateStats(updated);
  }

  const visiblePrayers = activeTab === 'my' 
    ? prayers.filter(p => p.user_id === user?.id)
    : prayers;

  if (!mounted) return null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      
      {/* Header Banner */}
      <div style={{ background: '#2e8b57', padding: '30px', borderRadius: '12px', color: 'white', marginBottom: '20px', textAlign:'center' }}>
        <h1 style={{ margin: 0, fontSize:'28px' }}>🙏 Prayer Wall</h1>
        <p style={{ opacity: 0.9, marginTop:'5px' }}>Share requests and stand in the gap for others.</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '24px' }}>🙏</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e8b57' }}>{stats.active}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Active Prayers</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '24px' }}>🎉</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d4af37' }}>{stats.answered}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Answered</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '24px' }}>👥</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0b2e4a' }}>{stats.total}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Total Prayers</div>
        </div>
      </div>

      {/* Share Button */}
      <button 
        onClick={() => setIsCreateOpen(true)}
        style={{ width: '100%', padding: '15px', background: '#2e8b57', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', boxShadow: '0 4px 10px rgba(46, 139, 87, 0.3)' }}
      >
        + Share a Prayer Request
      </button>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('all')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: activeTab === 'all' ? 'white' : 'transparent', color: activeTab === 'all' ? '#2e8b57' : '#666', fontWeight: 'bold', cursor:'pointer', boxShadow: activeTab === 'all' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>
          🌍 All Prayers
        </button>
        <button onClick={() => setActiveTab('my')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: activeTab === 'my' ? '#2e8b57' : 'transparent', color: activeTab === 'my' ? 'white' : '#666', fontWeight: 'bold', cursor:'pointer', boxShadow: activeTab === 'my' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>
          👤 My Prayers
        </button>
      </div>

      {/* List */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {visiblePrayers.length === 0 ? <p style={{textAlign:'center', color:'#666', padding:20}}>No prayers found.</p> : 
          visiblePrayers.map(p => (
          <div key={p.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: p.title?.includes('Answered') ? '5px solid #d4af37' : '5px solid #2e8b57' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eee', overflow: 'hidden' }}>
                  <img src={p.profiles?.avatar_url || '/images/default-avatar.png'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#0b2e4a' }}>{p.profiles?.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{new Date(p.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Edit/Delete for Owner */}
              {user?.id === p.user_id && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setEditingId(p.id); setEditContent(p.content); }} style={{ padding: '5px 10px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✏️ Edit</button>
                  <button onClick={() => handleDelete(p.id)} style={{ padding: '5px 10px', background: '#fff1f0', color: 'red', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>🗑️ Delete</button>
                </div>
              )}
            </div>

            {/* Content */}
            {editingId === p.id ? (
              <div style={{ marginBottom: '10px' }}>
                <textarea 
                  value={editContent} 
                  onChange={e => setEditContent(e.target.value)} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px' }} 
                />
                <div style={{ display: 'flex', gap: '5px', marginTop: '5px', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleUpdate(p.id)} style={{ padding: '6px 12px', background: '#2e8b57', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ padding: '6px 12px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {p.title && <div style={{ fontWeight: 'bold', marginBottom: '5px', color: p.title.includes('Answered') ? '#d4af37' : '#2e8b57' }}>{p.title}</div>}
                <p style={{ color: '#333', lineHeight: '1.5' }}>{p.content}</p>
              </>
            )}

            {/* Footer */}
            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <button 
                onClick={() => handlePray(p.id, p.hasPrayed)} 
                style={{ background: p.hasPrayed ? '#e8f5e9' : 'transparent', color: p.hasPrayed ? '#2e8b57' : '#666', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🙏 {p.hasPrayed ? 'Praying' : "I'll Pray"} ({p.prayCount})
              </button>

              {user?.id === p.user_id && (
                <button 
                  onClick={() => toggleAnswered(p.id, p.title?.includes('Answered'))}
                  style={{ background: 'transparent', color: '#d4af37', border: '1px solid #d4af37', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  {p.title?.includes('Answered') ? 'Mark as Request' : '✨ Mark Answered'}
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2e8b57' }}>Share a Prayer Request</h3>
            
            <input 
              type="text" 
              placeholder="Prayer Title (Optional)" 
              value={newRequest.title} 
              onChange={e => setNewRequest({...newRequest, title: e.target.value})} 
              style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd' }} 
            />
            
            <textarea 
              placeholder="Describe your request..." 
              value={newRequest.content} 
              onChange={e => setNewRequest({...newRequest, content: e.target.value})} 
              style={{ width: '100%', padding: '12px', minHeight: '120px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px' }} 
            />
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsCreateOpen(false)} style={{ padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreate} disabled={creating || !newRequest.content.trim()} style={{ padding: '10px 20px', background: '#2e8b57', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', opacity: creating ? 0.7 : 1 }}>
                {creating ? "Posting..." : "Share Request"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}