"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        
        {/* Column 1: Brand Info */}
        <div style={styles.column}>
          <h3 style={styles.brand}>The Believerse</h3>
          <p style={styles.text}>
            One Family in Christ. Connecting believers worldwide through faith, 
            hope, and love.
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Explore</h4>
          <Link href="/about" style={styles.link}>About Us</Link>
          <Link href="/dashboard" style={styles.link}>Home / Dashboard</Link>
        </div>

        {/* Column 3: Legal (Crucial for Razorpay) */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Legal</h4>
          <Link href="/terms" style={styles.link}>Terms & Conditions</Link>
          <Link href="/privacy" style={styles.link}>Privacy Policy</Link>
          <Link href="/terms" style={styles.link}>Refund & Cancellation</Link>
        </div>

        {/* Column 4: Contact */}
        <div style={styles.column}>
          <h4 style={styles.heading}>Contact Us</h4>
          <a href="mailto:contact@thebelieverse.com" style={styles.link}>
            📧 contact@thebelieverse.com
          </a>
          <p style={{ ...styles.text, marginTop: "10px", fontSize: "0.85rem" }}>
            Vijayawada, Andhra Pradesh, India
          </p>
        </div>
      </div>

      {/* Updated Copyright Bar with Legal Entity */}
<div style={styles.bottomBar}>
  <p>
    © {new Date().getFullYear()} The Believerse. All rights reserved.
  </p>
  <p style={{ marginTop: "5px", fontSize: "0.75rem", opacity: 0.8 }}>
    The Believerse is a digital platform owned and operated by <strong>KBM Lanka Technologies</strong>.
  </p>
</div>

const styles = {
  footer: {
    background: "#0b2e4a", // Deep Navy from your About Page
    color: "#ffffff",
    padding: "60px 20px 20px",
    fontFamily: "sans-serif",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "40px",
    marginBottom: "40px",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  brand: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#b4dcff", // Light blue accent
    marginBottom: "10px",
  },
  heading: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#b4dcff",
    marginBottom: "10px",
  },
  text: {
    lineHeight: "1.6",
    color: "#e0e0e0",
    fontSize: "0.95rem",
  },
  link: {
    color: "#e0e0e0",
    textDecoration: "none",
    fontSize: "0.95rem",
    transition: "color 0.2s ease",
    cursor: "pointer",
  },
  bottomBar: {
    borderTop: "1px solid rgba(255,255,255,0.1)",
    paddingTop: "20px",
    textAlign: "center",
    fontSize: "0.85rem",
    color: "#8899a6",
  },
};