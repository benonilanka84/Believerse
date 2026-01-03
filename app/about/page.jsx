"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#b4dcff", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Section 1: Vision Branding */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <img 
            src="/images/logo-community.png" 
            alt="The Believerse Sanctuary"
            style={{ width: "100%", maxWidth: "500px", height: "auto", borderRadius: "20px", boxShadow: "0 15px 40px rgba(0,0,0,0.25)", marginBottom: "30px" }}
          />
          
          <h1 style={{ fontSize: "3rem", fontWeight: "700", color: "#0b2e4a", marginBottom: "10px" }}>
            The <span style={{ color: "#d4af37" }}>B</span>elievers<span style={{ color: "#2e8b57" }}>e</span> 
          </h1>
          
          <p style={{ fontSize: "1.5rem", color: "#2e8b57", fontWeight: "600", marginBottom: "20px" }}>
            "A Digital Sanctuary for Fellowship, Prayer, and the Word"
          </p>
        </div>

        {/* Faith-Centered Vision Cards */}
        <div style={{ display: "grid", gap: "30px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          
          {/* Our Calling */}
          <div style={{ background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}>
            <h2 style={{ color: "#0b2e4a", marginBottom: "15px", fontSize: "1.8rem" }}>
              🕊️ Our Calling
            </h2>
            <p style={{ color: "#333", lineHeight: "1.8", fontSize: "1.05rem" }}>
              The Believerse is a <strong>Sacred Digital Space</strong> built to host the glimpses of our walk with Christ. We provide high-integrity infrastructure so that believers, ministries, and creators can share the Gospel through high-definition video and interactive fellowship without the noise of the world.
            </p>
          </div>

          {/* Our Vision */}
          <div style={{ background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}>
            <h2 style={{ color: "#0b2e4a", marginBottom: "15px", fontSize: "1.8rem" }}>
              🌍 The Great Commission
            </h2>
            <p style={{ color: "#333", lineHeight: "1.8", fontSize: "1.05rem" }}>
              Our vision is to unite the global Body of Christ through technology that honors Him. We aim to empower every believer with tools that protect their spirit while fostering authentic, global unity across generations.
            </p>
          </div>

          {/* Core Values */}
          <div style={{ background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}>
            <h2 style={{ color: "#0b2e4a", marginBottom: "15px", fontSize: "1.8rem" }}>
              💎 Kingdom Standards
            </h2>
            <p style={{ color: "#2e8b57", lineHeight: "1.8", fontSize: "1.3rem", fontWeight: "600", fontStyle: "italic" }}>
              "Sacred. Private. Christ-Centered."
            </p>
          </div>
        </div>

        {/* Content Integrity */}
        <div style={{ background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", marginTop: "30px" }}>
          <h2 style={{ color: "#0b2e4a", marginBottom: "20px", fontSize: "2rem", textAlign: "center" }}>
            🛡️ Guarding the Sanctuary
          </h2>
          <p style={{ color: "#333", lineHeight: "1.8", fontSize: "1.1rem", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
            The Believerse is not just another platform; it is a <strong>moderated environment</strong> dedicated to truth. We utilize advanced technology to ensure that every sermon, song, and glimpse shared within our walls remains uplifting and aligned with Kingdom values.
          </p>
        </div>

        {/* Fellowship Demographics */}
        <div style={{ background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", marginTop: "30px" }}>
          <h2 style={{ color: "#0b2e4a", marginBottom: "25px", fontSize: "2rem", textAlign: "center" }}>
            ⛪ Fellowship in the Believerse
          </h2>
          <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🙏</div>
              <h3 style={{ color: "#0b2e4a", marginBottom: "8px" }}>Individual Believers</h3>
              <p style={{ color: "#666" }}>Daily walkers sharing glimpses of faith</p>
            </div>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>📖</div>
              <h3 style={{ color: "#0b2e4a", marginBottom: "8px" }}>Kingdom Creators</h3>
              <p style={{ color: "#666" }}>Stewards of the Word, Music, and Art</p>
            </div>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🤝</div>
              <h3 style={{ color: "#0b2e4a", marginBottom: "8px" }}>Church Ministries</h3>
              <p style={{ color: "#666" }}>Ministries utilizing our digital walls for outreach</p>
            </div>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🛡️</div>
              <h3 style={{ color: "#0b2e4a", marginBottom: "8px" }}>Stewards</h3>
              <p style={{ color: "#666" }}>Entities managing secure fellowships</p>
            </div>
          </div>
        </div>

        {/* Roadmap */}
        <div style={{ background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", marginTop: "30px" }}>
          <h2 style={{ color: "#0b2e4a", marginBottom: "25px", fontSize: "2rem", textAlign: "center" }}>
            🌱 Growing the Vine
          </h2>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "15px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", maxWidth: "900px", margin: "0 auto" }}>
            <li style={{ color: "#333", fontSize: "1.05rem", padding: "10px 0", borderLeft: "4px solid #d4af37", paddingLeft: "15px" }}>
              💰 <strong>Believerse Ad Network (BAN)</strong>: Building a curated network for Christian ads to empower creators with Kingdom-aligned monetization.
            </li>
            <li style={{ color: "#333", fontSize: "1.05rem", padding: "10px 0", borderLeft: "4px solid #2e8b57", paddingLeft: "15px" }}>
              👼 <strong>The Believerse Kids</strong>: An exclusive, sacred space for children's content, ensuring the next generation grows in a protected digital garden.
            </li>
            <li style={{ color: "#333", fontSize: "1.05rem", padding: "10px 0", borderLeft: "4px solid #2e8b57", paddingLeft: "15px" }}>
              🌍 Multi-Language Prayer Support
            </li>
            <li style={{ color: "#333", fontSize: "1.05rem", padding: "10px 0", borderLeft: "4px solid #2e8b57", paddingLeft: "15px" }}>
              🙌 Partnership & Support Tools
            </li>
          </ul>
        </div>

        {/* Support & Blessing Section */}
        <div style={{ background: "linear-gradient(135deg, #0b2e4a 0%, #1d5d3a 100%)", padding: "50px 40px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", marginTop: "30px", textAlign: "center", color: "white" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px", alignItems: "center" }}>
            
            {/* Technical Support Column */}
            <div>
              <h2 style={{ fontSize: "2rem", marginBottom: "20px" }}>🤝 Sanctuary Support</h2>
              <p style={{ fontSize: "1.1rem", marginBottom: "25px", opacity: "0.9" }}>
                Reach out to our stewards for technical assistance, partnership inquiries, or fellowship management.
              </p>
              <a href="mailto:support@thebelieverse.com" style={{ display: "inline-block", padding: "15px 40px", background: "white", color: "#0b2e4a", borderRadius: "10px", textDecoration: "none", fontWeight: "700", fontSize: "1.1rem", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
                support@thebelieverse.com
              </a>
            </div>

            {/* Donation/Blessing Column */}
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "30px", borderRadius: "15px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 style={{ color: "#d4af37", fontSize: "1.5rem", marginBottom: "15px" }}>🎁 Bless the Ministry</h3>
              <p style={{ fontSize: "0.95rem", marginBottom: "20px", opacity: "0.8" }}>
                Support the development of BAN and the Kids sanctuary. Scan to give a tithe or offering via UPI.
              </p>
              <img 
                src="/QR_code/The_Believerse_QR.jpeg" 
                alt="Ministry Donation QR" 
                style={{ width: "150px", height: "150px", borderRadius: "10px", background: "white", padding: "10px", marginBottom: "15px", objectFit: "contain" }} 
              />
              <p style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#d4af37" }}>Kingdom Stewards: Vijayawada, India</p>
            </div>
          </div>
        </div>

        {/* Back to Sanctuary */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link href="/dashboard" style={{ display: "inline-block", padding: "12px 30px", background: "#d4af37", color: "white", borderRadius: "10px", textDecoration: "none", fontWeight: "600", fontSize: "1.05rem" }}>
            ⬅ Back to Sanctuary
          </Link>
        </div>

      </div>
    </div>
  );
}