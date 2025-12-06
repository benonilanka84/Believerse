"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#b4dcff",
      padding: "40px 20px"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        
        {/* Hero Section with Community Logo */}
        <div style={{
          textAlign: "center",
          marginBottom: "60px"
        }}>
          <img 
            src="/images/logo-community.png" 
            alt="The Believerse Community"
            style={{
              width: "100%",
              maxWidth: "500px",
              height: "auto",
              borderRadius: "20px",
              boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
              marginBottom: "30px"
            }}
          />
          
          <h1 style={{
            fontSize: "3rem",
            fontWeight: "700",
            color: "#0b2e4a",
            marginBottom: "10px"
          }}>
            Welcome to The <span style={{ color: "#d4af37" }}>B</span>elievers<span style={{ color: "#2e8b57" }}>e</span>
          </h1>
          
          <p style={{
            fontSize: "1.5rem",
            color: "#2e8b57",
            fontWeight: "600",
            marginBottom: "20px"
          }}>
            "One Family in Christ."
          </p>
        </div>

        {/* Content Cards */}
        <div style={{
          display: "grid",
          gap: "30px",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))"
        }}>
          
          {/* Mission */}
          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ color: "#0b2e4a", marginBottom: "15px", fontSize: "1.8rem" }}>
              🌟 Our Mission
            </h2>
            <p style={{ color: "#333", lineHeight: "1.8", fontSize: "1.05rem" }}>
              Believerse is a social media platform designed to bring together believers and creators who want to share uplifting content — including videos, images, music, and stories — that reflect love, positivity, and faith. Our mission is to create a safe and inspiring digital community where users can express their beliefs, connect with others, and grow spiritually.
            </p>
          </div>

          {/* Vision */}
          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ color: "#0b2e4a", marginBottom: "15px", fontSize: "1.8rem" }}>
              ✨ Our Vision
            </h2>
            <p style={{ color: "#333", lineHeight: "1.8", fontSize: "1.05rem" }}>
              To become the world's most trusted social platform for faith-based content, fostering unity, kindness, and inspiration across cultures and generations.
            </p>
          </div>

          {/* Motto */}
          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ color: "#0b2e4a", marginBottom: "15px", fontSize: "1.8rem" }}>
              💫 Our Motto
            </h2>
            <p style={{ 
              color: "#2e8b57", 
              lineHeight: "1.8", 
              fontSize: "1.3rem",
              fontWeight: "600",
              fontStyle: "italic"
            }}>
              "Believe. Belong. Be a light."
            </p>
          </div>
        </div>

        {/* What Makes Us Different */}
        <div style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
          marginTop: "30px"
        }}>
          <h2 style={{ color: "#0b2e4a", marginBottom: "20px", fontSize: "2rem", textAlign: "center" }}>
            🙏 What Makes Us Different
          </h2>
          <p style={{ color: "#333", lineHeight: "1.8", fontSize: "1.1rem", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
            Unlike other social media platforms, Believerse centers on faith-based, uplifting, and educational content — free from negativity and toxicity. It empowers creators to inspire others through messages of love, compassion, and hope in Jesus Christ.
          </p>
        </div>

        {/* Target Audience */}
        <div style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
          marginTop: "30px"
        }}>
          <h2 style={{ color: "#0b2e4a", marginBottom: "25px", fontSize: "2rem", textAlign: "center" }}>
            👥 Who We Serve
          </h2>
          <div style={{
            display: "grid",
            gap: "20px",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))"
          }}>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🙏</div>
              <h3 style={{ color: "#0b2e4a", marginBottom: "8px" }}>Believers</h3>
              <p style={{ color: "#666" }}>Faith-driven individuals seeking positive content</p>
            </div>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🎨</div>
              <h3 style={{ color: "#0b2e4a", marginBottom: "8px" }}>Creators</h3>
              <p style={{ color: "#666" }}>Musicians, preachers, and content creators</p>
            </div>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>⛪</div>
              <h3 style={{ color: "#0b2e4a", marginBottom: "8px" }}>Churches</h3>
              <p style={{ color: "#666" }}>Ministries and Christian organizations</p>
            </div>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>👨‍👩‍👧‍👦</div>
              <h3 style={{ color: "#0b2e4a", marginBottom: "8px" }}>Communities</h3>
              <p style={{ color: "#666" }}>Youth groups promoting good values</p>
            </div>
          </div>
        </div>

        {/* Features Coming Soon */}
        <div style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
          marginTop: "30px"
        }}>
          <h2 style={{ color: "#0b2e4a", marginBottom: "25px", fontSize: "2rem", textAlign: "center" }}>
            🚀 Coming Soon
          </h2>
          <ul style={{
            listStyle: "none",
            padding: 0,
            display: "grid",
            gap: "15px",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            maxWidth: "900px",
            margin: "0 auto"
          }}>
            <li style={{ color: "#333", fontSize: "1.05rem", padding: "10px 0", borderLeft: "4px solid #2e8b57", paddingLeft: "15px" }}>
              📹 Live streaming & video premieres
            </li>
            <li style={{ color: "#333", fontSize: "1.05rem", padding: "10px 0", borderLeft: "4px solid #2e8b57", paddingLeft: "15px" }}>
              📖 Daily Bible verse feed
            </li>
            <li style={{ color: "#333", fontSize: "1.05rem", padding: "10px 0", borderLeft: "4px solid #2e8b57", paddingLeft: "15px" }}>
              📱 Mobile apps (iOS & Android)
            </li>
            <li style={{ color: "#333", fontSize: "1.05rem", padding: "10px 0", borderLeft: "4px solid #2e8b57", paddingLeft: "15px" }}>
              🌍 Multi-language support
            </li>
            <li style={{ color: "#333", fontSize: "1.05rem", padding: "10px 0", borderLeft: "4px solid #2e8b57", paddingLeft: "15px" }}>
              💰 Creator rewards program
            </li>
            <li style={{ color: "#333", fontSize: "1.05rem", padding: "10px 0", borderLeft: "4px solid #2e8b57", paddingLeft: "15px" }}>
              🤝 Prayer groups & communities
            </li>
          </ul>
        </div>

        {/* Contact Section */}
        <div style={{
          background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)",
          padding: "50px 40px",
          borderRadius: "16px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
          marginTop: "30px",
          textAlign: "center",
          color: "white"
        }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "20px" }}>
            📧 Get In Touch
          </h2>
          <p style={{ fontSize: "1.2rem", marginBottom: "20px" }}>
            Have questions or want to join our mission?
          </p>
          <a 
            href="mailto:contact@thebelieverse.com"
            style={{
              display: "inline-block",
              padding: "15px 40px",
              background: "white",
              color: "#2e8b57",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "1.1rem",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              marginBottom: "15px"
            }}
          >
            contact@thebelieverse.com
          </a>
          <p style={{ fontSize: "1rem", marginTop: "20px", opacity: "0.9" }}>
            🌐 Visit us at: <strong>www.thebelieverse.com</strong>
          </p>
        </div>

        {/* Back to Dashboard */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link 
            href="/dashboard"
            style={{
              display: "inline-block",
              padding: "12px 30px",
              background: "#2d6be3",
              color: "white",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "1.05rem"
            }}
          >
            ⬅ Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}