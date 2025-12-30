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
      // Use templateId for the alias name
      templateId: 'tier-membership-confirmation', 
      variables: {
        full_name: full_name, 
        tier_name: tier_name  
      },
      // Fallback text ensures we never get a 422 'Missing html or text' error again
      text: `Greetings ${full_name}, your upgrade to ${tier_name} is confirmed.`
    });

    if (error) {
      console.error("Resend Final Error Check:", error);
      return NextResponse.json({ error }, { status: 422 });
    }

    return NextResponse.json({ message: 'Upgrade email sent', id: data.id });
  } catch (err) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}