import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // 1. Extract new metadata fields from the request
    const { amount, currency, userId, planName } = await request.json();

    // 2. Initialize Razorpay with your Live ENV variables
    // Ensure these are set in your .env.local file
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 3. Configure the Order Options
    const options = {
      // Razorpay expects amount in paise (e.g., 99 INR = 9900 paise)
      amount: Math.round(amount * 100), 
      currency: currency,
      receipt: "receipt_" + Math.random().toString(36).substring(7),
      
      // CRITICAL: Metadata for Webhooks and Manual Verification
      // This is the "ID badge" for the transaction
      notes: {
        userId: userId,
        planType: planName.toLowerCase().includes("platinum") ? "platinum" : "gold"
      }
    };

    // 4. Create the Order
    const order = await razorpay.orders.create(options);

    // 5. Return the order object to the frontend
    return NextResponse.json({ order }, { status: 200 });

  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    return NextResponse.json(
      { message: error.message || "Error creating order" },
      { status: 500 }
    );
  }
}