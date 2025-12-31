import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // 1. Security Check
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid Webhook Signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 400 });
    }

    const payload = JSON.parse(body);
    const event = payload.event;

    // 2. Handle 90-Day Trial Setup (The ₹1 Handshake)
    if (event === "subscription.authenticated") {
      const subscription = payload.payload.subscription.entity;
      const { userId, planType } = subscription.notes;

      if (userId && planType) {
        // Set end date to 90 days from now for the trial
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 90);

        await supabaseAdmin
          .from("profiles")
          .update({ 
            subscription_plan: planType, 
            subscription_tier: planType.toLowerCase(),
            subscription_end_date: trialEndDate.toISOString() 
          })
          .eq("id", userId);

        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          content: `Blessings! Your 90-day trial for ${planType} is now active. 🌿`,
          type: "system",
          link: "/dashboard"
        });
      }
    }

    // 3. Handle Payment Captured (Manual Upgrades or Recurring Charges)
    if (event === "payment.captured") {
      const paymentEntity = payload.payload.payment.entity;
      const { userId, planType } = paymentEntity.notes;

      if (userId && planType) {
        let endDate = new Date();
        const isPlatinum = planType.toLowerCase().includes('platinum');

        if (isPlatinum) {
          // Lifetime for Platinum Partners
          endDate.setFullYear(endDate.getFullYear() + 99);
        } else {
          // Standard 30 days for others
          endDate.setDate(endDate.getDate() + 30);
        }

        const { data: profile, error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ 
            subscription_plan: planType, 
            subscription_tier: planType.toLowerCase(),
            subscription_end_date: endDate.toISOString() 
          })
          .eq("id", userId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Trigger Upgrade Email
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/emails/upgrade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: profile.email || paymentEntity.email, 
              full_name: profile.full_name || "The Believer",
              tier_name: planType 
            })
          });
        } catch (emailErr) {
          console.error("Email dispatch failed:", emailErr);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook Logic Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}