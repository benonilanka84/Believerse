// app/dashboard/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("bv_user") || "null");
    if (!u) router.replace("/");
    else setUser(u);
  }, []);

  const verse = {
    text: "I can do all things through Christ who strengthens me.",
    ref: "Philippians 4:13",
    img: "/images/verse-bg-small.jpg" // optional smaller image, else reuse cross-bg.jpg
  };

  const shareWhatsApp = () => {
    const message = `${verse.text} — ${verse.ref}\n\nhttps://believerse.vercel.app/`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Welcome, {user?.email}</h2>

      <section className="verse-box" style={{ marginTop: 16, maxWidth: 720 }}>
        <img src="/images/cross-bg.jpg" alt="verse" style={{ width: "100%", borderRadius: 8, opacity:0.95 }} />
        <div style={{ marginTop: 12 }}>
          <h3 style={{ margin: 0 }}>{verse.text}</h3>
          <p style={{ marginTop: 6, color: "#666" }}>{verse.ref}</p>
          <button className="btn" onClick={shareWhatsApp} style={{ marginTop: 10 }}>Share to WhatsApp</button>
        </div>
      </section>
    </div>
  );
}
