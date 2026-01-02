"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PricingPage() {
  const [currency, setCurrency] = useState("USD"); 
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [loadingGeo, setLoadingGeo] = useState(true);
  const [processing, setProcessing] = useState(null); 
  const [currentPlan, setCurrentPlan] = useState("free"); 
  
  const router = useRouter();

  const pricing = {
    gold: {
      INR: { monthly: 99, yearly: 999, symbol: "₹" },
      USD: { monthly: 4.99, yearly: 49.99, symbol: "$" }
    },
    platinum: {
      INR: { monthly: 499, yearly: 4999, symbol: "₹" },
      USD: { monthly: 14.99, yearly: 149.99, symbol: "$" }
    }
  };

  useEffect(() => {
    async function initPage() {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        setCurrency(data.country_code === "IN" ? "INR" : "USD");
      } catch (e) { setCurrency("USD"); }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .single();
        // Set state immediately from database
        if (profile) setCurrentPlan(profile.subscription_tier?.toLowerCase().trim() || "free");
      }
      setLoadingGeo(false);
    }
    initPage();
  }, []);

  const activeGold = pricing.gold[currency];
  const activePlat = pricing.platinum[currency];
  const getPrice = (planObj) => billingCycle === "monthly" ? planObj.monthly : planObj.yearly;

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
    setProcessing(planName.toLowerCase());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please log in to upgrade.");
      router.push("/login");
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert("Gateway failed to load.");
      setProcessing(null);
      return;
    }

    try {
      const response = await fetch("/api/razorpay", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: getPrice(planObj), 
          currency,
          userId: user.id,
          planName,
          isSubscription: true 
        }), 
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        ...(data.subscriptionId ? { subscription_id: data.subscriptionId } : { order_id: data.order.id }),
        name: "The Believerse",
        description: `${planName} Plan`,
        image: "/images/final-logo.png",
        handler: async function (res) {
          const verify = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...res, planName, userId: user.id })
          });
          if (verify.ok) {
            alert("Hallelujah! Upgrade successful.");
            window.location.reload();
          }
        },
        prefill: { email: user.email },
        theme: { color: "#d4af37" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafd", padding: "40px 20px" }}>
      
      {billingCycle === "monthly" && (
        <div style={{ 
          background: "linear-gradient(90deg, #d4af37 0%, #f9d976 100%)", 
          color: "#0b2e4a", padding: "15px", borderRadius: "12px", 
          textAlign: "center", maxWidth: "800px", margin: "0 auto 30px auto",
          boxShadow: "0 4px 15px rgba(212, 175, 55, 0.3)", border: "1px solid #fff"
        }}>
          <h3 style={{ margin: "0 0 5px 0", fontSize: "1.2rem" }}>🎉 Inaugural Launch Offer!</h3>
          <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: "500" }}>
            Get <strong>3 Months of Gold</strong> for just <strong>{activeGold?.symbol || "₹"}1</strong>.
            <br/><span style={{fontSize:"0.85rem", opacity:0.8}}>(Auto-renews at ₹99/mo after 90 days)</span>
          </p>
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: "40px", maxWidth: "800px", margin: "0 auto 40px auto" }}>
        <h1 style={{ color: "#0b2e4a", fontSize: "2.8rem", fontWeight: "800", marginBottom: "15px" }}>Premium Access</h1>
        <div style={{ background: "#e0e0e0", borderRadius: "30px", padding: "4px", display: "inline-flex" }}>
            <button onClick={() => setBillingCycle("monthly")} style={{ padding: "10px 25px", borderRadius: "25px", border: "none", cursor: "pointer", fontWeight: "bold", background: billingCycle === "monthly" ? "white" : "transparent", color: "#0b2e4a" }}>Monthly</button>
            <button onClick={() => setBillingCycle("yearly")} style={{ padding: "10px 25px", borderRadius: "25px", border: "none", cursor: "pointer", fontWeight: "bold", background: billingCycle === "yearly" ? "white" : "transparent", color: "#0b2e4a" }}>
              Yearly <span style={{fontSize:"10px", color:"#2e8b57", marginLeft:"4px"}}>(Save 17%)</span>
            </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "25px", maxWidth: "1200px", margin: "0 auto 60px auto" }}>

        {/* COMMUNITY CARD */}
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "40px", border: "1px solid #e1e8ed" }}>
          <h3 style={{ color: "#5a7184", fontSize: "1.4rem", fontWeight: "600", marginBottom: "10px" }}>Community</h3>
          <div style={{ fontSize: "2.8rem", fontWeight: "800", color: "#0b2e4a", marginBottom: "20px" }}>Free</div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 35px 0", lineHeight: "2.4", fontSize: "1rem", color: "#334155" }}>
            <li>📖 Unlimited Content Access</li>
            <li>🙏 Post Prayer Requests</li>
            <li>🛡️ <strong>100% Privacy</strong></li>
            <li>✨ Standard Profile Badge</li>
            <li style={{ color: "#cbd5e1" }}>❌ Create Fellowships</li>
            <li style={{ color: "#cbd5e1" }}>❌ Long Video Uploads</li>
          </ul>
          <button disabled style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "2px solid #e1e8ed", background: "#f8fafd", color: "#64748b", fontWeight: "700" }}>
            {currentPlan === "free" ? "Current Plan" : "Basic Access"}
          </button>
        </div>

        {/* GOLD CARD */}
        <div style={{ background: "#fffdf5", borderRadius: "20px", padding: "40px", border: "2px solid #d4af37", position: "relative" }}>
          <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#d4af37", color: "white", padding: "6px 16px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "800" }}>CREATOR FAVORITE</div>
          <h3 style={{ color: "#d4af37", fontSize: "1.4rem", fontWeight: "700", marginBottom: "10px" }}>Gold Supporter</h3>
          <div style={{ fontSize: "2.8rem", fontWeight: "800", color: "#0b2e4a", marginBottom: "20px" }}>
            {activeGold?.symbol}{getPrice(activeGold)} <span style={{fontSize:"0.9rem", color:"#64748b"}}>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 35px 0", lineHeight: "2.4", fontSize: "1rem", color: "#334155" }}>
            <li>🚫 <strong>Ad-Free Experience</strong></li>
            <li>📹 <strong>Unlimited</strong> Glimpses</li>
            <li>🎥 60 Min Video Uploads</li>
            <li>💾 <strong>50 GB</strong> Storage</li>
            <li>👥 Create & Lead Fellowships</li>
            <li>🥇 <strong>Gold Profile Badge</strong></li>
          </ul>
          <button 
            onClick={() => handlePurchase("Gold", activeGold)} 
            disabled={processing === 'gold' || currentPlan.includes('gold') || currentPlan.includes('platinum')} 
            style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "none", background: (currentPlan.includes('gold') || currentPlan.includes('platinum')) ? "#f8fafd" : "#d4af37", color: (currentPlan.includes('gold') || currentPlan.includes('platinum')) ? "#64748b" : "white", fontWeight: "800", cursor: "pointer" }}
          >
            {processing === 'gold' ? "Processing..." : (currentPlan.includes('gold') || currentPlan.includes('platinum')) ? "Current Plan" : "Claim Offer: ₹1"}
          </button>
        </div>

        {/* PLATINUM CARD */}
        <div style={{ background: "linear-gradient(145deg, #0b2e4a 0%, #1a4f7a 100%)", borderRadius: "20px", padding: "40px", color: "white" }}>
          <h3 style={{ color: "#4fc3f7", fontSize: "1.4rem", fontWeight: "700", marginBottom: "10px" }}>Platinum Partner</h3>
          <div style={{ fontSize: "2.8rem", fontWeight: "800", color: "white", marginBottom: "20px" }}>
            {activePlat?.symbol}{getPrice(activePlat)} <span style={{fontSize:"0.9rem", color:"#81d4fa"}}>/{billingCycle === "monthly" ? "mo" : "yr"}</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 35px 0", lineHeight: "2.4", fontSize: "1rem" }}>
            <li>✅ Everything in Gold</li>
            <li>🎥 3 Hour Video Uploads</li>
            <li>💾 <strong>500 GB</strong> Storage</li>
            <li>💎 <strong>Platinum Verification</strong></li>
            <li>🏛️ Ministry Content Tools</li>
            <li>💙 Founder Priority Access</li>
          </ul>
          <button 
            onClick={() => handlePurchase("Platinum", activePlat)} 
            disabled={processing === 'platinum' || currentPlan.includes('platinum')} 
            style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "none", background: currentPlan.includes('platinum') ? "#f8fafd" : "#29b6f6", color: currentPlan.includes('platinum') ? "#64748b" : "#0b2e4a", fontWeight: "800", cursor: "pointer" }}
          >
            {processing === 'platinum' ? "Processing..." : currentPlan.includes('platinum') ? "Current Plan" : "Get Platinum"}
          </button>
        </div>
      </div>
    </div>
  );
}