import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import * as z from 'zod';

const contactSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  console.log('[API] Lead Capture Request Received');
  
  try {
    // COMPLIANCE: Ephemeral processing only. No PII persisted per CCPA 2026.
    const body = await request.json();
    console.log('[API] Payload:', body);

    const validation = contactSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('[API] Validation Failed:', validation.error.format());
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { email } = validation.data;
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.warn('[API] CRITICAL: RESEND_API_KEY is missing. Falling back to console log.');
      console.log('--- LEAD CAPTURE (DEV MODE) ---');
      console.log('Email:', email);
      console.log('-------------------------------');
      return NextResponse.json({ 
        message: 'Success (Development Mode: Lead Logged)', 
        email,
        debug: 'RESEND_API_KEY not configured'
      });
    }

    const resend = new Resend(apiKey);
    console.log('[API] Initializing Resend with API Key');

    // For production, this must be a verified domain in Resend.
    // For testing, Resend allows 'onboarding@resend.dev'
    const fromAddress = 'LawAuditor Leads <leads@lawauditor.com>';
    
    console.log('[API] Attempting to send email via Resend...');
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: ['john.dillard@lawauditor.com'],
      subject: 'New Enterprise Lead: LawAuditor.com',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #020617;">New Enterprise Lead</h2>
          <p>A new user has requested a demo/analysis on LawAuditor.com.</p>
          <p><strong>Work Email:</strong> ${email}</p>
          <hr style="border: 1px solid #eee;" />
          <p style="font-size: 12px; color: #666;">This lead was captured via the secure LawAuditor.com contact portal.</p>
        </div>
      `,
    });

    if (error) {
      console.error('[API] Resend Error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('[API] Email Sent Successfully:', data?.id);
    return NextResponse.json({ message: 'Success', id: data?.id });
  } catch (err) {
    console.error('[API] Unexpected Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
