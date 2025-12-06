"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function PrayerWallPage() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [prayers, setPrayers] = useState([]);
  const [myPrayers, setMyPrayers] = useState([]);
  
  const [newPrayer, setNewPrayer] = useState({
    title: "",
    description: "",
    category: "General"
  });

  const categories = [
    { value: "General", icon: "🙏", color: "#2e8b57" },
    { value: "Healing", icon: "✨", color: "#8b5cf6" },
    { value: "Family", icon: "👨‍👩‍👧‍👦", color: "#ff6b6b" },
    { value: "Finance", icon: "💰", color: "#d4af37" },
    { value: "Career", icon: "💼", color: "#2d6be3" },
    { value: "Relationships", icon: "❤️", color: "#ff69b4" },
    { value: "Guidance", icon: "🧭", color: "#4ecdc4" },
    { value: "Thanksgiving", icon: "🎉", color: "#ffa500" }
  ];

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        loadPrayers(data.user.id);
      }
    }
    loadUser();
  }, []);

  function loadPrayers(userId) {
    // Load from localStorage (will be replaced with database later)
    const allPrayers = JSON.parse(localStorage.getItem("prayers") || "[]");
    setPrayers(allPrayers);
    
    const userPrayers = allPrayers.filter(p => p.userId === userId);
    setMyPrayers(userPrayers);
  }

  function handleSubmitPrayer(e) {
    e.preventDefault();
    
    if (!newPrayer.title.trim()) {
      alert("Please enter a prayer title");
      return;
    }

    const prayer = {
      id: Date.now(),
      userId: user.id,
      userName: user.email.split('@')[0],
      ...newPrayer,
      createdAt: new Date().toISOString(),
      prayingCount: 0,
      prayingUsers: [],
      answered: false,
      comments: []
    };

    const allPrayers = [...prayers, prayer];
    localStorage.setItem("prayers", JSON.stringify(allPrayers));
    setPrayers(allPrayers);
    setMyPrayers([...myPrayers, prayer]);
    
    setNewPrayer({ title: "", description: "", category: "General" });
    setShowCreateForm(false);
    alert("✅ Prayer request posted! Believers will pray for you.");
  }

  function handlePray(prayerId) {
    if (!user) return;

    const updated = prayers.map(p => {
      if (p.id === prayerId) {
        const alreadyPraying = p.prayingUsers?.includes(user.id);
        
        if (alreadyPraying) {
          return {
            ...p,
            prayingCount: p.prayingCount - 1,
            prayingUsers: p.prayingUsers.filter(id => id !== user.id)
          };
        } else {
          return {
            ...p,
            prayingCount: p.prayingCount + 1,
            prayingUsers: [...(p.prayingUsers || []), user.id]
          };
        }
      }
      return p;
    });

    localStorage.setItem("prayers", JSON.stringify(updated));
    setPrayers(updated);
  }

  function isPraying(prayer) {
    return prayer.prayingUsers?.includes(user?.id);
  }

  function markAsAnswered(prayerId) {
    const updated = prayers.map(p => 
      p.id === prayerId ? { ...p, answered: true } : p
    );
    localStorage.setItem("prayers", JSON.stringify(updated));
    setPrayers(updated);
    alert("🎉 Praise God! Prayer marked as answered!");
  }

  const displayPrayers = activeTab === "my" ? myPrayers : prayers;
  const answeredPrayers = displayPrayers.filter(p => p.answered);
  const activePrayers = displayPrayers.filter(p => !p.answered);

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
        <h1 style={{ margin: 0, fontSize: "2.2rem" }}>🙏 Prayer Wall</h1>
        <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "1.1rem" }}>
          Share prayer requests and pray for others
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "15px",
        marginBottom: "20px"
      }}>
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "5px" }}>🙏</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2e8b57" }}>
            {activePrayers.length}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>Active Prayers</div>
        </div>
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "5px" }}>🎉</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#d4af37" }}>
            {answeredPrayers.length}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>Answered</div>
        </div>
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "5px" }}>👥</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2d6be3" }}>
            {prayers.reduce((sum, p) => sum + p.prayingCount, 0)}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>Total Prayers</div>
        </div>
      </div>

      {/* Create Prayer Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            width: "100%",
            padding: "15px",
            background: "#2e8b57",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            marginBottom: "20px",
            boxShadow: "0 4px 12px rgba(46,139,87,0.2)"
          }}
        >
          ➕ Share a Prayer Request
        </button>
      )}

      {/* Create Prayer Form */}
      {showCreateForm && (
        <div style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{ marginTop: 0, color: "#0b2e4a" }}>Share Your Prayer Request</h3>
          
          <form onSubmit={handleSubmitPrayer}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#333" }}>
                Prayer Title
              </label>
              <input
                type="text"
                value={newPrayer.title}
                onChange={(e) => setNewPrayer({...newPrayer, title: e.target.value})}
                placeholder="Brief summary of your prayer need..."
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "14px"
                }}
                required
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#333" }}>
                Category
              </label>
              <select
                value={newPrayer.category}
                onChange={(e) => setNewPrayer({...newPrayer, category: e.target.value})}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "14px"
                }}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.value}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#333" }}>
                Description (Optional)
              </label>
              <textarea
                value={newPrayer.description}
                onChange={(e) => setNewPrayer({...newPrayer, description: e.target.value})}
                placeholder="Share more details..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#2e8b57",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                🙏 Post Prayer Request
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: "12px 24px",
                  background: "#f0f0f0",
                  color: "#666",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
          onClick={() => setActiveTab("all")}
          style={{
            flex: 1,
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            background: activeTab === "all" ? "#2e8b57" : "transparent",
            color: activeTab === "all" ? "white" : "#666",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          🌍 All Prayers ({prayers.length})
        </button>
        <button
          onClick={() => setActiveTab("my")}
          style={{
            flex: 1,
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            background: activeTab === "my" ? "#2e8b57" : "transparent",
            color: activeTab === "my" ? "white" : "#666",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          📝 My Prayers ({myPrayers.length})
        </button>
      </div>

      {/* Prayers List */}
      <div style={{
        display: "grid",
        gap: "15px"
      }}>
        {displayPrayers.map((prayer) => {
          const category = categories.find(c => c.value === prayer.category) || categories[0];
          
          return (
            <div
              key={prayer.id}
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                borderLeft: `4px solid ${category.color}`
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                <div>
                  <div style={{
                    display: "inline-block",
                    background: category.color,
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    marginBottom: "10px"
                  }}>
                    {category.icon} {prayer.category}
                  </div>
                  <h3 style={{ margin: "5px 0", color: "#0b2e4a" }}>
                    {prayer.title}
                  </h3>
                  <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>
                    By {prayer.userName} • {new Date(prayer.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                {prayer.answered && (
                  <div style={{
                    background: "#d4af37",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    🎉 Answered
                  </div>
                )}
              </div>

              {prayer.description && (
                <p style={{ color: "#333", lineHeight: "1.6", marginBottom: "15px" }}>
                  {prayer.description}
                </p>
              )}

              <div style={{
                display: "flex",
                gap: "10px",
                borderTop: "1px solid #eee",
                paddingTop: "15px"
              }}>
                <button
                  onClick={() => handlePray(prayer.id)}
                  style={{
                    padding: "10px 20px",
                    background: isPraying(prayer) ? "#2e8b57" : "#f0f0f0",
                    color: isPraying(prayer) ? "white" : "#666",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  🙏 {isPraying(prayer) ? "Praying" : "I'll Pray"} ({prayer.prayingCount})
                </button>

                {!prayer.answered && prayer.userId === user?.id && (
                  <button
                    onClick={() => markAsAnswered(prayer.id)}
                    style={{
                      padding: "10px 20px",
                      background: "#d4af37",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    ✓ Mark as Answered
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {displayPrayers.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#666"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "20px" }}>🙏</div>
            <h3 style={{ color: "#0b2e4a", marginBottom: "10px" }}>
              No prayer requests yet
            </h3>
            <p>Be the first to share a prayer request!</p>
          </div>
        )}
      </div>

    </div>
  );
}