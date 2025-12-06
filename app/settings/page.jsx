"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // App preferences
  const [notifications, setNotifications] = useState(true);
  const [translation, setTranslation] = useState("KJV");
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en"); // New: Interface language

  // Security fields
  const [newPassword, setNewPassword] = useState("");

  // Language options
  const languages = [
    // Indian Languages
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "hi", name: "हिन्दी (Hindi)", flag: "🇮🇳" },
    { code: "te", name: "తెలుగు (Telugu)", flag: "🇮🇳" },
    { code: "ta", name: "தமிழ் (Tamil)", flag: "🇮🇳" },
    { code: "mr", name: "मराठी (Marathi)", flag: "🇮🇳" },
    { code: "bn", name: "বাংলা (Bengali)", flag: "🇮🇳" },
    { code: "gu", name: "ગુજરાતી (Gujarati)", flag: "🇮🇳" },
    { code: "kn", name: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳" },
    { code: "ml", name: "മലയാളം (Malayalam)", flag: "🇮🇳" },
    { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)", flag: "🇮🇳" },
    { code: "or", name: "ଓଡ଼ିଆ (Odia)", flag: "🇮🇳" },
    { code: "as", name: "অসমীয়া (Assamese)", flag: "🇮🇳" },
    
    // Major International Languages
    { code: "es", name: "Español (Spanish)", flag: "🇪🇸" },
    { code: "pt", name: "Português (Portuguese)", flag: "🇵🇹" },
    { code: "fr", name: "Français (French)", flag: "🇫🇷" },
    { code: "de", name: "Deutsch (German)", flag: "🇩🇪" },
    { code: "it", name: "Italiano (Italian)", flag: "🇮🇹" },
    { code: "zh", name: "中文 (Chinese)", flag: "🇨🇳" },
    { code: "ja", name: "日本語 (Japanese)", flag: "🇯🇵" },
    { code: "ko", name: "한국어 (Korean)", flag: "🇰🇷" },
    { code: "ar", name: "العربية (Arabic)", flag: "🇸🇦" },
    { code: "ru", name: "Русский (Russian)", flag: "🇷🇺" },
    { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
    { code: "vi", name: "Tiếng Việt (Vietnamese)", flag: "🇻🇳" },
    { code: "th", name: "ไทย (Thai)", flag: "🇹🇭" },
    { code: "fil", name: "Filipino (Tagalog)", flag: "🇵🇭" },
    { code: "sw", name: "Kiswahili (Swahili)", flag: "🇰🇪" },
    { code: "am", name: "አማርኛ (Amharic)", flag: "🇪🇹" },
  ];

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        loadProfile(data.user.id);
      }
    }
    loadUser();

    // Load saved preferences
    const savedLanguage = localStorage.getItem("language") || "en";
    setLanguage(savedLanguage);
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
    localStorage.setItem("language", language);

    alert("✅ Preferences saved! Language will be fully supported soon.");
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

  if (loading) return <div style={{ padding: "40px", color: "#0b2e4a" }}>Loading...</div>;

  return (
    <div style={{
      padding: "40px",
      maxWidth: "900px",
      margin: "0 auto"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "30px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ color: "#0b2e4a", marginBottom: "24px" }}>⚙️ Settings</h2>

        {/* ACCOUNT SECTION */}
        <section style={{
          marginBottom: "32px",
          padding: "20px",
          background: "#f7f9fc",
          borderRadius: "12px",
          borderLeft: "4px solid #2d6be3"
        }}>
          <h3 style={{ color: "#0b2e4a", marginBottom: "16px" }}>Account Information</h3>
          <p style={{ color: "#333", marginBottom: "8px" }}>
            <strong>Email:</strong> {user?.email}
          </p>
          <p style={{ color: "#333", marginBottom: "16px" }}>
            <strong>Name:</strong> {profile?.full_name || "Not set"}
          </p>

          <Link 
            href="/profile/edit"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "#2d6be3",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            Edit Profile
          </Link>
        </section>

        {/* APP PREFERENCES */}
        <section style={{
          marginBottom: "32px",
          padding: "20px",
          background: "#f7f9fc",
          borderRadius: "12px",
          borderLeft: "4px solid #2e8b57"
        }}>
          <h3 style={{ color: "#0b2e4a", marginBottom: "16px" }}>App Preferences</h3>

          {/* Language Selection */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ 
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "#333"
            }}>
              🌍 Interface Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #d0d7e2",
                color: "#333",
                background: "white",
                fontSize: "14px"
              }}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
              Note: Full translation coming soon. Currently displays in English.
            </p>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ 
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "#333"
            }}>
              Daily Verse Notifications
            </label>
            <select
              value={notifications}
              onChange={(e) => setNotifications(e.target.value === "true")}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #d0d7e2",
                color: "#333",
                background: "white"
              }}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ 
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "#333"
            }}>
              Bible Translation
            </label>
            <select
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #d0d7e2",
                color: "#333",
                background: "white"
              }}
            >
              <option value="KJV">KJV (King James Version)</option>
              <option value="NIV">NIV (New International)</option>
              <option value="NKJV">NKJV (New King James)</option>
              <option value="ESV">ESV (English Standard)</option>
              <option value="NLT">NLT (New Living Translation)</option>
              <option value="NASB">NASB (New American Standard)</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ 
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "#333"
            }}>
              Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #d0d7e2",
                color: "#333",
                background: "white"
              }}
            >
              <option value="light">☀️ Light</option>
              <option value="dark">🌙 Dark</option>
              <option value="system">⚙️ System Default</option>
            </select>
          </div>

          <button 
            onClick={savePreferences}
            style={{
              padding: "10px 20px",
              background: "#2e8b57",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Save Preferences
          </button>
        </section>

        {/* SECURITY */}
        <section style={{
          marginBottom: "32px",
          padding: "20px",
          background: "#f7f9fc",
          borderRadius: "12px",
          borderLeft: "4px solid #ff9800"
        }}>
          <h3 style={{ color: "#0b2e4a", marginBottom: "16px" }}>Security</h3>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ 
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "#333"
            }}>
              Change Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #d0d7e2",
                color: "#333"
              }}
            />
          </div>

          <button 
            onClick={updatePassword}
            style={{
              padding: "10px 20px",
              background: "#ff9800",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Update Password
          </button>
        </section>

        {/* DELETE ACCOUNT */}
        <section style={{
          marginBottom: "24px",
          padding: "20px",
          background: "#fff0f0",
          borderRadius: "12px",
          borderLeft: "4px solid #d62828"
        }}>
          <h3 style={{ color: "#d62828", marginBottom: "16px" }}>Delete Account</h3>
          <button
            onClick={() => alert("We will add delete account soon.")}
            style={{
              padding: "10px 20px",
              background: "#d62828",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Delete My Account
          </button>
        </section>

        {/* BACK */}
        <div>
          <Link 
            href="/dashboard"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "#f0f0f0",
              color: "#0b2e4a",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            ⬅ Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}