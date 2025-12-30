"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={{ color: "#0b2e4a" }}>The Believerse — Privacy & Stewardship</h1>
        <p style={styles.lastUpdated}>Last Updated: December 2025</p>

        <p>
          At <strong>The Believerse</strong>, we consider the protection of your 
          journey and data to be a sacred trust. This policy outlines how we 
          steward the information you share within our sanctuary to ensure a 
          secure, private, and Christ-centered environment.
        </p>

        <h3>1. Information We Steward</h3>
        <p>We collect only what is necessary to maintain your place in the fellowship:</p>
        <ul style={styles.list}>
          <li>
            <strong>Believer Details:</strong> Your name, email, and the 
            profile details you provide to identify yourself within the community.
          </li>
          <li>
            <strong>Shared Glimpses:</strong> The media, posts, and interactive 
            fellowship you voluntarily share within our digital walls.
          </li>
          <li>
            <strong>Stewardship Transactions:</strong> History related to 
            partnership upgrades or digital service fees. <em>Note: We do not 
            store card details. Financial data is securely processed via 
            authorized third-party gateways (e.g., Razorpay).</em>
          </li>
          <li>
            <strong>Sanctuary Performance:</strong> Technical data used 
            solely to ensure the sanctuary remains stable, fast, and secure 
            for all believers.
          </li>
        </ul>

        <h3>2. Purpose of Stewardship</h3>
        <p>Your information is used to foster fellowship and maintain order:</p>
        <ul style={styles.list}>
          <li>To manage your sanctuary access and partner features.</li>
          <li>To facilitate secure fellowship and the sharing of the Word.</li>
          <li>To process partnership transactions and provide digital confirmations.</li>
          <li>To protect the community from noise, fraud, and unholy interactions.</li>
        </ul>

        <h3>3. Trusted Partners</h3>
        <p>
          The Believerse <strong>never</strong> sells or trades the data of our 
          fellowship. We coordinate with trusted stewards only for technical necessity:
        </p>
        <ul style={styles.list}>
          <li>
            <strong>Stewardship Processing:</strong> Razorpay handles all 
            transaction security for partnership fees.
          </li>
          <li>
            <strong>Identity Protection:</strong> We use secure authentication 
            to ensure only you can access your account.
          </li>
          <li>
            <strong>Legal Integrity:</strong> We act only to satisfy legal 
            requirements or to protect the safety of the fellowship.
          </li>
        </ul>

        <h3>4. Protecting the Sanctuary</h3>
        <p>
          We utilize industry-standard encryption to guard your data. While we 
          steward our digital walls with high-grade security, we encourage 
          every believer to use unique and strong credentials to protect their 
          account.
        </p>

        <h3>5. Your Sovereignty & Account Rights</h3>
        <p>
          You remain the steward of your own data. You have the right to access, 
          correct, or request the removal of your information at any time.
        </p>
        <ul style={styles.list}>
          <li>
            <strong>Account Deletion & Recovery:</strong> For requests regarding 
            the permanent removal of your account, content recovery, or technical 
            upgrades, please contact <strong>support@thebelieverse.com</strong>.
          </li>
          <li>
            <strong>Profile Management:</strong> Basic updates can be made 
            instantly through your sanctuary dashboard.
          </li>
        </ul>

        <hr style={{ margin: "30px 0", border: "1px solid #eee" }} />

        <h3>Contact the Stewards</h3>
        <p style={{ margin: "5px 0" }}>
          <strong>General Fellowship:</strong> <span style={{ color: "#d4af37" }}>contact@thebelieverse.com</span>
        </p>
        <p style={{ margin: "5px 0" }}>
          <strong>Technical Support & Deletion:</strong> <span style={{ color: "#d4af37" }}>support@thebelieverse.com</span>
        </p>
        <p style={{ margin: "5px 0" }}>
          <strong>Partnership & Leadership:</strong> <span style={{ color: "#d4af37" }}>ceo@thebelieverse.com</span>
        </p>

        <Link href="/dashboard" style={styles.link}>
          ⬅ Back to Sanctuary
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
  link: { display: "inline-block", marginTop: "20px", padding: "12px 25px", background: "#0b2e4a", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "600" },
};