import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Use Service Role Key for Admin privileges (bypasses RLS)
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 400 });
    }

    const payload = JSON.parse(body);
    
    // 2. Handle Payment Captured
    if (payload.event === "payment.captured") {
      const paymentEntity = payload.payload.payment.entity;
      const notes = paymentEntity.notes;
      const { userId, planType } = notes;

      if (userId && planType) {
        // Calculate 30-day end date
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        // Update Database
        const { data: profile, error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ 
            subscription_plan: planType, // Legacy field
            subscription_tier: planType.toLowerCase(), // New tier field for badges
            subscription_end_date: endDate.toISOString() 
          })
          .eq("id", userId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Notify User in Dashboard
        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          content: `Your ${planType} plan is now active! Thank you for walking with us. 👑`,
          type: "system",
          link: "/dashboard"
        });

        // 3. Trigger Upgrade Email via Resend
        // We call our existing internal API route to handle the Resend dispatch
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/emails/upgrade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: profile.email,
              full_name: profile.full_name || "The Believer", // Fallback if name is missing
              tier_name: planType // Passes "Gold" or "Platinum" to {{tier_name}}
            })
          });
        } catch (emailErr) {
          console.error("Email trigger failed:", emailErr);
          // We don't throw here to avoid Razorpay retrying a successful payment update
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}