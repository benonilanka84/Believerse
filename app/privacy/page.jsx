import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1>The Believerse — Privacy Policy</h1>
        <p style={styles.lastUpdated}>Last Updated: December 2025</p>

        <p>
          At <strong>The Believerse</strong>, we value your trust and are
          committed to protecting your privacy. This policy outlines how we
          collect, use, and safeguard your personal information.
        </p>

        <h3>1. Information We Collect</h3>
        <p>We collect the following types of information to provide our services:</p>
        <ul style={styles.list}>
          <li>
            <strong>Personal Information:</strong> Name, email address, and profile
            details provided during sign-up.
          </li>
          <li>
            <strong>User Content:</strong> Photos, posts, testimonies, and comments
            you voluntarily upload.
          </li>
          <li>
            <strong>Payment Information:</strong> Transaction history for donations
            or subscriptions. <em>Note: We do not store credit/debit card numbers.
            All payments are processed securely via Razorpay.</em>
          </li>
          <li>
            <strong>Usage Data:</strong> Information on how you access the site
            (e.g., browser type, device type) to improve user experience.
          </li>
        </ul>

        <h3>2. How We Use Your Information</h3>
        <p>We use your data for the following purposes:</p>
        <ul style={styles.list}>
          <li>To create and manage your user account.</li>
          <li>To facilitate community interactions (comments, posts).</li>
          <li>To process secure transactions and send payment confirmations.</li>
          <li>To prevent fraud, spam, and abuse within the community.</li>
        </ul>

        <h3>3. Data Sharing & Third Parties</h3>
        <p>
          We do <strong>not</strong> sell or trade your personal information. We
          may share data with trusted third-party service providers solely for:
        </p>
        <ul style={styles.list}>
          <li>
            <strong>Payment Processing:</strong> (e.g., Razorpay) to handle
            transactions securely.
          </li>
          <li>
            <strong>Authentication:</strong> (e.g., Google/Email Auth) to verify
            your identity.
          </li>
          <li>
            <strong>Legal Compliance:</strong> If required by law or to protect the
            safety of our community.
          </li>
        </ul>

        <h3>4. Cookies</h3>
        <p>
          We use cookies to maintain your login session and remember your
          preferences. You can disable cookies in your browser settings, though
          some site features may not function properly.
        </p>

        <h3>5. Data Security</h3>
        <p>
          We implement industry-standard security measures (encryption, secure
          servers) to protect your data. However, no method of transmission over
          the internet is 100% secure.
        </p>

        <h3>6. Your Rights</h3>
        <p>
          You have the right to access, update, or delete your personal data. You
          can edit your profile directly in the dashboard or contact us to request
          account deletion.
        </p>

        <h3>7. Contact Us</h3>
        <p>
          If you have questions about this Privacy Policy, please contact us at:
        </p>
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
  wrapper: {
    minHeight: "100vh",
    padding: "40px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    background: "#b4dcff",
  },
  card: {
    maxWidth: "900px",
    padding: "30px",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    color: "#333",
  },
  lastUpdated: {
    fontSize: "0.9rem",
    color: "#666",
    fontStyle: "italic",
    marginBottom: "20px",
  },
  list: {
    paddingLeft: "20px",
    lineHeight: "1.8",
    marginBottom: "20px",
  },
  link: {
    display: "inline-block",
    marginTop: "20px",
    padding: "10px 20px",
    background: "#2d6be3",
    color: "white",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
  },
};