import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      planName, 
      billingCycle,
      userId 
    } = await request.json();

    const secret = process.env.RAZORPAY_KEY_SECRET;

    // 1. Verify Signature (Security Check)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ message: "Invalid Signature" }, { status: 400 });
    }

    // 2. Calculate End Date
    const now = new Date();
    let endDate = new Date();
    if (billingCycle === "monthly") {
      endDate.setMonth(now.getMonth() + 1);
    } else {
      endDate.setFullYear(now.getFullYear() + 1);
    }

    // 3. Update Supabase
    // Note: We use 'subscription_plan' based on your database column name
    const { error } = await supabase
      .from('profiles')
      .update({ 
        subscription_plan: planName.toLowerCase().includes("platinum") ? "platinum" : "gold",
        subscription_end_date: endDate.toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ message: "Success", plan: planName }, { status: 200 });

  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.json({ message: "Verification Failed" }, { status: 500 });
  }
}