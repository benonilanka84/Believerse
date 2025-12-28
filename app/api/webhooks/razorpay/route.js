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
      const notes = payload.payload.payment.entity.notes;
      const { userId, planType } = notes;

      if (userId && planType) {
        // Calculate 30-day end date
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        // Update Database
        await supabaseAdmin
          .from("profiles")
          .update({ 
            subscription_plan: planType,
            subscription_end_date: endDate.toISOString() 
          })
          .eq("id", userId);

        // Notify User
        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          content: `Your ${planType} plan is now active! Thank you for walking with us. 👑`,
          type: "system",
          link: "/dashboard"
        });
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}