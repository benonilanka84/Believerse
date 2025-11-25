// /components/ProfileAvatar.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";

export default function ProfileAvatar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    const s = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else {
        setUser(session.user);
        await loadProfile(session.user);
      }
    });

    // initial
    (async () => {
      const session = supabase.auth.getSession
        ? (await supabase.auth.getSession()).data.session
        : null;
      const u = session?.user ?? supabase.auth.user?.() ?? null;
      if (u) {
        setUser(u);
        await loadProfile(u);
      } else {
        setLoading(false);
      }
    })();

    return () => {
      if (s?.data?.subscription) s.data.subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(u) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .single();
      if (!error && data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("loadProfile error", err);
    } finally {
      setLoading(false);
    }
  }

  function getInitials() {
    const full = (profile?.full_name || user?.user_metadata?.full_name || "").trim();
    if (!full) {
      const email = user?.email || "";
      return (email[0] || "U").toUpperCase();
    }
    const parts = full.split(/\s+/);
    const first = (parts[0] || "").slice(0, 1);
    const last = (parts[parts.length - 1] || "").slice(0, 1);
    return (first + last).toUpperCase();
  }

  async function uploadFile(file) {
    if (!user) return;
    const filename = `${user.id}-${Date.now()}-${file.name}`;
    const filePath = `avatars/${filename}`;
    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error", uploadError);
        alert("Failed to upload avatar.");
        return;
      }

      // get public url
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl || "";

      // save to profiles table
      const updates = {
        id: user.id,
        avatar_url: publicUrl,
        updated_at: new Date(),
      };

      const { error: updateError } = await supabase.from("profiles").upsert(updates);
      if (updateError) {
        console.error("Profile update error", updateError);
        alert("Failed to save avatar to profile.");
      } else {
        await loadProfile(user);
      }
    } catch (err) {
      console.error("uploadFile error", err);
      alert("Unexpected error during upload.");
    }
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error", error);
      alert("Failed to sign out.");
    } else {
      router.push("/");
    }
  }

  if (loading) {
    return <div style={{ width: 40, height: 40 }} />;
  }

  const avatarUrl = profile?.avatar_url || null;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        aria-label="Profile menu"
        onClick={() => setOpen((s) => !s)}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: avatarUrl ? `url(${avatarUrl}) center/cover` : "#113",
          color: "#fff",
          border: "none",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {!avatarUrl && getInitials()}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: 8,
            width: 200,
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
            padding: 8,
            zIndex: 1200,
          }}
        >
          <button
            onClick={() => {
              setOpen(false);
              router.push("/profile/edit");
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 10px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Edit Profile
          </button>

          <button
            onClick={() => {
              setOpen(false);
              router.push("/settings");
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 10px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Settings
          </button>

          <button
            onClick={() => {
              setOpen(false);
              router.push("/terms");
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 10px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Terms & Conditions
          </button>

          <div style={{ height: 1, background: "#eee", margin: "8px 0" }} />

          <button
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 10px",
              border: "none",
              background: "transparent",
              color: "#b33",
              cursor: "pointer",
            }}
          >
            Log Out
          </button>

          {/* Hidden file input for quick avatar update (optional) */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
        </div>
      )}
    </div>
  );
}
