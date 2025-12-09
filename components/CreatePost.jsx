"use client";

import { useState } from "react";

export default function CreatePost({ user, onPostCreated }) {
  const [showForm, setShowForm] = useState(false);
  const [postType, setPostType] = useState("testimony");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [verse, setVerse] = useState("");
  const [mediaType, setMediaType] = useState("none");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const postTypes = [
    { value: "testimony", label: "Testimony", icon: "💬", color: "#2e8b57" },
    { value: "verse", label: "Scripture", icon: "📖", color: "#2d6be3" },
    { value: "prayer", label: "Prayer Request", icon: "🙏", color: "#8b5cf6" },
    { value: "praise", label: "Praise Report", icon: "🎉", color: "#d4af37" },
    { value: "question", label: "Question", icon: "❓", color: "#ff6b6b" }
  ];

  async function handleMediaUpload(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (type === "image" && !file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (type === "video" && !file.type.startsWith("video/")) {
      alert("Please select a video file");
      return;
    }

    // Check file size (max 50MB for video, 5MB for image)
    const maxSize = type === "video" ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File too large. Max size: ${type === "video" ? "50MB" : "5MB"}`);
      return;
    }

    setUploading(true);

    try {
      // For now, we'll use a temporary URL
      // In production, upload to Supabase Storage
      const tempUrl = URL.createObjectURL(file);
      setMediaUrl(tempUrl);
      setMediaType(type);
      
      // TODO: Replace with actual Supabase upload
      /*
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from(type === "image" ? "post-images" : "post-videos")
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from(type === "image" ? "post-images" : "post-videos")
        .getPublicUrl(fileName);
      
      setMediaUrl(urlData.publicUrl);
      setMediaType(type);
      */
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!content.trim()) {
      alert("Please write something to share");
      return;
    }

    const post = {
      id: Date.now(),
      userId: user.id,
      userName: user.email.split('@')[0],
      userAvatar: null,
      type: postType,
      title: title,
      content: content,
      verse: verse,
      mediaType: mediaType,
      mediaUrl: mediaUrl,
      createdAt: new Date().toISOString(),
      amens: 0,
      amenUsers: [],
      comments: [],
      shares: 0
    };

    // Save to localStorage (will be replaced with database later)
    if (typeof window !== 'undefined') {
      const posts = JSON.parse(localStorage.getItem("posts") || "[]");
      posts.unshift(post);
      localStorage.setItem("posts", JSON.stringify(posts));
    }

    // Reset form
    setContent("");
    setTitle("");
    setVerse("");
    setMediaType("none");
    setMediaUrl("");
    setShowForm(false);

    // Notify parent component
    if (onPostCreated) {
      onPostCreated(post);
    }

    alert("✅ Posted! Your testimony is now shared with believers.");
  }

  function removeMedia() {
    setMediaType("none");
    setMediaUrl("");
  }

  if (!showForm) {
    return (
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        marginBottom: "20px"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "15px"
        }}>
          <div style={{
            width: "45px",
            height: "45px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #2e8b57, #1d5d3a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "20px",
            fontWeight: "bold"
          }}>
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>

          <button
            onClick={() => setShowForm(true)}
            style={{
              flex: 1,
              padding: "12px 20px",
              background: "#f5f5f5",
              border: "1px solid #e0e0e0",
              borderRadius: "25px",
              textAlign: "left",
              color: "#666",
              fontSize: "15px",
              cursor: "pointer"
            }}
          >
            What's on your heart today?
          </button>
        </div>

        <div style={{
          display: "flex",
          gap: "10px",
          marginTop: "15px",
          paddingTop: "15px",
          borderTop: "1px solid #eee"
        }}>
          <button
            onClick={() => {
              setPostType("testimony");
              setShowForm(true);
            }}
            style={{
              flex: 1,
              padding: "10px",
              background: "transparent",
              border: "none",
              color: "#2e8b57",
              fontWeight: "600",
              cursor: "pointer",
              borderRadius: "8px",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.background = "#f0fff4"}
            onMouseLeave={(e) => e.target.style.background = "transparent"}
          >
            💬 Testimony
          </button>
          <button
            onClick={() => {
              setPostType("verse");
              setShowForm(true);
            }}
            style={{
              flex: 1,
              padding: "10px",
              background: "transparent",
              border: "none",
              color: "#2d6be3",
              fontWeight: "600",
              cursor: "pointer",
              borderRadius: "8px"
            }}
            onMouseEnter={(e) => e.target.style.background = "#f0f7ff"}
            onMouseLeave={(e) => e.target.style.background = "transparent"}
          >
            📖 Scripture
          </button>
          <button
            onClick={() => {
              setPostType("prayer");
              setShowForm(true);
            }}
            style={{
              flex: 1,
              padding: "10px",
              background: "transparent",
              border: "none",
              color: "#8b5cf6",
              fontWeight: "600",
              cursor: "pointer",
              borderRadius: "8px"
            }}
            onMouseEnter={(e) => e.target.style.background = "#faf5ff"}
            onMouseLeave={(e) => e.target.style.background = "transparent"}
          >
            🙏 Prayer
          </button>
        </div>
      </div>
    );
  }

  const currentType = postTypes.find(t => t.value === postType) || postTypes[0];

  return (
    <div style={{
      background: "white",
      padding: "25px",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      marginBottom: "20px"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
      }}>
        <h3 style={{ margin: 0, color: "#0b2e4a" }}>
          {currentType.icon} Create Post
        </h3>
        <button
          onClick={() => setShowForm(false)}
          style={{
            background: "transparent",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#999"
          }}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Post Type Selector */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "600",
            color: "#333",
            fontSize: "14px"
          }}>
            Post Type
          </label>
          <div style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap"
          }}>
            {postTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setPostType(type.value)}
                style={{
                  padding: "8px 16px",
                  border: postType === type.value ? `2px solid ${type.color}` : "1px solid #e0e0e0",
                  borderRadius: "20px",
                  background: postType === type.value ? `${type.color}15` : "white",
                  color: postType === type.value ? type.color : "#666",
                  fontWeight: postType === type.value ? "600" : "normal",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.2s"
                }}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title (Optional) */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "600",
            color: "#333",
            fontSize: "14px"
          }}>
            Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your post a title..."
            style={{
              width: "100%",
              padding: "10px 15px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none"
            }}
          />
        </div>

        {/* Content */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "600",
            color: "#333",
            fontSize: "14px"
          }}>
            What's on your heart?
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your testimony, prayer, or encouragement..."
            rows={6}
            style={{
              width: "100%",
              padding: "12px 15px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "15px",
              resize: "vertical",
              outline: "none",
              lineHeight: "1.6"
            }}
            required
          />
        </div>

        {/* Scripture Reference (if Scripture type) */}
        {postType === "verse" && (
          <div style={{ marginBottom: "15px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#333",
              fontSize: "14px"
            }}>
              Scripture Reference
            </label>
            <input
              type="text"
              value={verse}
              onChange={(e) => setVerse(e.target.value)}
              placeholder="e.g. John 3:16"
              style={{
                width: "100%",
                padding: "10px 15px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>
        )}

        {/* Media Upload */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "600",
            color: "#333",
            fontSize: "14px"
          }}>
            Add Media (Optional)
          </label>
          
          {mediaType === "none" ? (
            <div style={{ display: "flex", gap: "10px" }}>
              <label style={{
                flex: 1,
                padding: "12px",
                background: "#f0f7ff",
                color: "#2d6be3",
                border: "2px dashed #2d6be3",
                borderRadius: "8px",
                textAlign: "center",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px"
              }}>
                📷 Add Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMediaUpload(e, "image")}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
              </label>
              
              <label style={{
                flex: 1,
                padding: "12px",
                background: "#fff0f5",
                color: "#ff6b6b",
                border: "2px dashed #ff6b6b",
                borderRadius: "8px",
                textAlign: "center",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px"
              }}>
                🎥 Add Video
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleMediaUpload(e, "video")}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
              </label>
            </div>
          ) : (
            <div style={{
              position: "relative",
              border: "2px solid #e0e0e0",
              borderRadius: "8px",
              padding: "10px",
              background: "#f9f9f9"
            }}>
              {mediaType === "image" && (
                <img
                  src={mediaUrl}
                  alt="Upload preview"
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    objectFit: "contain",
                    borderRadius: "8px"
                  }}
                />
              )}
              
              {mediaType === "video" && (
                <video
                  src={mediaUrl}
                  controls
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    borderRadius: "8px"
                  }}
                />
              )}
              
              <button
                type="button"
                onClick={removeMedia}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "rgba(0,0,0,0.7)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  fontSize: "20px"
                }}
              >
                ×
              </button>
            </div>
          )}
          
          {uploading && (
            <div style={{
              marginTop: "10px",
              padding: "10px",
              background: "#f0f7ff",
              borderRadius: "8px",
              textAlign: "center",
              color: "#2d6be3",
              fontSize: "14px"
            }}>
              Uploading... Please wait
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: "10px",
          justifyContent: "flex-end",
          paddingTop: "15px",
          borderTop: "1px solid #eee"
        }}>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            style={{
              padding: "10px 24px",
              background: "#f0f0f0",
              border: "none",
              borderRadius: "8px",
              color: "#666",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            style={{
              padding: "10px 32px",
              background: uploading ? "#ccc" : currentType.color,
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontWeight: "600",
              cursor: uploading ? "not-allowed" : "pointer",
              boxShadow: `0 4px 12px ${currentType.color}40`
            }}
          >
            📢 Post to The Walk
          </button>
        </div>
      </form>
    </div>
  );
}