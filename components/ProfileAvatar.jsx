// components/ProfileAvatar.jsx
"use client";

import { useState, useEffect, useRef } from "react";

export default function ProfileAvatar() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    dob: "",
    gender: "",
    about: "",
    ministry: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("believerse_profile");
      if (raw) setProfile(JSON.parse(raw));
    } catch (e) {}
  }, []);

  function toggle() {
    setOpen((v) => !v);
  }

  function saveProfile() {
    localStorage.setItem("believerse_profile", JSON.stringify(profile));
    setEditing(false);
  }

  function logout() {
    // In real app -> call auth signOut
    alert("Logged out (simulated).");
    // optionally clear profile
    // localStorage.removeItem("believerse_profile");
  }

  return (
    <div style={{ position: "relative", display: "inline-block", margin: 12 }}>
      <button
        onClick={toggle}
        aria-label="Profile"
        className="avatar-btn"
        title="Profile"
      >
        <span className="avatar-circle">{profile.name ? profile.name[0].toUpperCase() : "B"}</span>
      </button>

      {open && (
        <div className="avatar-dropdown" onMouseLeave={() => setOpen(false)}>
          <div style={{ padding: 12 }}>
            <div style={{ fontWeight: 700 }}>{profile.name || "Guest"}</div>
            <div style={{ marginTop: 8 }}>
              <button
                className="dropdown-btn"
                onClick={() => {
                  setEditing(true);
                  setOpen(false);
                }}
              >
                Edit Profile
              </button>
              <button
                className="dropdown-btn"
                onClick={() => {
                  window.location.href = "/terms";
                }}
              >
                Terms & Conditions
              </button>
              <button
                className="dropdown-btn"
                onClick={() => {
                  window.location.href = "/settings";
                }}
              >
                Settings
              </button>
              <button className="dropdown-btn danger" onClick={logout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Edit profile</h3>
            <label>
              Full name
              <input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </label>
            <label>
              Date of birth
              <input
                type="date"
                value={profile.dob}
                onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
              />
            </label>
            <label>
              Gender
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>
            <label>
              Church/Ministry
              <input
                value={profile.ministry}
                onChange={(e) => setProfile({ ...profile, ministry: e.target.value })}
              />
            </label>
            <label>
              About / Faith journey
              <textarea
                value={profile.about}
                onChange={(e) => setProfile({ ...profile, about: e.target.value })}
              />
            </label>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-cta" onClick={saveProfile}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .avatar-btn { background: transparent; border: none; cursor: pointer; }
        .avatar-circle {
          display: inline-block;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #0b2e4a;
          color: #fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:700;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .avatar-dropdown {
          position: absolute;
          right: 0;
          top: 46px;
          width: 220px;
          background: white;
          border-radius: 10px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.2);
          z-index: 40;
        }
        .dropdown-btn {
          display: block;
          width: 100%;
          text-align: left;
          padding: 8px 10px;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .dropdown-btn.danger { color: #b33; }
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 60;
        }
        .modal {
          width: 420px;
          background: #fff;
          padding: 18px;
          border-radius: 10px;
        }
        .modal label { display:block; margin-top:10px; font-size:0.9rem; }
        .modal input, .modal textarea, .modal select {
          width: 100%;
          padding:8px;
          margin-top:6px;
          border-radius:6px;
          border: 1px solid #ddd;
        }
      `}</style>
    </div>
  );
}
