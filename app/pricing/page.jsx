"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PricingPage() {
  
  const [showExplanation, setShowExplanation] = useState(false);
  const [currency, setCurrency] = useState("USD"); // Default
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [loadingGeo, setLoadingGeo] = useState(true);

  // --- 1. PRICING CONFIGURATION ---
  const pricing = {
    gold: {
      INR: { monthly: 99, yearly: 999, symbol: "₹", label: "🇮🇳 India (INR)" },
      GBP: { monthly: 8, yearly: 80, symbol: "£", label: "🇬🇧 UK (GBP)" },
      SGD: { monthly: 10, yearly: 100, symbol: "S$", label: "🇸🇬 Singapore (SGD)" },
      USD: { monthly: 4.99, yearly: 49.99, symbol: "$", label: "🇺🇸 Global (USD)" }
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
            Get <strong>3 Months of Gold</strong> for just <strong>{activeGold.symbol}1</strong>. 
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
        <div style={{ background: "#e0e0e0", borderRadius: "30px", padding: "4px", display: "inline-flex", marginBottom:"20px" }}>
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

        {/* REGION DETECTED */}
        <div style={{ opacity: loadingGeo ? 0.5 : 1 }}>
            <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{
                    appearance: "none", background: "transparent", border: "none", 
                    fontSize: "13px", fontWeight: "bold", color: "#666", cursor: "pointer", 
                    textAlign: "center", textDecoration: "underline"
                }}
            >
                {Object.keys(pricing.gold).map((code) => (
                    <option key={code} value={code}>{pricing.gold[code].label}</option>
                ))}
            </select>
        </div>
      </div>

      {/* CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "25px", maxWidth: "1200px", margin: "0 auto 60px auto" }}>

        {/* FREE PLAN */}
        <div style={{ background: "white", borderRadius: "16px", padding: "35px", border: "1px solid #eee" }}>
          <h3 style={{ color: "#666", fontSize: "1.4rem", fontWeight: "600" }}>Community</h3>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "#333", marginBottom: "25px" }}>Free</div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 30px 0", lineHeight: "2.2", fontSize: "0.95rem" }}>
            <li>📖 View All Content</li>
            <li>🙏 Post Prayer Requests</li>
            <li>💾 500 MB Storage</li>
            <li style={{ color: "#999" }}>❌ No Long Videos</li>
          </ul>
          <button style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #ccc", background: "white", color: "#666", fontWeight: "700" }}>Current Plan</button>
        </div>

        {/* GOLD PLAN */}
        <div style={{ background: "white", borderRadius: "16px", padding: "35px", border: "2px solid #d4af37", position: "relative", boxShadow: "0 10px 30px rgba(212, 175, 55, 0.1)" }}>
          <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#d4af37", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>CREATOR FAVORITE</div>
          <h3 style={{ color: "#d4af37", fontSize: "1.4rem", fontWeight: "600" }}>Gold Supporter</h3>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "#333", marginBottom: "5px" }}>
            {activeGold.symbol}{getPrice(activeGold)} <span style={{ fontSize: "0.9rem", color: "#999", fontWeight: "500" }}>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
          </div>
          
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 30px 0", lineHeight: "2.2", fontSize: "0.95rem" }}>
            <li>🚫 <strong>Ad-Free</strong></li>
            <li>📹 Unlimited Glimpses</li>
            <li>💾 50 GB Storage</li>
            <li>🎥 Long Videos (60 mins)</li>
          </ul>

          {/* INAUGURAL OFFER BUTTON */}
          {billingCycle === "monthly" ? (
             <button onClick={handleInauguralOffer} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "linear-gradient(90deg, #d4af37 0%, #e6c256 100%)", color: "white", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(212, 175, 55, 0.4)" }}>
               Claim 3 Months for {activeGold.symbol}1
             </button>
          ) : (
             <button style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "#d4af37", color: "white", fontWeight: "700", cursor: "pointer" }}>
               Get Gold Yearly
             </button>
          )}
        </div>

        {/* PLATINUM PLAN */}
        <div style={{ background: "linear-gradient(145deg, #0b2e4a 0%, #1a4f7a 100%)", borderRadius: "16px", padding: "35px", position: "relative", color: "white" }}>
          <h3 style={{ color: "#4fc3f7", fontSize: "1.4rem", fontWeight: "600" }}>Platinum Partner</h3>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "white", marginBottom: "5px" }}>
            {activePlat.symbol}{getPrice(activePlat)} <span style={{ fontSize: "0.9rem", color: "#81d4fa", fontWeight: "500" }}>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 30px 0", lineHeight: "2.2", fontSize: "0.95rem" }}>
            <li>✅ Everything in Gold</li>
            <li>💾 <strong>500 GB</strong> Storage</li>
            <li>🎥 Long Videos (3 Hours)</li>
            <li>💎 Verified Badge</li>
          </ul>
          <button style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "#29b6f6", color: "#0b2e4a", fontWeight: "700", cursor: "pointer" }}>
            Get Platinum
          </button>
        </div>

      </div>

      {/* BLESS SECTION */}
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", background: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 5px 20px rgba(0,0,0,0.05)" }}>
        <h2 style={{ color: "#2e8b57", marginBottom: "15px" }}>🕊️ Bless The Believerse</h2>
        <p style={{ color: "#666", marginBottom: "25px" }}>
            {currency === "INR" 
                ? "Use any UPI app to support the mission instantly with zero fees." 
                : `International supporters in ${currency} can bless the platform using secure card payments.`}
        </p>
        
        {currency === "INR" ? (
            <div style={{ display: "flex", justifyContent: "center", gap: "15px", flexWrap: "wrap" }}>
                <button style={{ padding: "12px 25px", borderRadius: "30px", border: "1px solid #2e8b57", background: "white", color: "#2e8b57", fontWeight: "600" }}>₹100</button>
                <button style={{ padding: "12px 25px", borderRadius: "30px", border: "1px solid #2e8b57", background: "white", color: "#2e8b57", fontWeight: "600" }}>₹500</button>
                <button style={{ padding: "12px 25px", borderRadius: "30px", border: "none", background: "#2e8b57", color: "white", fontWeight: "600" }}>Custom UPI</button>
            </div>
        ) : (
            <div style={{ display: "flex", justifyContent: "center", gap: "15px", flexWrap: "wrap" }}>
                <button style={{ padding: "12px 25px", borderRadius: "30px", border: "1px solid #0b2e4a", background: "white", color: "#0b2e4a", fontWeight: "600" }}>
                   {activeGold.symbol}{currency === "USD" ? "5" : "5"}
                </button>
                <button style={{ padding: "12px 25px", borderRadius: "30px", border: "1px solid #0b2e4a", background: "white", color: "#0b2e4a", fontWeight: "600" }}>
                   {activeGold.symbol}{currency === "USD" ? "10" : "10"}
                </button>
                <button style={{ padding: "12px 25px", borderRadius: "30px", border: "none", background: "#0b2e4a", color: "white", fontWeight: "600" }}>
                   Custom Card
                </button>
            </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#666" }}>⬅ Back to Dashboard</Link>
      </div>
    </div>
  );
}