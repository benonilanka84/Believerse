// app/dashboard/page.jsx
"use client";

import { useState, useEffect } from "react";

export default function Dashboard() {
  const [verse, setVerse] = useState({
    text: "I can do all things through Christ who strengthens me.",
    ref: "Philippians 4:13",
    image: "/images/cross-bg.jpg"
  });

  function shareWhatsApp() {
    const text = `${verse.text} — ${verse.ref}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  async function nativeShare() {
    const shareData = { title: "Verse of the Day", text: `${verse.text} — ${verse.ref}` };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) { console.warn(e); }
    } else {
      alert("Your browser doesn't support native share — try Whatsapp share.");
    }
  }

  return (
    <div style={{ padding: 28 }}>
      <h2>Welcome to your Dashboard</h2>

      <section style={{ marginTop: 16, display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <h3>Verse of the Day</h3>
          <p style={{ fontStyle: "italic" }}>{verse.text} — <strong>{verse.ref}</strong></p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={shareWhatsApp}>Share to WhatsApp</button>
            <button className="btn" onClick={nativeShare}>Share (native)</button>
          </div>
        </div>
        <div style={{ width: 220 }}>
          <img src={verse.image} alt="Verse image" style={{ width: "100%", borderRadius: 8 }} />
        </div>
      </section>
    </div>
  );
}
