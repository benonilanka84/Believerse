"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ProfileAvatar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const ref = useRef();

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("bv_user") || "null");
      setUser(u);
    } catch (e) {
      setUser(null);
    }

    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function handleLogout() {
    localStorage.removeItem("bv_user");
    setUser(null);
    router.push("/");
  }

  function goProfile() {
    router.push("/dashboard");
    setOpen(false);
  }

  if (!user) return null;

  return (
    <div className="profile-avatar" ref={ref}>
      <img
        src="/images/default-avatar.png"
        alt="Avatar"
        className="avatar-img"
        onClick={() => setOpen((s) => !s)}
        style={{ cursor: "pointer" }}
      />

      {open && (
        <div className="avatar-dropdown">
          <div className="avatar-name">{user?.email || "User"}</div>

          <button className="dropdown-btn" onClick={goProfile}>
            Edit Profile
          </button>

          <button
            className="dropdown-btn"
            onClick={() => {
              router.push("/terms");
              setOpen(false);
            }}
          >
            Terms & Conditions
          </button>

          <button
            className="dropdown-btn"
            onClick={() => {
              router.push("/settings");
              setOpen(false);
            }}
          >
            Settings
          </button>

          <button className="dropdown-btn danger" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}

      <style jsx>{`
        .profile-avatar {
          position: relative;
          display: inline-block;
        }
        .avatar-img {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.9);
        }
        .avatar-dropdown {
          position: absolute;
          right: 0;
          margin-top: 8px;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          width: 200px;
          padding: 8px;
          z-index: 40;
        }
        .avatar-name {
          padding: 6px 8px;
          font-weight: 600;
          color: #0b2e4a;
        }
        .dropdown-btn {
          width: 100%;
          padding: 10px;
          margin: 4px 0;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          color: #123;
        }
        .dropdown-btn:hover {
          background: rgba(0, 0, 0, 0.04);
        }
        .dropdown-btn.danger {
          color: #b33;
        }
      `}</style>
    </div>
  );
}
