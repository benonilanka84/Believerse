"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function FellowshipsPage() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [joinedFellowships, setJoinedFellowships] = useState([]);

  // Sample fellowships data (will be replaced with database later)
  const allFellowships = [
    {
      id: 1,
      name: "Morning Prayer Warriors",
      description: "Join us every morning at 6 AM for prayer and devotion",
      category: "Prayer",
      members: 1247,
      image: "🙏",
      color: "#2e8b57"
    },
    {
      id: 2,
      name: "Youth Bible Study",
      description: "Weekly Bible study for young believers (18-30)",
      category: "Bible Study",
      members: 856,
      image: "📖",
      color: "#2d6be3"
    },
    {
      id: 3,
      name: "Worship & Praise",
      description: "Share worship songs and testimonies",
      category: "Worship",
      members: 2134,
      image: "🎵",
      color: "#d4af37"
    },
    {
      id: 4,
      name: "Family Ministry",
      description: "Support and encouragement for Christian families",
      category: "Family",
      members: 943,
      image: "👨‍👩‍👧‍👦",
      color: "#ff6b6b"
    },
    {
      id: 5,
      name: "Missionaries Network",
      description: "Connect with missionaries around the world",
      category: "Missions",
      members: 567,
      image: "🌍",
      color: "#4ecdc4"
    },
    {
      id: 6,
      name: "Women of Faith",
      description: "A community for women to grow in faith together",
      category: "Women",
      members: 1523,
      image: "👩",
      color: "#ff69b4"
    },
    {
      id: 7,
      name: "Men's Fellowship",
      description: "Brotherhood in Christ - Accountability & Growth",
      category: "Men",
      members: 1089,
      image: "👨",
      color: "#1e3a8a"
    },
    {
      id: 8,
      name: "Healing & Deliverance",
      description: "Testimonies of healing and breakthrough",
      category: "Healing",
      members: 2341,
      image: "✨",
      color: "#8b5cf6"
    }
  ];

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        loadJoinedFellowships(data.user.id);
      }
    }
    loadUser();
  }, []);

  function loadJoinedFellowships(userId) {
    const saved = localStorage.getItem(`fellowships_${userId}`);
    if (saved) {
      setJoinedFellowships(JSON.parse(saved));
    }
  }

  function handleJoin(fellowshipId) {
    if (!user) return;
    
    const newJoined = [...joinedFellowships, fellowshipId];
    setJoinedFellowships(newJoined);
    localStorage.setItem(`fellowships_${user.id}`, JSON.stringify(newJoined));
    alert("✅ Joined! You're now part of this fellowship.");
  }

  function handleLeave(fellowshipId) {
    if (!user) return;
    
    const newJoined = joinedFellowships.filter(id => id !== fellowshipId);
    setJoinedFellowships(newJoined);
    localStorage.setItem(`fellowships_${user.id}`, JSON.stringify(newJoined));
    alert("Left the fellowship.");
  }

  function isJoined(fellowshipId) {
    return joinedFellowships.includes(fellowshipId);
  }

  const filteredFellowships = allFellowships.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myFellowships = allFellowships.filter(f => joinedFellowships.includes(f.id));
  const discoverFellowships = filteredFellowships.filter(f => !joinedFellowships.includes(f.id));

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)",
        padding: "30px",
        borderRadius: "16px",
        color: "white",
        marginBottom: "30px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ margin: 0, fontSize: "2.2rem" }}>👥 Fellowships</h1>
        <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "1.1rem" }}>
          Join groups for Bible study, prayer, and spiritual growth
        </p>
      </div>

      {/* Search & Create */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        display: "flex",
        gap: "15px",
        alignItems: "center"
      }}>
        <input
          type="text"
          placeholder="🔍 Seek fellowships..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: "10px",
            border: "2px solid #e0e0e0",
            fontSize: "16px",
            outline: "none"
          }}
        />
        <button
          style={{
            padding: "12px 24px",
            background: "#2e8b57",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: "600",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
          onClick={() => alert("Create Fellowship feature coming soon!")}
        >
          ➕ Create Fellowship
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "10px",
        marginBottom: "20px",
        display: "flex",
        gap: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <button
          onClick={() => setActiveTab("discover")}
          style={{
            flex: 1,
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            background: activeTab === "discover" ? "#2e8b57" : "transparent",
            color: activeTab === "discover" ? "white" : "#666",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          🌟 Discover ({discoverFellowships.length})
        </button>
        <button
          onClick={() => setActiveTab("joined")}
          style={{
            flex: 1,
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            background: activeTab === "joined" ? "#2e8b57" : "transparent",
            color: activeTab === "joined" ? "white" : "#666",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          ✓ My Fellowships ({myFellowships.length})
        </button>
      </div>

      {/* Fellowships Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "20px"
      }}>
        {(activeTab === "discover" ? discoverFellowships : myFellowships).map((fellowship) => (
          <div
            key={fellowship.id}
            style={{
              background: "white",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
            }}
          >
            {/* Header with Icon */}
            <div style={{
              background: fellowship.color,
              padding: "30px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "4rem", marginBottom: "10px" }}>
                {fellowship.image}
              </div>
              <div style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.2)",
                padding: "4px 12px",
                borderRadius: "12px",
                color: "white",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                {fellowship.category}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: "20px" }}>
              <h3 style={{
                margin: "0 0 10px 0",
                color: "#0b2e4a",
                fontSize: "1.3rem"
              }}>
                {fellowship.name}
              </h3>
              
              <p style={{
                margin: "0 0 15px 0",
                color: "#666",
                fontSize: "14px",
                lineHeight: "1.5"
              }}>
                {fellowship.description}
              </p>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "15px",
                paddingTop: "15px",
                borderTop: "1px solid #eee"
              }}>
                <span style={{ color: "#666", fontSize: "14px" }}>
                  👥 {fellowship.members.toLocaleString()} members
                </span>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  if (isJoined(fellowship.id)) {
                    handleLeave(fellowship.id);
                  } else {
                    handleJoin(fellowship.id);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  background: isJoined(fellowship.id) ? "#f0f0f0" : fellowship.color,
                  color: isJoined(fellowship.id) ? "#666" : "white",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {isJoined(fellowship.id) ? "✓ Joined" : "➕ Join Fellowship"}
              </button>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {(activeTab === "discover" ? discoverFellowships : myFellowships).length === 0 && (
          <div style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            padding: "60px 20px",
            color: "#666"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "20px" }}>
              {activeTab === "discover" ? "🔍" : "👥"}
            </div>
            <h3 style={{ color: "#0b2e4a", marginBottom: "10px" }}>
              {activeTab === "discover" 
                ? "No fellowships found" 
                : "You haven't joined any fellowships yet"}
            </h3>
            <p>
              {activeTab === "discover"
                ? "Try a different search"
                : "Discover and join fellowships to grow with other believers"}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}