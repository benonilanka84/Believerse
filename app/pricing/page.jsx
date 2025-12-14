"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PricingPage() {
  
  const [currency, setCurrency] = useState("USD"); // Default fallback
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [loadingGeo, setLoadingGeo] = useState(true);

  // --- 1. PRICING CONFIGURATION ---
  const pricing = {
    gold: {
      INR: { monthly: 99, yearly: 999, symbol: "₹" },
      GBP: { monthly: 8, yearly: 80, symbol: "£" },
      SGD: { monthly: 10, yearly: 100, symbol: "S$" },
      USD: { monthly: 4.99, yearly: 49.99, symbol: "$" }
    },
    platinum: {
      INR: { monthly: 499, yearly: 4999, symbol: "₹" },
      GBP: { monthly: 16, yearly: 160, symbol: "£" },
      SGD: { monthly: 20, yearly: 200, symbol: "S$" },
      USD: { monthly: 14.99, yearly: 149.99, symbol: "$" }
    }
  };

  useEffect(() => {
    async function detectCountry() {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.country_code === "IN") setCurrency("INR");
        else if (data.country_code === "GB") setCurrency("GBP");
        else if (data.country_code === "SG") setCurrency("SGD");
        else setCurrency("USD"); 
      } catch (error) {
        setCurrency("USD");
      } finally {
        setLoadingGeo(false);
      }
    }
    detectCountry();
  }, []);

  const activeGold = pricing.gold[currency];
  const activePlat = pricing.platinum[currency];
  const getPrice = (planObj) => billingCycle === "monthly" ? planObj.monthly : planObj.yearly;

  // Handler for the "Inaugural Offer"
  const handleInauguralOffer = () => {
    alert(`Initiating 3-Month Trial for ${activeGold.symbol}1... \n(This will set up a recurring mandate starting Month 4)`);
    // TODO: Trigger Razorpay Subscription API here
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafd", padding: "40px 20px" }}>
      
      {/* --- INAUGURAL OFFER BANNER --- */}
      {billingCycle === "monthly" && (
        <div style={{ 
          background: "linear-gradient(90deg, #d4af37 0%, #f9d976 100%)", 
          color: "#0b2e4a", padding: "15px", borderRadius: "12px", 
          textAlign: "center", maxWidth: "800px", margin: "0 auto 30px auto",
          boxShadow: "0 4px 15px rgba(212, 175, 55, 0.3)", border: "1px solid #fff"
        }}>
          <h3 style={{ margin: "0 0 5px 0", fontSize: "1.2rem" }}>🎉 Inaugural Launch Offer!</h3>
          <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: "500" }}>
            Get <strong>3 Months of Gold</strong> for just <strong>{activeGold?.symbol || "$"}1</strong>. 
            <br/><span style={{fontSize:"0.85rem", opacity:0.8}}>Cancel anytime. Standard pricing applies from Month 4.</span>
          </p>
        </div>
      )}

      {/* HERO SECTION */}
      <div style={{ textAlign: "center", marginBottom: "40px", maxWidth: "800px", margin: "0 auto 40px auto" }}>
        <h1 style={{ color: "#0b2e4a", fontSize: "2.8rem", fontWeight: "800", marginBottom: "15px" }}>
          Support the Sanctuary
        </h1>
        
        {/* MONTHLY / YEARLY TOGGLE */}
        <div style={{ background: "#e0e0e0", borderRadius: "30px", padding: "4px", display: "inline-flex" }}>
            <button 
                onClick={() => setBillingCycle("monthly")}
                style={{
                    padding: "10px 25px", borderRadius: "25px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px",
                    background: billingCycle === "monthly" ? "white" : "transparent",
                    color: billingCycle === "monthly" ? "#0b2e4a" : "#666",
                    boxShadow: billingCycle === "monthly" ? "0 2px 5px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.3s"
                }}
            >
                Monthly
            </button>
            <button 
                onClick={() => setBillingCycle("yearly")}
                style={{
                    padding: "10px 25px", borderRadius: "25px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px",
                    background: billingCycle === "yearly" ? "white" : "transparent",
                    color: billingCycle === "yearly" ? "#0b2e4a" : "#666",
                    boxShadow: billingCycle === "yearly" ? "0 2px 5px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.3s"
                }}
            >
                Yearly <span style={{fontSize:"10px", color:"#2e8b57", marginLeft:"4px"}}>(Save 17%)</span>
            </button>
        </div>
      </div>

      {/* CARDS CONTAINER */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "25px", maxWidth: "1200px", margin: "0 auto 60px auto" }}>

        {/* --- FREE PLAN --- */}
        <div style={{ background: "white", borderRadius: "16px", padding: "35px", border: "1px solid #eee" }}>
          <h3 style={{ color: "#666", fontSize: "1.4rem", fontWeight: "600", marginBottom: "10px" }}>Community</h3>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "#333", marginBottom: "20px" }}>Free</div>
          
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 30px 0", lineHeight: "2.2", fontSize: "0.95rem" }}>
            <li style={{ color: "#333" }}>📖 <strong>View All Content</strong> (Unlimited)</li>
            <li style={{ color: "#333" }}>🙏 Post Prayer Requests</li>
            <li style={{ color: "#333" }}>🤝 Join 1 Fellowship Group</li>
            <li style={{ color: "#333" }}>🛡️ <strong>100% Data Privacy</strong> (No Selling)</li>
            <li style={{ color: "#333" }}>📹 Upload 15 Glimpses / Month</li>
            <li style={{ color: "#333" }}>💾 <strong>500 MB</strong> Cloud Storage</li>
            <li style={{ color: "#333" }}>✨ Standard Profile Badge</li>
            <li style={{ color: "#999" }}>❌ Create Fellowships</li>
            <li style={{ color: "#999" }}>❌ Long Video Uploads</li>
            <li style={{ color: "#666", fontSize: "0.85rem", fontStyle: "italic" }}>ℹ️ Supported by non-intrusive ads</li>
          </ul>
          
          <button style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #ccc", background: "white", color: "#666", fontWeight: "700", cursor: "default" }}>
            Current Plan
          </button>
        </div>

        {/* --- GOLD PLAN --- */}
        <div style={{ background: "white", borderRadius: "16px", padding: "35px", border: "2px solid #d4af37", position: "relative", boxShadow: "0 10px 30px rgba(212, 175, 55, 0.15)" }}>
          <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#d4af37", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>
            CREATOR FAVORITE
          </div>
          <h3 style={{ color: "#d4af37", fontSize: "1.4rem", fontWeight: "600", marginBottom: "10px" }}>Gold Supporter</h3>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "#333", marginBottom: "20px" }}>
            {activeGold?.symbol}{getPrice(activeGold)} <span style={{ fontSize: "0.9rem", color: "#999", fontWeight: "500" }}>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
          </div>
          
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 30px 0", lineHeight: "2.2", fontSize: "0.95rem" }}>
            <li style={{ color: "#333" }}>✅ <strong>Everything in Free</strong></li>
            <li style={{ color: "#333" }}>🚫 <strong>Ad-Free Experience</strong></li>
            <li style={{ color: "#333" }}>📹 <strong>Unlimited</strong> Glimpses</li>
            <li style={{ color: "#333" }}>🎥 Upload Videos up to <strong>60 Mins</strong></li>
            <li style={{ color: "#333" }}>💾 <strong>50 GB</strong> Cloud Storage</li>
            <li style={{ color: "#333" }}>👥 <strong>Create & Lead</strong> Fellowships</li>
            <li style={{ color: "#333" }}>🤝 Join Unlimited Groups</li>
            <li style={{ color: "#333" }}>🥇 <strong>Gold Profile Badge</strong></li>
            <li style={{ color: "#333" }}>📈 Creator Analytics (Coming Soon)</li>
            <li style={{ color: "#333" }}>💌 Priority Support</li>
          </ul>
          
          {/* INAUGURAL OFFER BUTTON */}
          {billingCycle === "monthly" ? (
             <button onClick={handleInauguralOffer} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "linear-gradient(90deg, #d4af37 0%, #e6c256 100%)", color: "white", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(212, 175, 55, 0.4)" }}>
               Claim 3 Months for {activeGold?.symbol}1
             </button>
          ) : (
             <button style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "#d4af37", color: "white", fontWeight: "700", cursor: "pointer" }}>
               Get Gold Yearly
             </button>
          )}
        </div>

        {/* --- PLATINUM PLAN --- */}
        <div style={{ background: "linear-gradient(145deg, #0b2e4a 0%, #1a4f7a 100%)", borderRadius: "16px", padding: "35px", position: "relative", color: "white", boxShadow: "0 10px 40px rgba(11, 46, 74, 0.25)" }}>
          <h3 style={{ color: "#4fc3f7", fontSize: "1.4rem", fontWeight: "600", marginBottom: "10px" }}>Platinum Partner</h3>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "white", marginBottom: "20px" }}>
            {activePlat?.symbol}{getPrice(activePlat)} <span style={{ fontSize: "0.9rem", color: "#81d4fa", fontWeight: "500" }}>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
          </div>
          {billingCycle === "yearly" && <div style={{color:"#4fc3f7", fontSize:"0.9rem", fontWeight:"bold", marginBottom:"20px"}}>2 Months Free!</div>}

          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 30px 0", lineHeight: "2.2", fontSize: "0.95rem" }}>
            <li style={{ color: "#e0e0e0" }}>✅ <strong>Everything in Gold</strong></li>
            <li style={{ color: "#e0e0e0" }}>🎥 Upload Videos up to <strong>3 Hours</strong></li>
            <li style={{ color: "#e0e0e0" }}>💾 <strong>500 GB</strong> Massive Storage</li>
            <li style={{ color: "#e0e0e0" }}>💎 <strong>Platinum Verification Badge</strong></li>
            <li style={{ color: "#e0e0e0" }}>🌍 Featured on Homepage</li>
            <li style={{ color: "#e0e0e0" }}>📺 4K Video Support</li>
            <li style={{ color: "#e0e0e0" }}>📡 <strong>Live Streaming</strong> (Coming Soon)</li>
            <li style={{ color: "#e0e0e0" }}>🏛️ Ministry Tools for Pastors</li>
            <li style={{ color: "#e0e0e0" }}>⚡ Early Access to New Features</li>
            <li style={{ color: "#e0e0e0" }}>💙 Direct Line to Founders</li>
          </ul>
          
          <button style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "#29b6f6", color: "#0b2e4a", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 10px rgba(41, 182, 246, 0.4)" }}>
            Get Platinum
          </button>
        </div>

      </div>

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#666" }}>⬅ Back to Dashboard</Link>
      </div>
    </div>
  );
}