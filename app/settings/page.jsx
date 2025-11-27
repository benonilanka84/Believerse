"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import "@/styles/profile.css"; // already contains clean UI styles
import Link from "next/link";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  // App preferences
  const [notifications, setNotifications] = useState(true);
  const [translation, setTranslation] = useState("KJV");
  const [theme, setTheme] = useState("system");

  // Security fields
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        loadProfile(data.user.id);
      }
    }
    loadUser();
  }, []);

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      setLoading(false);
    }
  }

  async function savePreferences() {
    localStorage.setItem("notifications", notifications);
    localStorage.setItem("translation", translation);
    localStorage.setItem("theme", theme);

    alert("Preferences saved!");
  }

  async function updatePassword() {
    if (!newPassword.trim()) {
      return alert("Password cannot be empty.");
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      alert("Error updating password");
    } else {
      alert("Password updated successfully.");
      setNewPassword("");
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>⚙️ Settings</h2>

        {/* ACCOUNT SECTION */}
        <section className="settings-section">
          <h3>Account Information</h3>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Name:</strong> {profile?.full_name || "Not set"}</p>

          <Link href={`/profile/${user?.id}/edit`} className="btn-primary">
            Edit Profile
          </Link>
        </section>

        {/* APP PREFERENCES */}
        <section className="settings-section">
          <h3>App Preferences</h3>

          <div className="settings-field">
            <label>Daily Verse Notifications</label>
            <select
              value={notifications}
              onChange={(e) => setNotifications(e.target.value === "true")}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>

          <div className="settings-field">
            <label>Verse Translation</label>
            <select
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
            >
              <option value="KJV">KJV</option>
              <option value="NIV">NIV</option>
              <option value="NKJV">NKJV</option>
              <option value="ESV">ESV</option>
            </select>
          </div>

          <div className="settings-field">
            <label>Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>

          <button className="btn-primary" onClick={savePreferences}>
            Save Preferences
          </button>
        </section>

        {/* SECURITY */}
        <section className="settings-section">
          <h3>Security</h3>

          <div className="settings-field">
            <label>Change Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={updatePassword}>
            Update Password
          </button>
        </section>

        {/* DELETE ACCOUNT */}
        <section className="settings-section danger">
          <h3>Delete Account</h3>
          <button
            className="btn-danger"
            onClick={() => alert("We will add delete account soon.")}
          >
            Delete My Account
          </button>
        </section>

        {/* BACK */}
        <div style={{ marginTop: "20px" }}>
          <Link href="/dashboard" className="btn-secondary">
            ⬅ Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
