import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, full_name } = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'The Believerse <support@thebelieverse.com>',
      to: email,
      subject: 'Welcome to the Sanctuary',
      // FIXED: Property name must be 'templateId'
      templateId: 'regular-believer-welcome', 
      variables: {
        full_name: full_name // Matches registered variable
      }
    });

    if (error) return NextResponse.json({ error }, { status: 422 });
    return NextResponse.json({ message: 'Welcome email sent', data });
  } catch (err) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}