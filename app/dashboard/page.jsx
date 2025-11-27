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

  /** ******************************************************
   * SVG GENERATOR
   *********************************************************/
  function generateVerseImage(verseText, reference) {
    const safeVerse = (verseText || "").replace(/`/g, "\\`");
    const safeRef = (reference || "").replace(/`/g, "\\`");

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
        <image href="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
          width="600" height="900" preserveAspectRatio="xMidYMid slice" />
        <rect width="600" height="900" fill="rgba(0,0,0,0.35)" />

        <foreignObject x="60" y="260" width="480" height="340">
          <div xmlns="http://www.w3.org/1999/xhtml"
            style="font-size:38px;font-family:Georgia;color:white;text-align:center;line-height:1.35;text-shadow:0px 3px 12px rgba(0,0,0,0.45);">
            ${safeVerse}
          </div>
        </foreignObject>

        <text x="50%" y="620" text-anchor="middle" fill="white" font-size="30" font-family="Georgia">
          — ${safeRef}
        </text>
      </svg>
    `;
  }

  /** ******************************************************
   * INITIAL LOAD
   *********************************************************/
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

  /** ******************************************************
   * COPY & SHARE TEXT
   *********************************************************/
  function copyText() {
    navigator.clipboard.writeText(`${verse.text} — ${verse.ref}`);
    alert("Copied!");
  }

  function shareText() {
    if (!navigator.share) return alert("Sharing not supported.");
    navigator.share({ title: "Verse of the Day", text: `${verse.text} — ${verse.ref}` });
  }

  /** ******************************************************
   * IMAGE DOWNLOAD + SHARE
   *********************************************************/
  function getTodayFilename() {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}${d.getFullYear()} verse.png`;
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

  async function downloadPNG() {
    try {
      const svgBlob = new Blob([verseImage], { type: "image/svg+xml" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const pngBlob = await convertSVGtoPNG(svgUrl);

      const link = document.createElement("a");
      link.href = URL.createObjectURL(pngBlob);
      link.download = getTodayFilename();
      link.click();
    } catch (err) {
      console.error(err);
      alert("Download failed.");
    }
  }

  async function shareImage() {
    try {
      const svgBlob = new Blob([verseImage], { type: "image/svg+xml" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const pngBlob = await convertSVGtoPNG(svgUrl);

      if (!navigator.share) return alert("Sharing not supported.");

      await navigator.share({
        title: "Verse Image",
        files: [new File([pngBlob], "verse.png", { type: "image/png" })],
      });
    } catch (err) {
      console.error(err);
      alert("Share failed.");
    }
  }

  /** ******************************************************
   * RENDER (FIXED)
   *********************************************************/
  return (
    <div className="dashboard-wrapper">

      {/* HEADER */}
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <img src="/images/Final Logo.png" alt="The Believerse Logo" />
          <span className="logo-text">The Believerse</span>
        </div>

        <ProfileAvatar user={user} />
      </div>

      {/* GRID */}
      <div className="dashboard-grid">

        {/* LEFT */}
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
              <div className="verse-image" dangerouslySetInnerHTML={{ __html: verseImage }} />
            </div>

            <div className="btn-row">
              <button className="btn" onClick={downloadPNG}>Download</button>
              <button className="btn" onClick={shareImage}>Share</button>
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div className="center-panel">
          <div className="panel-card">
            <h3>Center Panel</h3>
            <p>This area will show the user’s feed.</p>
          </div>
        </div>

        {/* RIGHT */}
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
