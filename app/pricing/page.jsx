"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
    };
    getUser();
  }, []);

  const handlePayment = async (planName, amount) => {
    if (!user) {
      alert("Please login to upgrade.");
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      // 1. Call your backend to create an order
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount }),
      });

      const order = await response.json();

      if (order.error) {
        alert("Order creation failed: " + order.error);
        setLoading(false);
        return;
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
        amount: order.amount,
        currency: order.currency,
        name: "The Believerse",
        description: `${planName} Subscription`,
        order_id: order.id, 
        handler: async function (response) {
          // 3. Payment Success! Update Database
          alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
          
          // Update User Profile in Supabase
          const { error } = await supabase
            .from('profiles')
            .update({ 
                subscription_plan: planName, 
                subscription_status: 'active',
                payment_id: response.razorpay_payment_id 
            })
            .eq('id', user.id);

          if (!error) {
            alert(`Welcome to ${planName}!`);
            router.push("/dashboard");
          } else {
            alert("Payment success but database update failed. Contact support.");
          }
        },
        prefill: {
          email: user.email, 
        },
        theme: {
          color: "#2e8b57",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (err) {
      console.error(err);
      alert("Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
      
      {/* Load Razorpay Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <h1 style={{ color: "#0b2e4a", marginBottom: "10px" }}>Choose Your Walk</h1>
      <p style={{ color: "#666", marginBottom: "40px" }}>Upgrade to unlock Glimpses, Fellowships, and more.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        
        {/* FREE PLAN */}
        <div style={{ border: "1px solid #ddd", borderRadius: "12px", padding: "30px", background: "white" }}>
          <h2 style={{ color: "#555" }}>Standard</h2>
          <div style={{ fontSize: "32px", fontWeight: "bold", margin: "15px 0" }}>Free</div>
          <ul style={{ textAlign: "left", lineHeight: "2", color: "#666", listStyle: "none", padding: 0 }}>
            <li>✅ View The Walk & Glimpses</li>
            <li>✅ Post Prayer Requests</li>
            <li>✅ Join 1 Fellowship</li>
            <li>❌ Create Fellowships</li>
            <li>❌ Upload Glimpses</li>
          </ul>
          <button style={{ width: "100%", padding: "12px", marginTop: "20px", background: "#f0f0f0", border: "none", borderRadius: "8px", fontWeight: "bold", color: "#555", cursor: "not-allowed" }}>Current Plan</button>
        </div>

        {/* GOLD PLAN */}
        <div style={{ border: "2px solid #d4af37", borderRadius: "12px", padding: "30px", background: "#fff9e6", position: "relative" }}>
          <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#d4af37", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>MOST POPULAR</div>
          <h2 style={{ color: "#d4af37" }}>Gold</h2>
          <div style={{ fontSize: "32px", fontWeight: "bold", margin: "15px 0", color: "#d4af37" }}>₹99<span style={{ fontSize: "14px", fontWeight: "normal", color: "#666" }}>/mo</span></div>
          <ul style={{ textAlign: "left", lineHeight: "2", color: "#555", listStyle: "none", padding: 0 }}>
            <li>✅ <b>Upload Unlimited Glimpses</b></li>
            <li>✅ <b>Create & Join Unlimited Fellowships</b></li>
            <li>✅ Gold Profile Badge 🥇</li>
            <li>✅ Zero Ads</li>
          </ul>
          <button 
            onClick={() => handlePayment("Gold", 99)} 
            disabled={loading}
            style={{ width: "100%", padding: "12px", marginTop: "20px", background: "#d4af37", border: "none", borderRadius: "8px", fontWeight: "bold", color: "white", cursor: "pointer" }}
          >
            {loading ? "Processing..." : "Upgrade to Gold"}
          </button>
        </div>

        {/* PLATINUM PLAN */}
        <div style={{ border: "1px solid #0b2e4a", borderRadius: "12px", padding: "30px", background: "#f4faff" }}>
          <h2 style={{ color: "#0b2e4a" }}>Platinum</h2>
          <div style={{ fontSize: "32px", fontWeight: "bold", margin: "15px 0", color: "#0b2e4a" }}>₹499<span style={{ fontSize: "14px", fontWeight: "normal", color: "#666" }}>/mo</span></div>
          <ul style={{ textAlign: "left", lineHeight: "2", color: "#555", listStyle: "none", padding: 0 }}>
            <li>✅ <b>Everything in Gold</b></li>
            <li>✅ <b>Create Events (Upcoming)</b></li>
            <li>✅ Platinum Verification Badge 💎</li>
            <li>✅ Priority Support</li>
            <li>✅ Featured Profile</li>
          </ul>
          <button 
            onClick={() => handlePayment("Platinum", 499)}
            disabled={loading}
            style={{ width: "100%", padding: "12px", marginTop: "20px", background: "#0b2e4a", border: "none", borderRadius: "8px", fontWeight: "bold", color: "white", cursor: "pointer" }}
          >
            {loading ? "Processing..." : "Get Platinum"}
          </button>
        </div>

      </div>
    </div>
  );
}