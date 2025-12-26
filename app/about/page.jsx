"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#b4dcff", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Section 1: Technology Branding */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <img 
            src="/images/logo-community.png" 
            alt="The Believerse Platform"
            style={{ width: "100%", maxWidth: "500px", height: "auto", borderRadius: "20px", boxShadow: "0 15px 40px rgba(0,0,0,0.25)", marginBottom: "30px" }}
          />
          
          <h1 style={{ fontSize: "3rem", fontWeight: "700", color: "#0b2e4a", marginBottom: "10px" }}>
            The <span style={{ color: "#d4af37" }}>B</span>elievers<span style={{ color: "#2e8b57" }}>e</span> Platform
          </h1>
          
          <p style={{ fontSize: "1.5rem", color: "#2e8b57", fontWeight: "600", marginBottom: "20px" }}>
            "Advanced Digital Infrastructure for Faith-Based Networking"
          </p>
        </div>

        {/* Commercial/SaaS Focus Cards */}
        <div style={{ display: "grid", gap: "30px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          
          {/* Mission: Technology Focus */}
          <div style={{ background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}>
            <h2 style={{ color: "#0b2e4a", marginBottom: "15px", fontSize: "1.8rem" }}>
              🛠️ Our Platform
            </h2>
            <p style={{ color: "#333", lineHeight: "1.8", fontSize: "1.05rem" }}>
              The Believerse is a <strong>specialized Technology Platform (SaaS)</strong> designed to provide digital infrastructure for content delivery and professional networking. We provide premium tools for creators and organizations to host secure, moderated, and uplifting digital content including high-definition video, interactive media, and community management services.
            </p>
          </div>

          {/* Vision: Service Focus */}
          <div style={{ background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}>
            <h2 style={{ color: "#0b2e4a", marginBottom: "15px", fontSize: "1.8rem" }}>
              📡 Our Service Vision
            </h2>
            <p style={{ color: "#333", lineHeight: "1.8", fontSize: "1.05rem" }}>
              To become the world’s leading digital service provider for faith-based communities, offering robust SaaS solutions that empower unity and content integrity across global generations.
            </p>
          </div>

          {/* Value Proposition */}
          <div style={{ background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}>
            <h2 style={{ color: "#0b2e4a", marginBottom: "15px", fontSize: "1.8rem" }}>
              💎 Premium Standards
            </h2>
            <p style={{ color: "#2e8b57", lineHeight: "1.8", fontSize: "1.3rem", fontWeight: "600", fontStyle: "italic" }}>
              "Secure. Professional. Service-Oriented."
            </p>
          </div>
        </div>

        {/* Technical Differentiation */}
        <div style={{ background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", marginTop: "30px" }}>
          <h2 style={{ color: "#0b2e4a", marginBottom: "20px", fontSize: "2rem", textAlign: "center" }}>
            ⚖️ Advanced Content Integrity
          </h2>
          <p style={{ color: "#333", lineHeight: "1.8", fontSize: "1.1rem", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
            Unlike generic platforms, The Believerse provides <strong>specialized moderation technology</strong> and educational content frameworks. Our architecture is optimized for high-reliability streaming and secure peer-to-peer digital interactions, ensuring a safe and premium environment for every user.
          </p>
        </div>

        {/* Targets: Framing as 'Users' */}
        <div style={{ background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", marginTop: "30px" }}>
          <h2 style={{ color: "#0b2e4a", marginBottom: "25px", fontSize: "2rem", textAlign: "center" }}>
            🌐 Service Demographics
          </h2>
          <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>👤</div>
              <h3 style={{ color: "#0b2e4a", marginBottom: "8px" }}>Individual Users</h3>
              <p style={{ color: "#666" }}>Subscribers utilizing premium networking features</p>
            </div>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>📹</div>
              <h3 style={{ color: "#0b2e4a", marginBottom: "8px" }}>Digital Creators</h3>
              <p style={{ color: "#666" }}>Service users hosting sermons, music, and media</p>
            </div>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>💻</div>
              <h3 style={{ color: "#0b2e4a", marginBottom: "8px" }}>IT Organizations</h3>
              <p style={{ color: "#666" }}>Ministries utilizing our digital infrastructure</p>
            </div>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🛡️</div>
              <h3 style={{ color: "#0b2e4a", marginBottom: "8px" }}>Admins</h3>
              <p style={{ color: "#666" }}>Entities managing secure group environments</p>
            </div>
          </div>
        </div>

        {/* FRAME as SERVICE EXPANSION */}
        <div style={{ background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", marginTop: "30px" }}>
          <h2 style={{ color: "#0b2e4a", marginBottom: "25px", fontSize: "2rem", textAlign: "center" }}>
            🚀 Service Roadmap
          </h2>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "15px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", maxWidth: "900px", margin: "0 auto" }}>
            <li style={{ color: "#333", fontSize: "1.05rem", padding: "10px 0", borderLeft: "4px solid #2e8b57", paddingLeft: "15px" }}>
              📹 Enterprise-grade Live Streaming
            </li>
            <li style={{ color: "#333", fontSize: "1.05rem", padding: "10px 0", borderLeft: "4px solid #2e8b57", paddingLeft: "15px" }}>
              📱 Dedicated Mobile SaaS Applications
            </li>
            <li style={{ color: "#333", fontSize: "1.05rem", padding: "10px 0", borderLeft: "4px solid #2e8b57", paddingLeft: "15px" }}>
              🌍 Global Multi-Region Support
            </li>
            <li style={{ color: "#333", fontSize: "1.05rem", padding: "10px 0", borderLeft: "4px solid #2e8b57", paddingLeft: "15px" }}>
              💰 Integrated Creator Monetization Tools
            </li>
          </ul>
        </div>

        {/* Contact Framing: Billing Support */}
        <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "50px 40px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", marginTop: "30px", textAlign: "center", color: "white" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "20px" }}>📩 Billing & Support</h2>
          <p style={{ fontSize: "1.2rem", marginBottom: "20px" }}>For technical inquiries or subscription support.</p>
          <a href="mailto:contact@thebelieverse.com" style={{ display: "inline-block", padding: "15px 40px", background: "white", color: "#2e8b57", borderRadius: "10px", textDecoration: "none", fontWeight: "700", fontSize: "1.1rem", boxShadow: "0 4px 15px rgba(0,0,0,0.2)", marginBottom: "15px" }}>
            contact@thebelieverse.com
          </a>
          <p style={{ fontSize: "1rem", marginTop: "20px", opacity: "0.9" }}>
            🏢 Registered Operations: <strong>Vijayawada, India</strong>
          </p>
        </div>

        {/* Back to Dashboard */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link href="/dashboard" style={{ display: "inline-block", padding: "12px 30px", background: "#2d6be3", color: "white", borderRadius: "10px", textDecoration: "none", fontWeight: "600", fontSize: "1.05rem" }}>
            ⬅ Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}