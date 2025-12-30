import Link from "next/link";

export default function TermsPage() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={{ color: "#0b2e4a" }}>The Believerse — Terms of Fellowship</h1>

        <p>
          Welcome to <strong>The Believerse</strong>, a sacred digital space for 
          fellowship and the sharing of glimpses. By entering our sanctuary, 
          you agree to these terms of stewardship and community conduct:
        </p>

        <h3>1. Our Purpose</h3>
        <p>
          The Believerse is a platform dedicated to the Body of Christ. We provide 
          tools for networking, content hosting, and prayer. Access to our 
          full sanctuary is a stewardship-based model where believers support 
          the digital infrastructure required to keep this space ad-free and holy.
        </p>

        <h3>2. Kingdom Conduct</h3>
        <p>
          All glimpses and interactions must honor our walk with Christ. We 
          strictly prohibit the use of our platform for unauthorized financial 
          schemes, fraudulent activities, or any collection of funds not 
          explicitly authorized for digital sanctuary access.
        </p>

        <h3>3. Stewardship & Partnerships (Payments)</h3>
        <p>
          To maintain this digital sanctuary, we offer paid partnership tiers 
          processed through secure gateways (e.g., Razorpay). These payments 
          are for <strong>digital service access</strong> and premium fellowship 
          features. We do not accept unregulated donations; all transactions are 
          for specific digital resource access as displayed at the point of choice.
        </p>

        <h3>4. Grace & Cancellation Policy</h3>
        <p>
          As we provide immediate digital access to our sanctuary and its 
          resources, <strong>service fees are generally considered final</strong>.
        </p>
        <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
          <li>
            <strong>Cancellations:</strong> You may release your partnership 
            subscription at any time through your settings. This will stop 
            all future billing cycles immediately.
          </li>
          <li>
            <strong>Billing Discrepancies:</strong> If a technical error 
            occurs during your transaction, please reach out to 
            <strong> support@thebelieverse.com</strong> within 7 days so we 
            may rectify the error in a spirit of fairness.
          </li>
        </ul>

        <h3>5. Digital Provision</h3>
        <p>
          The Believerse provides exclusively digital services. 
          <strong>Provision:</strong> Upon successful transaction, your 
          partner features and sanctuary access are updated immediately (or 
          within a maximum of 24 hours).
        </p>

        <hr style={{ margin: "30px 0", border: "1px solid #eee" }} />

        <h3>Contact Our Stewards</h3>
        <p style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#d4af37" }}>
          📧 contact@thebelieverse.com
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
  link: { display: "inline-block", marginTop: "20px", padding: "10px 20px", background: "#0b2e4a", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "600" },
};