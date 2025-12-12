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
      // 1. Create Order
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount }),
      });
      const order = await response.json();

      if (order.error) throw new Error(order.error);

      // 2. Open Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "The Believerse",
        description: `${planName} Membership`,
        order_id: order.id,
        handler: async function (response) {
          // 3. Save to DB
          const { error } = await supabase.from('profiles').update({ 
            subscription_plan: planName, 
            subscription_status: 'active',
            payment_id: response.razorpay_payment_id 
          }).eq('id', user.id);

          if (!error) {
            alert(`🎉 You are now a ${planName} Member!`);
            router.push("/dashboard");
          }
        },
        prefill: { email: user.email },
        theme: { color: "#2e8b57" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      alert("Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "50px 20px", background: "#f8f9fa", minHeight: "100vh" }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ color: "#0b2e4a", fontSize: "36px", marginBottom: "10px" }}>Choose Your Walk</h1>
        <p style={{ color: "#666", marginBottom: "50px", fontSize: "18px" }}>Unlock the full power of The Believerse community.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
          
          {/* STANDARD (FREE) */}
          <div style={{ background: "white", padding: "40px", borderRadius: "16px", border: "1px solid #ddd" }}>
            <h3 style={{ color: "#666", fontSize: "24px", marginBottom: "10px" }}>Standard</h3>
            <div style={{ fontSize: "42px", fontWeight: "bold", color: "#333", marginBottom: "20px" }}>Free</div>
            <ul style={{ textAlign: "left", color: "#555", lineHeight: "2.5", listStyle: "none", padding: 0, marginBottom: "30px" }}>
              <li>✅ View All Content</li>
              <li>✅ Post Prayer Requests</li>
              <li>✅ Join 1 Fellowship</li>
              <li style={{ opacity: 0.5 }}>❌ Upload Glimpses</li>
              <li style={{ opacity: 0.5 }}>❌ Create Fellowships</li>
            </ul>
            <button style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "none", background: "#f0f0f0", color: "#666", fontWeight: "bold", fontSize: "16px" }}>Current Plan</button>
          </div>

          {/* GOLD (99) */}
          <div style={{ background: "white", padding: "40px", borderRadius: "16px", border: "2px solid #d4af37", position: "relative", boxShadow: "0 10px 30px rgba(212, 175, 55, 0.15)" }}>
            <div style={{ position: "absolute", top: "-15px", left: "50%", transform: "translateX(-50%)", background: "#d4af37", color: "white", padding: "5px 15px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>MOST POPULAR</div>
            <h3 style={{ color: "#d4af37", fontSize: "24px", marginBottom: "10px" }}>Gold</h3>
            <div style={{ fontSize: "42px", fontWeight: "bold", color: "#333", marginBottom: "20px" }}>₹99 <span style={{ fontSize: "16px", color: "#999", fontWeight: "normal" }}>/mo</span></div>
            <ul style={{ textAlign: "left", color: "#555", lineHeight: "2.5", listStyle: "none", padding: 0, marginBottom: "30px" }}>
              <li>✅ <b>Upload Glimpses</b> (Unlimited)</li>
              <li>✅ <b>Create Fellowships</b></li>
              <li>✅ Join Unlimited Fellowships</li>
              <li>✅ Gold Profile Badge 🥇</li>
            </ul>
            <button onClick={() => handlePayment("Gold", 99)} disabled={loading} style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "none", background: "#d4af37", color: "white", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>{loading ? "Processing..." : "Get Gold"}</button>
          </div>

          {/* PLATINUM (499) */}
          <div style={{ background: "#0b2e4a", padding: "40px", borderRadius: "16px", color: "white" }}>
            <h3 style={{ color: "#4fc3f7", fontSize: "24px", marginBottom: "10px" }}>Platinum</h3>
            <div style={{ fontSize: "42px", fontWeight: "bold", color: "white", marginBottom: "20px" }}>₹499 <span style={{ fontSize: "16px", color: "#aaa", fontWeight: "normal" }}>/mo</span></div>
            <ul style={{ textAlign: "left", color: "#e0e0e0", lineHeight: "2.5", listStyle: "none", padding: 0, marginBottom: "30px" }}>
              <li>✅ <b>Everything in Gold</b></li>
              <li>✅ <b>Priority Support</b></li>
              <li>✅ Platinum Verification Badge 💎</li>
              <li>✅ Featured on Homepage</li>
              <li>✅ Early Access to New Features</li>
            </ul>
            <button onClick={() => handlePayment("Platinum", 499)} disabled={loading} style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "none", background: "#4fc3f7", color: "#0b2e4a", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>{loading ? "Processing..." : "Get Platinum"}</button>
          </div>

        </div>
      </div>
    </div>
  );
}