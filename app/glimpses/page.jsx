"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function GlimpsesPage() {
  const [glimpses, setGlimpses] = useState([]);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newGlimpse, setNewGlimpse] = useState({ title: "", desc: "", file: null });
  const [menuOpen, setMenuOpen] = useState(null); // Glimpse ID

  useEffect(() => { checkUser(); }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      loadGlimpses();
    }
  }

  async function loadGlimpses() {
    const { data } = await supabase.from('posts').select(`*, profiles(full_name, avatar_url)`).eq('type', 'Glimpse').order('created_at', { ascending: false });
    setGlimpses(data || []);
  }

  async function handleUpload() {
    if (!newGlimpse.file || !user) return;
    setUploading(true);
    const fileName = `${user.id}-${Date.now()}`;
    const { error: uploadError } = await supabase.storage.from("posts").upload(fileName, newGlimpse.file);
    const { data: urlData } = supabase.storage.from("posts").getPublicUrl(fileName);
    
    await supabase.from('posts').insert({
      user_id: user.id,
      title: newGlimpse.title,
      content: newGlimpse.desc,
      type: "Glimpse",
      media_url: urlData.publicUrl,
      media_type: "video"
    });
    setUploading(false);
    setShowUploadModal(false);
    loadGlimpses();
  }

  async function deleteGlimpse(id) {
    if(!confirm("Delete?")) return;
    await supabase.from('posts').delete().eq('id', id);
    setGlimpses(prev => prev.filter(g => g.id !== id));
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh", display:'flex', flexDirection:'column', alignItems:'center' }}>
      <button onClick={() => setShowUploadModal(true)} style={{ position:'fixed', top:20, right:20, zIndex:100, padding:'10px 20px', background:'#2e8b57', color:'white', border:'none', borderRadius:'20px' }}>+ Upload</button>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'white', padding:'20px', borderRadius:'12px', width:'90%', maxWidth:'400px' }}>
            <h3>Upload Glimpse</h3>
            <input type="text" placeholder="Title" onChange={e => setNewGlimpse({...newGlimpse, title: e.target.value})} style={{width:'100%', padding:'10px', marginBottom:'10px'}} />
            <textarea placeholder="Description" onChange={e => setNewGlimpse({...newGlimpse, desc: e.target.value})} style={{width:'100%', padding:'10px', marginBottom:'10px'}} />
            <input type="file" accept="video/*" onChange={e => setNewGlimpse({...newGlimpse, file: e.target.files[0]})} />
            <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
              <button onClick={() => handleUpload()} disabled={uploading} style={{flex:1, padding:'10px', background:'#2e8b57', color:'white'}}>{uploading ? "Uploading..." : "Publish"}</button>
              <button onClick={() => setShowUploadModal(false)} style={{flex:1, padding:'10px'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* FEED container with Snap scroll style from TikTok */}
      <div style={{ width:'100%', maxWidth:'450px', height:'100vh', overflowY:'scroll', scrollSnapType:'y mandatory' }}>
        {glimpses.map(g => (
          <div key={g.id} style={{ height:'100vh', scrollSnapAlign:'start', position:'relative' }}>
            <video src={g.media_url} loop muted autoPlay style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            
            {/* THREE DOTS MENU */}
            <div style={{ position:'absolute', top:20, right:15, zIndex:5 }}>
               <button onClick={() => setMenuOpen(menuOpen === g.id ? null : g.id)} style={{ background:'none', color:'white', fontSize:'24px', border:'none', cursor:'pointer' }}>⋮</button>
               {menuOpen === g.id && (
                 <div style={{ position:'absolute', right:0, top:30, background:'white', padding:'10px', borderRadius:'8px', width:'150px' }}>
                    <button style={{width:'100%', textAlign:'left', padding:'5px 0', border:'none', background:'none'}}>Save Playlist</button>
                    <button style={{width:'100%', textAlign:'left', padding:'5px 0', border:'none', background:'none'}}>Captions</button>
                    <button style={{width:'100%', textAlign:'left', padding:'5px 0', border:'none', background:'none'}} onClick={() => alert("Report sent to admin.")}>Report</button>
                    {user?.id === g.user_id && <button onClick={() => deleteGlimpse(g.id)} style={{width:'100%', textAlign:'left', padding:'5px 0', border:'none', background:'none', color:'red'}}>Delete</button>}
                 </div>
               )}
            </div>

            <div style={{ position:'absolute', bottom:40, left:20, color:'white' }}>
              <h4 style={{margin:0}}>{g.title}</h4>
              <p style={{margin:0, fontSize:'14px'}}>{g.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}