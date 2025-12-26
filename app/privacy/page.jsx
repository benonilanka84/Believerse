"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1>The Believerse — Privacy Policy</h1>
        <p style={styles.lastUpdated}>Last Updated: December 2025</p>

        <p>
          At <strong>The Believerse Platform</strong>, we are committed to 
          maintaining the highest standards of data protection for our users. 
          This policy outlines how our technology infrastructure collects, uses, 
          and safeguards your personal information.
        </p>

        <h3>1. Information We Collect</h3>
        <p>We collect the following types of information to provide our digital services:</p>
        <ul style={styles.list}>
          <li>
            <strong>Personal Information:</strong> Name, email address, and profile 
            details provided during account registration.
          </li>
          <li>
            <strong>User-Generated Content:</strong> Digital media, posts, and 
            interactions you voluntarily upload to our platform.
          </li>
          <li>
            {/* RE-WRITTEN TO REMOVE DONATIONS */}
            <strong>Payment Information:</strong> Transaction history related to 
            premium subscriptions or digital service fees. <em>Note: We do not 
            store complete credit/debit card details. All financial data is 
            processed securely via authorized third-party gateways (e.g., Razorpay).</em>
          </li>
          <li>
            <strong>Usage Analytics:</strong> Technical data (e.g., browser type, 
            device type) utilized solely to optimize platform performance and 
            security.
          </li>
        </ul>

        <h3>2. How We Use Your Information</h3>
        <p>Your data is utilized for the following commercial purposes:</p>
        <ul style={styles.list}>
          <li>To provision and manage your premium service account.</li>
          <li>To facilitate secure peer-to-peer networking and content distribution.</li>
          <li>To process service transactions and issue digital confirmations.</li>
          <li>To maintain platform integrity through advanced fraud and abuse prevention.</li>
        </ul>

        <h3>3. Data Sharing & Third Parties</h3>
        <p>
          The Believerse <strong>does not</strong> sell or trade user data. We 
          coordinate with trusted service providers only for operational necessity:
        </p>
        <ul style={styles.list}>
          <li>
            <strong>Payment Processing:</strong> (e.g., Razorpay) to handle 
            service fee transactions securely.
          </li>
          <li>
            <strong>Identity Authentication:</strong> (e.g., Google/Email Auth) 
            to ensure secure account access.
          </li>
          <li>
            <strong>Compliance:</strong> To satisfy legal requirements or 
            protect the technical security of the platform infrastructure.
          </li>
        </ul>

        <h3>4. Security Standards</h3>
        <p>
          We implement industry-standard encryption and secure server 
          protocols to protect all sensitive data. While we utilize 
          enterprise-grade security, no internet transmission is guaranteed 
          to be absolute; therefore, we encourage users to utilize strong, 
          unique account credentials.
        </p>

        <h3>5. User Rights</h3>
        <p>
          As a service user, you retain the right to access, update, or 
          request deletion of your data. Profile adjustments can be made 
          directly through your dashboard, or you may contact our billing 
          and support team for assistance.
        </p>

        <hr style={{ margin: "30px 0", border: "1px solid #eee" }} />

        <h3>Contact for Support</h3>
        <p style={{ fontWeight: "bold", color: "#2d6be3" }}>
          📧 contact@thebelieverse.com
        </p>

        <Link href="/dashboard" style={styles.link}>
          ⬅ Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: "100vh", padding: "40px", display: "flex", justifyContent: "center", alignItems: "flex-start", background: "#b4dcff" },
  card: { maxWidth: "900px", padding: "30px", background: "white", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.2)", color: "#333" },
  lastUpdated: { fontSize: "0.9rem", color: "#666", fontStyle: "italic", marginBottom: "20px" },
  list: { paddingLeft: "20px", lineHeight: "1.8", marginBottom: "20px" },
  link: { display: "inline-block", marginTop: "20px", padding: "10px 20px", background: "#2d6be3", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "600" },
};