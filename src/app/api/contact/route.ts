import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.warn('RESEND_API_KEY is missing. Lead logged to console:', email);
      return NextResponse.json({ message: 'Success (Development Mode: Lead Logged)', email });
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: 'LawAuditor Leads <leads@lawauditor.com>',
      to: ['john.dillard@lawauditor.com'],
      subject: 'New Enterprise Lead: LawAuditor.com',
      html: `<p>New lead requested a demo: <strong>${email}</strong></p>`,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Success', data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
