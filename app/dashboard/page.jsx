"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProfileAvatar from "@/components/ProfileAvatar";
import "@/styles/dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [verse, setVerse] = useState(null);
  const [verseImage, setVerseImage] = useState(null);

  // Daily Verse Logic ─ persists one full day
  const VERSE_KEY = "dailyVerse";
  const VERSE_DATE_KEY = "dailyVerseDate";

  const bibleVerses = [
    {
      text: "I can do all things through Christ who strengthens me.",
      ref: "Philippians 4:13",
    },
    {
      text: "The Lord is my shepherd; I shall not want.",
      ref: "Psalm 23:1",
    },
    {
      text: "Trust in the Lord with all your heart.",
      ref: "Proverbs 3:5",
    },
    {
      text: "Be strong and courageous. Do not be afraid.",
      ref: "Joshua 1:9",
    },
  ];

function generateVerseImage(verseText, reference) {
  const safeVerse = verseText.replace(/`/g, "\\`");
  const safeRef = reference.replace(/`/g, "\\`");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="900">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(0, 0, 0, 0.2)" />
          <stop offset="100%" stop-color="rgba(0, 0, 0, 0.65)" />
        </linearGradient>
      </defs>

      <image
        href="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80"
        x="0"
        y="0"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
      />

      <rect width="100%" height="100%" fill="url(#fade)" />

      <text
        x="50%"
        y="45%"
        text-anchor="middle"
        fill="#ffffff"
        font-size="30"
        font-family="Georgia"
        style="white-space: pre-line"
      >
        ${safeVerse}
      </text>

      <text
        x="50%"
        y="60%"
        text-anchor="middle"
        fill="#ffffff"
        font-size="22"
        font-family="Georgia"
      >
        — ${safeRef}
      </text>
    </svg>
  `;
}

  useEffect(() => {
    const userSession = supabase.auth.getUser();

    userSession.then((res) => {
      if (res?.data?.user) {
        setUser(res.data.user);
      }
    });

    const today = new Date().toISOString().split("T")[0];
    const storedDate = localStorage.getItem(VERSE_DATE_KEY);
    const storedVerse = localStorage.getItem(VERSE_KEY);

    if (storedDate === today && storedVerse) {
      const parsed = JSON.parse(storedVerse);
      setVerse(parsed);
      setVerseImage(generateVerseImage(parsed));
    } else {
      const random = bibleVerses[Math.floor(Math.random() * bibleVerses.length)];
      localStorage.setItem(VERSE_KEY, JSON.stringify(random));
      localStorage.setItem(VERSE_DATE_KEY, today);
      setVerse(random);
      setVerseImage(generateVerseImage(random));
    }
  }, []);

  function copyText() {
    navigator.clipboard.writeText(`${verse.text} — ${verse.ref}`);
    alert("Copied!");
  }

  function shareText() {
    if (navigator.share) {
      navigator.share({
        title: "Verse of the Day",
        text: `${verse.text} — ${verse.ref}`,
      });
    } else {
      alert("Sharing not supported on this device.");
    }
  }

  function downloadPNG() {
    const svgBlob = new Blob([verseImage], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "verse.png";
    link.click();
    URL.revokeObjectURL(url);
  }

  function shareImage() {
    alert("Sharing image is not supported on all devices yet.");
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1>Welcome to your Dashboard</h1>
        <ProfileAvatar user={user} />
      </div>

      <div className="dashboard-grid">

        {/* Left Panel */}
        <div className="left-panel">
          <div className="panel-card">
            <h3>Verse of the Day</h3>
            {verse && (
              <p className="verse-text">
                “{verse.text}”
                <br />
                <span className="verse-ref">— {verse.ref}</span>
              </p>
            )}

            <div className="btn-row">
              <button className="btn" onClick={copyText}>Copy</button>
              <button className="btn" onClick={shareText}>Share</button>
            </div>
          </div>

          <div className="panel-card verse-image-panel">
            <h3>Verse Image</h3>

            <div className="verse-image-box">
              <div
                dangerouslySetInnerHTML={{ __html: verseImage }}
                className="verse-image"
              />
            </div>

            <div className="btn-row">
              <button className="btn" onClick={downloadPNG}>Download</button>
              <button className="btn" onClick={shareImage}>Share</button>
            </div>
          </div>
        </div>

        {/* Center Panel */}
        <div className="center-panel">
          <div className="panel-card">
            <h3>Center Panel</h3>
            <p>This area will be used to show the user's feed.</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <div className="panel-card">
            <h3>Right Panel</h3>
            <p>Upcoming features will appear here.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
