import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { updateAuditPaidStatus } from '@/lib/db';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Lazy-initialize Stripe to avoid build-time errors when STRIPE_SECRET_KEY is not set
async function getStripeClient() {
  const StripeModule = (await import('stripe')).default;
  return new StripeModule(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;
  const stripe = await getStripeClient();

  try {
    if (!signature || !webhookSecret) {
      event = JSON.parse(body) as Stripe.Event; // Fallback for dev if secret not configured
    } else {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const auditId = session.metadata?.auditId;

    if (auditId) {
      console.log(`[Stripe Webhook] Payment successful for audit: ${auditId}`);
      await updateAuditPaidStatus(auditId, true);
    }
  }

  return NextResponse.json({ received: true });
}

