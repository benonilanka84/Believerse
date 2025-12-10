"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import CreatePost from "@/components/CreatePost"; // Using your existing component

export default function PrayerPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [prayers, setPrayers] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'my'
  
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
      loadPrayers();
    }
  }

  async function loadPrayers() {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(full_name, avatar_url), amens(user_id)')
      .eq('type', 'Prayer')
      .order('created_at', { ascending: false });
    
    if (data) {
      // Map amens to "Praying Hands" count
      const formatted = data.map(p => ({
        ...p,
        prayCount: p.amens.length,
        hasPrayed: p.amens.some(a => a.user_id === user?.id)
      }));
      setPrayers(formatted);
    }
  }

  // --- ACTIONS ---
  async function handlePray(prayerId, hasPrayed) {
    if (!user) return;
    
    // Optimistic UI update
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
    setPrayers(prev => prev.filter(p => p.id !== id));
  }

  async function handleUpdate(id) {
    await supabase.from('posts').update({ content: editContent }).eq('id', id);
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, content: editContent } : p));
    setEditingId(null);
  }

  async function toggleAnswered(id, currentStatus) {
    // We can store 'Answered' in the title or a separate column. 
    // For now, let's append "[Answered]" to the title as a simple flag if no dedicated column exists.
    const newTitle = currentStatus ? "Prayer Request" : "✨ Answered Prayer";
    
    await supabase.from('posts').update({ title: newTitle }).eq('id', id);
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, title: newTitle } : p));
  }

  // --- FILTER ---
  const visiblePrayers = activeTab === 'my' 
    ? prayers.filter(p => p.user_id === user?.id)
    : prayers;

  if (!mounted) return null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ background: '#2e8b57', padding: '30px', borderRadius: '12px', color: 'white', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>🙏 Prayer Wall</h1>
        <p style={{ opacity: 0.9 }}>Share requests and stand in the gap for others.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('all')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: activeTab === 'all' ? '#0b2e4a' : 'white', color: activeTab === 'all' ? 'white' : '#333', fontWeight: 'bold', cursor:'pointer' }}>
          🌍 All Prayers ({prayers.length})
        </button>
        <button onClick={() => setActiveTab('my')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: activeTab === 'my' ? '#0b2e4a' : 'white', color: activeTab === 'my' ? 'white' : '#333', fontWeight: 'bold', cursor:'pointer' }}>
          👤 My Prayers ({prayers.filter(p => p.user_id === user?.id).length})
        </button>
      </div>

      {/* Create Box */}
      {user && <CreatePost user={user} onPostCreated={loadPrayers} />}

      {/* List */}
      <div style={{ display: 'grid', gap: '15px', marginTop:'20px' }}>
        {visiblePrayers.map(p => (
          <div key={p.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: p.title?.includes('Answered') ? '5px solid #d4af37' : '5px solid #2e8b57' }}>
            
            {/* Header: User & Menu */}
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

              {/* Owner Options */}
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

            {/* Footer Actions */}
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
    </div>
  );
}