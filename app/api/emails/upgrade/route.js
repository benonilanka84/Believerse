import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, full_name, tier_name } = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'The Believerse <support@thebelieverse.com>',
      to: email,
      subject: `Your ${tier_name} Stewardship is Confirmed`,
      // This matches the ALIAS in your Resend Dashboard
      template: 'tier-membership-confirmation', 
      variables: {
        full_name: full_name, 
        tier_name: tier_name  
      }
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json({ error }, { status: 422 });
    }

    return NextResponse.json({ message: 'Upgrade email sent', data });
  } catch (err) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}