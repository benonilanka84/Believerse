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

        <h3>3. Privacy</h3>
        <p>
          Your personal information (name, email, profile details) will never be
          shared publicly without your consent. You are responsible for keeping
          your login details safe.
        </p>

        <h3>4. Uploaded Content</h3>
        <p>
          Any images, testimonies, or posts you upload must belong to you or be
          used with proper permission.
        </p>

        <h3>5. Account Termination</h3>
        <p>
          The Believerse reserves the right to suspend or delete accounts that
          violate these terms.
        </p>

        <h3>6. Changes to Terms</h3>
        <p>
          These terms may be updated occasionally. Continued use of the platform
          means you accept any updates.
        </p>

        <p>
          If you have questions, please contact our support team using the
          official webpage.
        </p>

        <a href="/" style={styles.link}>Back to Home</a>
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
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(3px)",
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
    color: "#2d6be3",
  },
};
