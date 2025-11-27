"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProfileAvatar from "@/components/ProfileAvatar";
import "@/styles/dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [verse, setVerse] = useState(null);
  const [verseImage, setVerseImage] = useState(null);

  const VERSE_KEY = "dailyVerse";
  const VERSE_DATE_KEY = "dailyVerseDate";

  const bibleVerses = [
    { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
    { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
    { text: "Trust in the Lord with all your heart.", ref: "Proverbs 3:5" },
    { text: "Be strong and courageous. Do not be afraid.", ref: "Joshua 1:9" }
  ];

  /** ********************************************
   * CENTERED + SAFE + CANVAS-COMPATIBLE SVG
   ********************************************* */
function generateVerseImage(verseText, reference) {
  const text = typeof verseText === "string" ? verseText : "";
  const ref = typeof reference === "string" ? reference : "";

  const safeVerse = text.replace(/`/g, "\\`");
  const safeRef = ref.replace(/`/g, "\\`");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">

      <!-- Background Image -->
      <image
        href="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
        width="600"
        height="900"
        preserveAspectRatio="xMidYMid slice"
      />

      <!-- Soft vignette overlay -->
      <rect width="600" height="900" fill="rgba(0,0,0,0.35)" />

      <!-- Light glow center -->
      <radialGradient id="softGlow" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.35)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0)" />
      </radialGradient>

      <rect width="600" height="900" fill="url(#softGlow)" />

      <!-- Verse Text -->
      <foreignObject x="60" y="260" width="480" height="340">
        <div xmlns="http://www.w3.org/1999/xhtml"
          style="
            font-size:38px;
            font-family: 'Georgia', serif;
            font-weight: 500;
            color: white;
            text-align: center;
            line-height: 1.35;
            text-shadow: 0px 3px 12px rgba(0,0,0,0.45);
          ">
          ${safeVerse}
        </div>
      </foreignObject>

      <!-- Reference -->
      <text
        x="50%"
        y="620"
        text-anchor="middle"
        fill="rgba(255,255,255,0.9)"
        font-size="30"
        font-family="Georgia"
        style="text-shadow: 0px 3px 10px rgba(0,0,0,0.4);"
      >
        — ${safeRef}
      </text>

      <!-- Gold bottom border -->
      <rect x="150" y="780" width="300" height="3" fill="#d8c16f" rx="2" />
    </svg>
  `;
}

  /** ********************************************
   * DAILY VERSE / USER LOGIC
   ********************************************* */
  useEffect(() => {
    supabase.auth.getUser().then((res) => {
      if (res?.data?.user) setUser(res.data.user);
    });

    const today = new Date().toISOString().split("T")[0];
    const storedDate = localStorage.getItem(VERSE_DATE_KEY);
    const storedVerse = localStorage.getItem(VERSE_KEY);

    if (storedDate === today && storedVerse) {
      const parsed = JSON.parse(storedVerse);
      setVerse(parsed);
      setVerseImage(generateVerseImage(parsed.text, parsed.ref));
    } else {
      const random = bibleVerses[Math.floor(Math.random() * bibleVerses.length)];

      localStorage.setItem(VERSE_KEY, JSON.stringify(random));
      localStorage.setItem(VERSE_DATE_KEY, today);

      setVerse(random);
      setVerseImage(generateVerseImage(random.text, random.ref));
    }
  }, []);

  /** ********************************************
   * TEXT SHARE / COPY
   ********************************************* */
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

  /** ********************************************
   * DOWNLOAD & SHARE IMAGE
   ********************************************* */

function getTodayFilename() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}${dd}${yyyy} verse.png`;
}

async function downloadPNG() {
  try {
    const blob = new Blob([verseImage], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const pngBlob = await convertSVGtoPNG(url);

    const link = document.createElement("a");
    link.href = URL.createObjectURL(pngBlob);
    link.download = getTodayFilename(); // ← includes date
    link.click();

    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Unable to download the image.");
  }
}

  async function shareImage() {
    try {
      const svgBlob = new Blob([verseImage], { type: "image/svg+xml" });
      const svgURL = URL.createObjectURL(svgBlob);

      const pngBlob = await convertSVGtoPNG(svgURL);

      if (navigator.share) {
        await navigator.share({
          title: "Verse Image",
          files: [new File([pngBlob], "verse.png", { type: "image/png" })],
        });
      } else {
        alert("Sharing not supported on this device.");
      }

      URL.revokeObjectURL(svgURL);
    } catch (error) {
      console.error(error);
      alert("Unable to share image.");
    }
  }

  function convertSVGtoPNG(svgURL) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, 1080, 1350);

        canvas.toBlob((blob) => resolve(blob), "image/png");
      };
      img.src = svgURL;
    });
  }

  /** ********************************************
   * RENDER
   ********************************************* */
  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1>Welcome to your Dashboard</h1>
        <ProfileAvatar user={user} />
      </div>

      <div className="dashboard-grid">

        {/* LEFT PANEL */}
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

        {/* CENTER PANEL */}
        <div className="center-panel">
          <div className="panel-card">
            <h3>Center Panel</h3>
            <p>This area will show the user’s feed.</p>
          </div>
        </div>

        {/* RIGHT PANEL */}
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
