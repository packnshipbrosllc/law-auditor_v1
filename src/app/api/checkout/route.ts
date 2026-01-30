import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAudit } from '@/lib/db';

// Lazy-initialize Stripe to avoid build-time errors when STRIPE_SECRET_KEY is not set
async function getStripeClient() {
  const Stripe = (await import('stripe')).default;
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
  });
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { auditId } = await req.json();
    if (!auditId) {
      return NextResponse.json({ error: "Audit ID required" }, { status: 400 });
    }

    const audit = await getAudit(auditId);
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Success fee in cents for Stripe
    const amountInCents = Math.round(Number(audit.success_fee) * 100);

    const stripe = await getStripeClient();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'LawAuditor Itemized Evidence Unlock',
              description: `Success fee for audit ${auditId}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://lawauditor.com'}/dashboard?session_id={CHECKOUT_SESSION_ID}&audit_id=${auditId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://lawauditor.com'}/dashboard?audit_id=${auditId}`,
      metadata: {
        auditId: auditId,
        userId: userId,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('[Stripe Checkout Error]:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

