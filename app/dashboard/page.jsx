"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProfileAvatar from "@/components/ProfileAvatar";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Load user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        window.location.href = "/";
      } else {
        setUser(data.user);
      }
    });
  }, []);

  // 2. Load Verse of the Day
  useEffect(() => {
    async function loadVerse() {
      try {
        const res = await fetch(
          "https://labs.bible.org/api/?passage=random&type=json"
        );
        const data = await res.json();
        setVerse(data[0]);
      } catch (err) {
        console.error("Verse Load Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadVerse();
  }, []);

  // Share verse to WhatsApp
  const shareWhatsApp = () => {
    if (!verse) return;
    const message = `${verse.text} — ${verse.bookname} ${verse.chapter}:${verse.verse}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Copy verse
  const copyVerse = () => {
    if (!verse) return;
    const message = `${verse.text} — ${verse.bookname} ${verse.chapter}:${verse.verse}`;
    navigator.clipboard.writeText(message);
    alert("Verse copied!");
  };

  return (
    <div className="dashboard-page" style={{ padding: "40px" }}>
      {/* Avatar */}
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <ProfileAvatar user={user} />
      </div>

      <h1 style={{ marginTop: "60px", color: "#fff" }}>
        Welcome to your Dashboard
      </h1>

      {/* Verse of the Day */}
      <section className="votd-card" style={styles.card}>
        <h2>Verse of the Day</h2>

        {loading && <p style={styles.placeholder}>Loading verse...</p>}

        {verse && (
          <>
            <p style={styles.verseText}>
              “{verse.text}”
              <br />
              <span style={styles.ref}>
                — {verse.bookname} {verse.chapter}:{verse.verse}
              </span>
            </p>

            <div style={{ marginTop: "10px" }}>
              <button style={styles.btn} onClick={copyVerse}>
                Copy
              </button>
              <button style={styles.btn} onClick={shareWhatsApp}>
                Share to WhatsApp
              </button>
            </div>
          </>
        )}
      </section>

      {/* Future: Verse Image */}
      <section className="votd-img-card" style={styles.card}>
        <h2>Verse Image</h2>
        <p style={styles.placeholder}>Verse image will appear here...</p>
        <button style={styles.btn}>Share Image to WhatsApp</button>
      </section>
    </div>
  );
}

const styles = {
  card: {
    background: "rgba(255,255,255,0.9)",
    padding: "20px",
    borderRadius: "16px",
    margin: "20px 0",
    color: "#0b2e4a",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
  },
  placeholder: {
    opacity: 0.6,
  },
  verseText: {
    fontSize: "1.1rem",
    fontWeight: "500",
    lineHeight: "1.4",
  },
  ref: {
    fontSize: "0.95rem",
    opacity: 0.8,
  },
  btn: {
    padding: "10px 16px",
    marginRight: "8px",
    background: "#2d6be3",
    color: "white",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
  },
};
