import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, full_name } = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'The Believerse <support@thebelieverse.com>',
      to: email,
      subject: 'Welcome to The Believerse',
      // This uses your Resend Template ID
      template_id: 'regular-believer-welcome', 
      variables: {
        full_name: full_name // Matches {{full_name}} in your template
      }
    });

    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ message: 'Welcome email sent' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}