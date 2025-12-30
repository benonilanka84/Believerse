import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, full_name } = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'The Believerse <support@thebelieverse.com>',
      to: email,
      subject: 'Account Closure Confirmation',
      templateId: 'account-deletion-confirmation', // Alias from Resend Dashboard
      variables: {
        full_name: full_name //
      },
      text: `Peace be with you, ${full_name}. Your account has been closed.` //
    });

    if (error) return NextResponse.json({ error }, { status: 422 });
    return NextResponse.json({ message: 'Closure email sent', id: data.id });
  } catch (err) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}