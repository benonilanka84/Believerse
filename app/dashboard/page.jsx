"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProfileAvatar from "@/components/ProfileAvatar";

// A small Bible verse list for now.
// You can replace with API later.
const VERSES = [
  {
    text:
      "“Trust in the Lord with all your heart and lean not on your own understanding.”",
    ref: "— Proverbs 3:5",
  },
  {
    text:
      "“The Lord is my shepherd; I shall not want.”",
    ref: "— Psalm 23:1",
  },
  {
    text:
      "“I can do all things through Christ who strengthens me.”",
    ref: "— Philippians 4:13",
  },
  {
    text:
      "“Be strong and courageous… for the Lord your God is with you wherever you go.”",
    ref: "— Joshua 1:9",
  },
];

// Function to generate an image (simple placeholder for now)
async function generateVerseImage(verseText, verseRef) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Verse text
  ctx.fillStyle = "#fff";
  ctx.font = "28px Georgia";
  ctx.textAlign = "center";
  ctx.fillText(verseText, canvas.width / 2, 400);

  // Reference
  ctx.font = "22px serif";
  ctx.fillText(verseRef, canvas.width / 2, 470);

  return canvas.toDataURL("image/png");
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [verse, setVerse] = useState(null);
  const [verseImage, setVerseImage] = useState(null);

  // Load logged-in user
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        window.location.href = "/";
      } else {
        setUser(data.user);
      }
    }
    loadUser();
  }, []);

  // Generate Verse of the Day (once per day)
  useEffect(() => {
    async function initVerse() {
      const today = new Date().toISOString().split("T")[0];
      const saved = localStorage.getItem("verse-date");

      if (saved === today) {
        // load saved verse
        setVerse(JSON.parse(localStorage.getItem("verse-data")));
        setVerseImage(localStorage.getItem("verse-image"));
      } else {
        // pick a new verse
        const randomVerse = VERSES[Math.floor(Math.random() * VERSES.length)];
        setVerse(randomVerse);

        const img = await generateVerseImage(
          randomVerse.text,
          randomVerse.ref
        );
        setVerseImage(img);

        // store for entire day
        localStorage.setItem("verse-date", today);
        localStorage.setItem("verse-data", JSON.stringify(randomVerse));
        localStorage.setItem("verse-image", img);
      }
    }

    initVerse();
  }, []);

  if (!user) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/images/cross-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "20px",
        position: "relative",
      }}
    >
      {/* ──────────────────────────────── */}
      {/* FIXED PROFILE AVATAR (top-right) */}
      {/* ──────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 50,
        }}
      >
        <ProfileAvatar user={user} />
      </div>

      {/* ──────────────────────────────── */}
      {/* PAGE TITLE */}
      {/* ──────────────────────────────── */}
      <h1
        style={{
          fontSize: "32px",
          color: "white",
          textShadow: "0 2px 6px rgba(0,0,0,0.5)",
          marginBottom: "20px",
        }}
      >
        Welcome to your Dashboard
      </h1>

      {/* ──────────────────────────────── */}
      {/* 3-COLUMN LAYOUT */}
      {/* ──────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "20px",
        }}
      >
        {/* LEFT COLUMN */}
        <div>
          {/* ● VERSE OF THE DAY */}
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            }}
          >
            <h3>Verse of the Day</h3>

            {verse && (
              <>
                <p style={{ fontSize: "18px" }}>{verse.text}</p>
                <p style={{ opacity: 0.7 }}>{verse.ref}</p>
              </>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${verse.text}\n${verse.ref}`
                  )
                }
                className="btn btn-small"
              >
                Copy
              </button>

              <button
                className="btn btn-small"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Verse of the Day",
                      text: `${verse.text}\n${verse.ref}`,
                    });
                  } else {
                    alert("Sharing not supported on this device.");
                  }
                }}
              >
                Share
              </button>
            </div>
          </div>

          {/* ● VERSE IMAGE */}
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            }}
          >
            <h3>Verse Image</h3>

            {verseImage && (
              <img
                src={verseImage}
                alt="Verse"
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  marginBottom: "10px",
                }}
              />
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <a
                href={verseImage}
                download="verse.png"
                className="btn btn-small"
              >
                Download
              </a>

              <button
                className="btn btn-small"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Verse Image",
                      files: [],
                      url: verseImage,
                    });
                  } else {
                    alert("Sharing not supported on this device.");
                  }
                }}
              >
                Share
              </button>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN */}
        <div>
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              padding: "20px",
              borderRadius: "12px",
              height: "400px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            }}
          >
            <h3>Center Panel</h3>
            <p>This space is ready for prayer journals, notes, feeds, etc.</p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              padding: "20px",
              borderRadius: "12px",
              height: "400px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            }}
          >
            <h3>Right Panel</h3>
            <p>Upcoming features will be placed here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
