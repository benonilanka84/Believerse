import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { amount, currency, userId, planName, isSubscription } = await request.json();

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    /**
     * 1. HANDLE RECURRING SUBSCRIPTIONS (The Mandate Fix)
     * This handles the "₹1 now, ₹99 later" logic with a 90-day trial.
     */
    if (isSubscription) {
      const planIds = {
        gold: {
          INR: "plan_RxmD0A5BsEPFJt",
          USD: "plan_RxmN4EVBCoUfib",
          GBP: "plan_RxmPTihjsNz7dw",
          SGD: "plan_RxmQa5C1rNN9Pm"
        },
        platinum: {
          INR: "plan_RxmTyBhIdD8Aqy",
          USD: "plan_RxmVDcfxxnQYv9",
          GBP: "plan_RxmW5wtJpnwZ4H",
          SGD: "plan_RxmWijTPrBmKhU"
        }
      };

      // Select the specific ID based on user choice
      const selectedPlanId = planIds[planName.toLowerCase()][currency] || planIds[planName.toLowerCase()]["USD"];

      const subscriptionOptions = {
        plan_id: selectedPlanId,
        total_count: 12, // Number of billing cycles
        quantity: 1,
        customer_notify: 1,
        
        // Start billing for the recurring amount (e.g., ₹99) after 90 days
        start_at: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), 

        // FORCING THE ₹1 CHARGE
        // This 'Add-on' ensures the user sees exactly 1 unit (₹1) in their UPI/Bank app.
        addons: [
          {
            item: {
              name: "Inaugural Activation Fee",
              amount: 100, // 100 paise = 1 unit (e.g., ₹1 or $1)
              currency: currency
            }
          }
        ],
        
        notes: {
          userId: userId,
          planName: planName.toLowerCase()
        }
      };

      const subscription = await razorpay.subscriptions.create(subscriptionOptions);
      return NextResponse.json({ subscriptionId: subscription.id }, { status: 200 });
    }

    /**
     * 2. HANDLE STANDARD ORDERS (One-time Yearly)
     */
    const orderOptions = {
      amount: Math.round(amount * 100), 
      currency: currency,
      receipt: "receipt_" + Math.random().toString(36).substring(7),
      notes: { userId, planType: planName.toLowerCase() }
    };

    const order = await razorpay.orders.create(orderOptions);
    return NextResponse.json({ order }, { status: 200 });

  } catch (error) {
    console.error("Razorpay Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}