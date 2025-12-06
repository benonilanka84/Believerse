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
          <strong>The Believerse strictly prohibits</strong> the following activities:
        </p>
        <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
          <li>Pyramid schemes, multi-level marketing (MLM), or chain referral schemes</li>
          <li>Fraudulent investment opportunities or "get rich quick" schemes</li>
          <li>Foreign fund transfer scams, advance-fee fraud, or romance scams</li>
          <li>Fake charity solicitations or misrepresentation of donations</li>
          <li>Phishing attempts, identity theft, or financial data harvesting</li>
          <li>Cryptocurrency scams or unregistered investment offerings</li>
          <li>Any form of financial manipulation, deception, or exploitation</li>
        </ul>
        <p>
          Users found engaging in such activities will be <strong>immediately banned</strong> and 
          reported to relevant authorities. We are committed to protecting our community from 
          financial fraud and exploitation.
        </p>

        <h3>4. Privacy</h3>
        <p>
          Your personal information (name, email, profile details) will never be
          shared publicly without your consent. You are responsible for keeping
          your login details safe.
        </p>

        <h3>5. Uploaded Content</h3>
        <p>
          Any images, testimonies, or posts you upload must belong to you or be
          used with proper permission.
        </p>

        <h3>6. Account Termination</h3>
        <p>
          The Believerse reserves the right to suspend or delete accounts that
          violate these terms.
        </p>

        <h3>7. Changes to Terms</h3>
        <p>
          These terms may be updated occasionally. Continued use of the platform
          means you accept any updates.
        </p>

        <p>
          If you have questions, please contact our support team using the
          official webpage.
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