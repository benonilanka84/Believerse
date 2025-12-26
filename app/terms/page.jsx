import Link from "next/link";

export default function TermsPage() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1>The Believerse — Terms of Service</h1>

        <p>
          Welcome to <strong>The Believerse</strong>, a digital platform providing 
          premium community networking and content services for believers. By accessing 
          our platform, you agree to the following commercial terms:
        </p>

        <h3>1. Platform Services</h3>
        <p>
          The Believerse is a technology platform that provides digital networking 
          tools, content hosting, and community management services. Users pay for 
          access to premium platform features and digital resources.
        </p>

        <h3>2. Restricted Activities</h3>
        <p>
          Users must use the platform for its intended purpose of faith-based 
          networking. We strictly prohibit the use of our payment gateway for 
          unauthorized financial activities, including but not limited to 
          unregulated schemes, fraudulent investments, or unauthorized fund collection.
        </p>

        {/* --- RE-WRITTEN FOR RAZORPAY COMPLIANCE --- */}

        <h3>3. Payments & Premium Subscriptions</h3>
        <p>
          The Believerse offers paid premium access and digital service packages 
          processed via secure third-party gateways (e.g., Razorpay). All 
          transactions are for <strong>digital service access</strong>. We do 
          not accept unregulated donations. Pricing for all service tiers is 
          clearly displayed at the point of purchase.
        </p>

        <h3>4. Refund & Cancellation Policy</h3>
        <p>
          As we provide immediate digital access to platform features and content 
          services, <strong>all service fees are generally non-refundable</strong>.
        </p>
        <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
          <li>
            <strong>Cancellations:</strong> Users may cancel their premium 
            subscription at any time through their account settings. Cancellation 
            will terminate future billing cycles.
          </li>
          <li>
            <strong>Technical Refunds:</strong> In the event of a technical 
            error resulting in duplicate billing, please contact 
            <strong> contact@thebelieverse.com</strong> within 7 days for a 
            billing adjustment.
          </li>
        </ul>

        <h3>5. Digital Delivery Policy</h3>
        <p>
          The Believerse provides exclusively digital services. 
          <strong>Delivery:</strong> Upon successful transaction completion, 
          premium account features and digital content access are provisioned 
          to the user's account immediately (or within a maximum of 24 hours).
        </p>

        <hr style={{ margin: "30px 0", border: "1px solid #eee" }} />

        <h3>Contact for Billing Support</h3>
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
  wrapper: { minHeight: "100vh", padding: "40px", display: "flex", justifyContent: "center", alignItems: "flex-start", background: "#b4dcff" },
  card: { maxWidth: "900px", padding: "30px", background: "white", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.2)", color: "#333" },
  link: { display: "inline-block", marginTop: "20px", padding: "10px 20px", background: "#2d6be3", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "600" },
};