import Link from "next/link";

export default function TermsPage() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1>The Believerse — Terms & Conditions</h1>

        <p>
          Welcome to <strong>The Believerse</strong>, a Christian faith–based
          community platform created to encourage fellowship, prayer, and
          spiritual growth. By accessing or using this platform, you agree to
          the following terms:
        </p>

        <h3>1. Faith-Based Content Only</h3>
        <p>
          Users must post only Christian, Bible-based, or faith-encouraging
          content. Content that is offensive, hateful, harmful, or unrelated to
          Christian beliefs is not permitted.
        </p>

        <h3>2. Respect & Conduct</h3>
        <p>
          All members should behave respectfully toward one another. Bullying,
          harassment, arguments, or misuse of Scripture will not be tolerated.
        </p>

        <h3>3. Prohibited Financial Activities</h3>
        <p>
          <strong>The Believerse strictly prohibits</strong> the following
          activities:
        </p>
        <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
          <li>
            Pyramid schemes, multi-level marketing (MLM), or chain referral
            schemes
          </li>
          <li>
            Fraudulent investment opportunities or "get rich quick" schemes
          </li>
          <li>
            Foreign fund transfer scams, advance-fee fraud, or romance scams
          </li>
          <li>Fake charity solicitations or misrepresentation of donations</li>
          <li>Phishing attempts, identity theft, or financial data harvesting</li>
          <li>Cryptocurrency scams or unregistered investment offerings</li>
          <li>Any form of financial manipulation, deception, or exploitation</li>
        </ul>
        <p>
          Users found engaging in such activities will be{" "}
          <strong>immediately banned</strong> and reported to relevant
          authorities. We are committed to protecting our community from
          financial fraud and exploitation.
        </p>

        {/* --- RAZORPAY COMPLIANCE SECTIONS START --- */}

        <h3>4. Payments & Services</h3>
        <p>
          The Believerse may offer paid memberships, donations, or digital
          services processed via third-party gateways (e.g., Razorpay). By
          initiating a transaction, you agree to the pricing displayed at the
          checkout. All transactions are processed securely. We do not store
          your complete credit/debit card details on our servers.
        </p>

        <h3>5. Refund & Cancellation Policy</h3>
        <p>
          Since The Believerse provides digital access to community features and
          content, <strong>all sales are generally final</strong>.
        </p>
        <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
          <li>
            <strong>Cancellations:</strong> You may cancel your subscription or
            account at any time. Cancellation will prevent future billing, but
            previous payments are non-refundable unless otherwise stated.
          </li>
          <li>
            <strong>Refunds:</strong> Refunds are only processed in cases of
            technical errors (e.g., double billing). If you believe a billing
            error has occurred, please contact us immediately at{" "}
            <strong>contact@thebelieverse.com</strong>.
          </li>
        </ul>

        <h3>6. Shipping & Delivery Policy</h3>
        <p>
          As a digital platform, The Believerse does not ship physical products.
          <strong>Delivery of Services:</strong> Upon successful payment, access
          to premium features, content, or community areas is granted
          immediately (or within a maximum of 24 hours in case of system
          delays). Confirmation of your transaction will be sent via email.
        </p>

        {/* --- RAZORPAY COMPLIANCE SECTIONS END --- */}

        <h3>7. Privacy</h3>
        <p>
          Your personal information (name, email, profile details) will never be
          shared publicly without your consent. You are responsible for keeping
          your login details safe.
        </p>

        <h3>8. Uploaded Content</h3>
        <p>
          Any images, testimonies, or posts you upload must belong to you or be
          used with proper permission.
        </p>

        <h3>9. Account Termination</h3>
        <p>
          The Believerse reserves the right to suspend or delete accounts that
          violate these terms.
        </p>

        <h3>10. Changes to Terms</h3>
        <p>
          These terms may be updated occasionally. Continued use of the platform
          means you accept any updates.
        </p>

        <hr style={{ margin: "30px 0", border: "1px solid #eee" }} />

        <h3>Contact Us</h3>
        <p>
          For any questions regarding these Terms, payments, or account support,
          please contact us at:
        </p>
        <p style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#2d6be3" }}>
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