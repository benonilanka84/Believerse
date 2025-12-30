import { Resend } from 'resend';
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, full_name } = await request.json();

    await resend.emails.send({
      from: 'The Believerse <support@thebelieverse.com>',
      to: email,
      subject: '🕊️ Welcome to the Sanctuary',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 15px;">
          <div style="text-align: center;">
            <img src="https://thebelieverse.com/images/final-logo.png" width="160" />
          </div>
          <h1 style="color: #0b2e4a; text-align: center; margin-top: 30px;">Welcome Home, ${full_name}!</h1>
          <p style="color: #334155; line-height: 1.6;">
            We are honored to have you as a part of The Believerse. This is your digital sanctuary—a place for fellowship, prayer, and sharing glimpses of your journey without noise or ads.
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="https://thebelieverse.com/the-walk" style="background: #d4af37; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Explore The Walk</a>
          </div>
          <p style="font-size: 14px; color: #64748b; text-align: center;">
            "But they who wait for the Lord shall renew their strength..."
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            <a href="https://thebelieverse.com/terms">Terms</a> | <a href="https://thebelieverse.com/privacy">Privacy</a>
            <br />© 2025 The Believerse.
          </p>
        </div>
      `
    });

    return NextResponse.json({ message: "Welcome email sent" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}