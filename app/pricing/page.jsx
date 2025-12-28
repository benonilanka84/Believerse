"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PricingPage() {
  const [currency, setCurrency] = useState("USD"); 
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [loadingGeo, setLoadingGeo] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const router = useRouter();

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

  // --- 2. PAYMENT LOGIC ---
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async (planName, planObj) => {
    setProcessing(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please log in or sign up to upgrade your plan.");
      router.push("/login");
      setProcessing(false);
      return;
    }

    const res = await loadRazorpayScript();
    if (!res) {
      alert("Payment gateway failed to load.");
      setProcessing(false);
      return;
    }

    const amount = getPrice(planObj);
    
    try {
      // 1. Create Order with Metadata
      const response = await fetch("/api/razorpay", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: amount, 
          currency: currency,
          userId: user.id, // Passed to Razorpay Notes
          planName: planName // Passed to Razorpay Notes
        }), 
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Order failed");

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: data.order.amount,
        currency: data.order.currency,
        name: "The Believerse",
        description: `${planName} Subscription`,
        image: "/images/final-logo.png",
        order_id: data.order.id,
        handler: async function (response) {
          // 3. Manual Verification (Immediate update)
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planName: planName,
              billingCycle: billingCycle,
              userId: user.id
            })
          });

          if (verifyRes.ok) {
            alert("Hallelujah! Your account has been upgraded.");
            window.location.href = "/dashboard";
          } else {
            alert("Payment verified, but account update is pending. Please check your profile in 5 minutes.");
          }
        },
        prefill: { email: user.email },
        theme: { color: "#d4af37" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error(error);
      alert("Initialization failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleInauguralOffer = () => {
    handlePurchase("Gold", { monthly: 1, yearly: 1 }); 
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafd", padding: "40px 20px" }}>
      
      {/* INAUGURAL BANNER */}
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
            <br/><span style={{fontSize:"0.85rem", opacity:0.8}}>Professional digital content access for early believers.</span>
          </p>
        </div>
      )}

      {/* HERO */}
      <div style={{ textAlign: "center", marginBottom: "40px", maxWidth: "800px", margin: "0 auto 40px auto" }}>
        <h1 style={{ color: "#0b2e4a", fontSize: "2.8rem", fontWeight: "800", marginBottom: "15px" }}>
          Premium Access
        </h1>
        
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
            >Monthly</button>
            <button 
                onClick={() => setBillingCycle("yearly")}
                style={{
                    padding: "10px 25px", borderRadius: "25px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "14px",
                    background: billingCycle === "yearly" ? "white" : "transparent",
                    color: billingCycle === "yearly" ? "#0b2e4a" : "#666",
                    boxShadow: billingCycle === "yearly" ? "0 2px 5px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.3s"
                }}
            >Yearly <span style={{fontSize:"10px", color:"#2e8b57", marginLeft:"4px"}}>(Save 17%)</span></button>
        </div>
      </div>

      {/* PLANS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "25px", maxWidth: "1200px", margin: "0 auto 60px auto" }}>

        {/* COMMUNITY (FREE) */}
        <div style={{ background: "white", borderRadius: "16px", padding: "35px", border: "1px solid #eee" }}>
          <h3 style={{ color: "#666", fontSize: "1.4rem", fontWeight: "600", marginBottom: "10px" }}>Community</h3>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "#333", marginBottom: "20px" }}>Free</div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 30px 0", lineHeight: "2.2", fontSize: "0.95rem" }}>
            <li>📖 Unlimited Content Access</li>
            <li>🙏 Post Prayer Requests</li>
            <li>🛡️ <strong>100% Privacy</strong></li>
            <li>✨ Standard Profile Badge</li>
            <li style={{ color: "#999" }}>❌ Create Fellowships</li>
            <li style={{ color: "#999" }}>❌ Long Video Uploads</li>
          </ul>
          <button style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #ccc", background: "white", color: "#666", fontWeight: "700" }}>Current Plan</button>
        </div>

        {/* GOLD */}
        <div style={{ background: "white", borderRadius: "16px", padding: "35px", border: "2px solid #d4af37", position: "relative", boxShadow: "0 10px 30px rgba(212, 175, 55, 0.15)" }}>
          <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#d4af37", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>CREATOR FAVORITE</div>
          <h3 style={{ color: "#d4af37", fontSize: "1.4rem", fontWeight: "600", marginBottom: "10px" }}>Gold Supporter</h3>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "#333", marginBottom: "20px" }}>
            {activeGold?.symbol}{getPrice(activeGold)} <span style={{ fontSize: "0.9rem", color: "#999", fontWeight: "500" }}>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 30px 0", lineHeight: "2.2", fontSize: "0.95rem" }}>
            <li>🚫 <strong>Ad-Free Experience</strong></li>
            <li>📹 <strong>Unlimited</strong> Glimpses</li>
            <li>🎥 60 Min Video Uploads</li>
            <li>💾 <strong>50 GB</strong> Storage</li>
            <li>👥 Create & Lead Fellowships</li>
            <li>🥇 <strong>Gold Profile Badge</strong></li>
          </ul>
          {billingCycle === "monthly" ? (
             <button onClick={handleInauguralOffer} disabled={processing} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "linear-gradient(90deg, #d4af37 0%, #e6c256 100%)", color: "white", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(212, 175, 55, 0.4)" }}>
               {processing ? "Processing..." : `Claim Offer: ${activeGold?.symbol}1`}
             </button>
          ) : (
             <button onClick={() => handlePurchase("Gold", activeGold)} disabled={processing} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "#d4af37", color: "white", fontWeight: "700", cursor: "pointer" }}>
               {processing ? "Processing..." : "Get Gold Yearly"}
             </button>
          )}
        </div>

        {/* PLATINUM */}
        <div style={{ background: "linear-gradient(145deg, #0b2e4a 0%, #1a4f7a 100%)", borderRadius: "16px", padding: "35px", position: "relative", color: "white", boxShadow: "0 10px 40px rgba(11, 46, 74, 0.25)" }}>
          <h3 style={{ color: "#4fc3f7", fontSize: "1.4rem", fontWeight: "600", marginBottom: "10px" }}>Platinum Partner</h3>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "white", marginBottom: "20px" }}>
            {activePlat?.symbol}{getPrice(activePlat)} <span style={{ fontSize: "0.9rem", color: "#81d4fa", fontWeight: "500" }}>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 30px 0", lineHeight: "2.2", fontSize: "0.95rem" }}>
            <li>✅ Everything in Gold</li>
            <li>🎥 3 Hour Video Uploads</li>
            <li>💾 <strong>500 GB</strong> Storage</li>
            <li>💎 <strong>Platinum Verification</strong></li>
            <li>🏛️ Ministry Content Tools</li>
            <li>💙 Founder Priority Access</li>
          </ul>
          <button onClick={() => handlePurchase("Platinum", activePlat)} disabled={processing} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "#29b6f6", color: "#0b2e4a", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 10px rgba(41, 182, 246, 0.4)" }}>
            {processing ? "Processing..." : "Get Platinum"}
          </button>
        </div>

      </div>

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#666" }}>⬅ Back to Dashboard</Link>
      </div>
    </div>
  );
}