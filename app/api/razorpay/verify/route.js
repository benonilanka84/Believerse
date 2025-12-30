import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { Resend } from 'resend';

// Initialize Resend with your API Key from .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_subscription_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      planName, 
      userId 
    } = await request.json();

    const secret = process.env.RAZORPAY_KEY_SECRET;

    /**
     * 1. VERIFY SIGNATURE (Security Check)
     */
    const body = (razorpay_subscription_id || razorpay_order_id) + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ message: "Invalid Signature" }, { status: 400 });
    }

    /**
     * 2. CALCULATE END DATE
     */
    const now = new Date();
    let endDate = new Date();
    endDate.setMonth(now.getMonth() + 4); // 3 months trial + 1 month paid

    /**
     * 3. UPDATE SUPABASE AND FETCH PROFILE DATA
     */
    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .update({ 
        subscription_tier: planName.toLowerCase(),
        subscription_end_date: endDate.toISOString()
      })
      .eq('id', userId)
      .select('email, full_name') // Fetching data for the email
      .single();

    if (dbError) throw dbError;

    /**
     * 4. TRIGGER PROFESSIONAL UPGRADE EMAIL VIA RESEND
     */
    if (profile?.email) {
      await resend.emails.send({
        from: 'The Believerse <support@thebelieverse.com>', // Sent from your Workspace
        to: profile.email,
        subject: `👑 Your ${planName} Kingdom Upgrade is Active`,
        html: `
          <div style="background-color: #f8fafd; padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <div style="background: white; padding: 40px; border-radius: 20px; max-width: 600px; margin: auto; border: 2px solid #d4af37; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://thebelieverse.com/images/final-logo.png" alt="The Believerse" width="180">
              </div>
              <h1 style="color: #0b2e4a; font-size: 24px; text-align: center;">Hallelujah, ${profile.full_name || 'Believer'}!</h1>
              <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                Your upgrade to <strong>${planName}</strong> is complete. Your inaugural 3-month trial has been activated as part of our Genesis rollout.
              </p>
              <div style="background: #fffdf5; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #f9d976;">
                <h3 style="color: #d4af37; margin-top: 0; font-size: 16px;">What's New in Your Sanctuary:</h3>
                <ul style="color: #334155; padding-left: 20px; font-size: 15px; line-height: 1.8;">
                  <li>🚫 Ad-Free Content Access</li>
                  <li>📹 Unlimited Glimpses</li>
                  <li>🎥 Extended Video Uploads</li>
                  <li>🏛️ Ministry Partner Tools</li>
                </ul>
              </div>
              <div style="text-align: center; margin-top: 35px;">
                <a href="https://thebelieverse.com/dashboard" style="display: inline-block; background: #d4af37; color: white; padding: 16px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">Open the Dashboard</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 35px 0;">
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                <a href="https://thebelieverse.com/terms" style="color: #94a3b8; text-decoration: none;">Terms of Service</a> | 
                <a href="https://thebelieverse.com/privacy" style="color: #94a3b8; text-decoration: none;">Privacy Policy</a>
                <br><br>© 2025 The Believerse. All rights reserved.
              </p>
            </div>
          </div>
        `
      });
    }

    return NextResponse.json({ message: "Success" }, { status: 200 });

  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.json({ message: "Verification Failed" }, { status: 500 });
  }
}