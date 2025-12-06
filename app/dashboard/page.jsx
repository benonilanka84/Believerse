"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CreatePost from "@/components/CreatePost";
import "@/styles/dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [verse, setVerse] = useState(null);
  const [verseImage, setVerseImage] = useState(null);
  const [posts, setPosts] = useState([]);

  const VERSE_KEY = "dailyVerse";
  const VERSE_DATE_KEY = "dailyVerseDate";

  const bibleVerses = [
    { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
    { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
    { text: "Trust in the Lord with all your heart.", ref: "Proverbs 3:5" },
    { text: "Be strong and courageous. Do not be afraid.", ref: "Joshua 1:9" },
    { text: "For God so loved the world that he gave his one and only Son.", ref: "John 3:16" },
    { text: "I am the way, the truth, and the life.", ref: "John 14:6" }
  ];

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

  useEffect(() => {
    supabase.auth.getUser().then((res) => {
      if (res?.data?.user) {
        setUser(res.data.user);
        loadPosts();
      }
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

  function loadPosts() {
    const savedPosts = JSON.parse(localStorage.getItem("posts") || "[]");
    setPosts(savedPosts);
  }

  function handlePostCreated(newPost) {
    setPosts([newPost, ...posts]);
  }

  function handleAmen(postId) {
    if (!user) return;

    const updated = posts.map(p => {
      if (p.id === postId) {
        const hasAmened = p.amenUsers?.includes(user.id);
        
        if (hasAmened) {
          return {
            ...p,
            amens: p.amens - 1,
            amenUsers: p.amenUsers.filter(id => id !== user.id)
          };
        } else {
          return {
            ...p,
            amens: p.amens + 1,
            amenUsers: [...(p.amenUsers || []), user.id]
          };
        }
      }
      return p;
    });

    localStorage.setItem("posts", JSON.stringify(updated));
    setPosts(updated);
  }

  function hasAmened(post) {
    return post.amenUsers?.includes(user?.id);
  }

  function getPostTypeColor(type) {
    const colors = {
      testimony: "#2e8b57",
      verse: "#2d6be3",
      prayer: "#8b5cf6",
      praise: "#d4af37",
      question: "#ff6b6b"
    };
    return colors[type] || "#2e8b57";
  }

  function getPostTypeIcon(type) {
    const icons = {
      testimony: "💬",
      verse: "📖",
      prayer: "🙏",
      praise: "🎉",
      question: "❓"
    };
    return icons[type] || "💬";
  }

  function copyText() {
    navigator.clipboard.writeText(`${verse.text} — ${verse.ref}`);
    alert("Copied!");
  }

  function shareText() {
    if (!navigator.share) return alert("Sharing not supported.");
    navigator.share({ title: "Verse of the Day", text: `${verse.text} — ${verse.ref}` });
  }

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

  return (
    <div className="dashboard-wrapper">
      
      {/* Welcome Banner */}
      <div style={{
        background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)",
        padding: "20px 30px",
        borderRadius: "12px",
        color: "white",
        marginBottom: "20px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ margin: 0, fontSize: "1.8rem" }}>
          🏠 Welcome to The Walk
        </h2>
        <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>
          Your daily walk with God and believers
        </p>
      </div>

      <div className="dashboard-grid">

        {/* LEFT */}
        <div className="left-panel">
          <div className="panel-card">
            <h3>📖 Verse of the Day</h3>
            {verse && (
              <p className="verse-text">
                "{verse.text}"
                <br />
                <span className="verse-ref">— {verse.ref}</span>
              </p>
            )}
            <div className="btn-row">
              <button className="btn" onClick={copyText}>Copy</button>
              <button className="btn" onClick={shareText}>📢 Spread</button>
            </div>
          </div>

          <div className="panel-card verse-image-panel">
            <h3>🖼️ Verse Image</h3>
            <div className="verse-image-box">
              <div className="verse-image" dangerouslySetInnerHTML={{ __html: verseImage }} />
            </div>

            <div className="btn-row">
              <button className="btn" onClick={downloadPNG}>Download</button>
              <button className="btn" onClick={shareImage}>📢 Spread</button>
            </div>
          </div>
        </div>

        {/* CENTER - The Walk Feed */}
        <div className="center-panel">
          
          {/* CREATE POST COMPONENT */}
          {user && <CreatePost user={user} onPostCreated={handlePostCreated} />}

          {/* POSTS FEED */}
          <div className="panel-card">
            <h3>🏠 Your Walk</h3>
            <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>
              Posts from believers you're connected with
            </p>

            {/* Display User Posts */}
            {posts.map((post) => (
              <div
                key={post.id}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "15px",
                  marginBottom: "15px",
                  background: "#fafafa",
                  borderLeft: `4px solid ${getPostTypeColor(post.type)}`
                }}
              >
                <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #2e8b57, #1d5d3a)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    marginRight: "10px"
                  }}>
                    {post.userName[0].toUpperCase()}
                  </div>
                  <div>
                    <strong>{post.userName}</strong>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {new Date(post.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    marginLeft: "auto",
                    background: getPostTypeColor(post.type),
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    {getPostTypeIcon(post.type)} {post.type}
                  </div>
                </div>

                {post.title && (
                  <h4 style={{ margin: "10px 0 5px 0", color: "#0b2e4a" }}>
                    {post.title}
                  </h4>
                )}

                <p style={{ margin: "10px 0", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  {post.content}
                </p>

                {post.verse && (
                  <div style={{
                    background: "#f0f7ff",
                    padding: "10px",
                    borderRadius: "8px",
                    marginTop: "10px",
                    borderLeft: "3px solid #2d6be3"
                  }}>
                    <small style={{ color: "#2d6be3", fontWeight: "600" }}>
                      📖 {post.verse}
                    </small>
                  </div>
                )}

                <div style={{
                  display: "flex",
                  gap: "15px",
                  borderTop: "1px solid #e0e0e0",
                  paddingTop: "10px",
                  marginTop: "10px"
                }}>
                  <button
                    onClick={() => handleAmen(post.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: hasAmened(post) ? "#2e8b57" : "#666",
                      fontWeight: hasAmened(post) ? "600" : "normal",
                      fontSize: "14px"
                    }}
                  >
                    🙏 Amen ({post.amens})
                  </button>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: "14px" }}>
                    💬 Comment ({post.comments?.length || 0})
                  </button>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: "14px" }}>
                    📢 Spread
                  </button>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {posts.length === 0 && (
              <div style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#666"
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>📝</div>
                <h4 style={{ color: "#0b2e4a", marginBottom: "8px" }}>
                  No posts yet
                </h4>
                <p style={{ fontSize: "14px" }}>
                  Be the first to share your testimony!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="right-panel">
          <div className="panel-card">
            <h3>🤝 Suggested Believers</h3>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
              Connect with these believers
            </p>
            
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid #eee"
              }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    width: "35px",
                    height: "35px",
                    borderRadius: "50%",
                    background: "#2e8b57",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "bold",
                    marginRight: "10px"
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <div>
                    <strong style={{ fontSize: "14px" }}>Believer {i}</strong>
                    <div style={{ fontSize: "12px", color: "#666" }}>Faith Community</div>
                  </div>
                </div>
                <button className="btn" style={{ padding: "6px 12px", fontSize: "12px" }}>
                  ➕ Connect
                </button>
              </div>
            ))}
          </div>

          <div className="panel-card" style={{ background: "#fff9e6", borderLeft: "4px solid #d4af37" }}>
            <h3>🙏 Prayer Request</h3>
            <p style={{ fontSize: "14px", marginBottom: "10px" }}>
              "Please pray for my job interview tomorrow"
            </p>
            <small style={{ color: "#666" }}>— Sarah L.</small>
            <button className="btn" style={{ width: "100%", marginTop: "10px", background: "#2e8b57", color: "white" }}>
              🙏 I'll Pray
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}