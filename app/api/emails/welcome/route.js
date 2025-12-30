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
      // Property 'templateId' connects to your Alias
      templateId: 'regular-believer-welcome', 
      variables: {
        full_name: full_name // Matches registered variable
      },
      // Safety text ensures the 422 error never returns
      text: `Welcome to The Believerse, ${full_name}! Your walk with Christ begins here.`
    });

    if (error) {
      console.error("Welcome Email Error:", error);
      return NextResponse.json({ error }, { status: 422 });
    }

    return NextResponse.json({ message: 'Welcome email sent', id: data.id });
  } catch (err) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}