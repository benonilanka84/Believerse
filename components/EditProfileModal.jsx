"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function EditProfileModal({ user, onClose, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [bio, setBio] = useState(user?.bio || "");
  const [fullName, setFullName] = useState(user?.full_name || "");

  async function handleSave() {
    setUploading(true);
    try {
      let publicUrl = user.cover_url;

      // 1. Upload Cover Photo (if changed)
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to the existing 'covers' bucket
        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(filePath, coverFile);

        if (uploadError) throw uploadError;

        // Get the Public URL
        const { data } = supabase.storage
          .from('covers')
          .getPublicUrl(filePath);
        
        publicUrl = data.publicUrl;
      }

      // 2. Update Profile in Database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          cover_url: publicUrl,
          bio: bio,
          full_name: fullName,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      alert("Profile updated successfully!");
      onUpdate(); // Refresh the parent page
      onClose(); // Close modal

    } catch (error) {
      console.error(error);
      alert("Error updating profile: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '500px', position: 'relative' }}>
        
        <h2 style={{ margin: '0 0 20px 0', color: '#0b2e4a' }}>Edit Profile</h2>

        {/* Full Name */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>Display Name</label>
          <input 
            type="text" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
        </div>

        {/* Bio */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>Bio / Faith Journey</label>
          <textarea 
            value={bio} 
            onChange={(e) => setBio(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '80px' }}
            placeholder="Share a bit about yourself..."
          />
        </div>

        {/* Cover Photo Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>Update Cover Photo</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setCoverFile(e.target.files[0])}
            style={{ fontSize: '14px' }}
          />
          {coverFile && <p style={{ fontSize: '12px', color: 'green', marginTop: '5px' }}>Selected: {coverFile.name}</p>}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={uploading}
            style={{ padding: '10px 20px', background: '#2e8b57', color: 'white', border: 'none', borderRadius: '8px', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
          >
            {uploading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}