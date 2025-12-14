import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { amount, currency } = await request.json();

    // 1. Initialize Razorpay with your ENV variables
    // Ensure these are set in your .env.local file
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 2. Create Order
    const options = {
      // Razorpay expects amount in paise (e.g., 9900 paise = 99 INR)
      amount: Math.round(amount * 100), 
      currency: currency,
      receipt: "receipt_" + Math.random().toString(36).substring(7),
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ order }, { status: 200 });

  } catch (error) {
    console.error("Razorpay Error:", error);
    return NextResponse.json(
      { message: error.message || "Error creating order" },
      { status: 500 }
    );
  }
}