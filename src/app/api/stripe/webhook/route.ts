// ─────────────────────────────────────────────────────────
// POST /api/stripe/webhook
// Stripe sends events here. We update our DB accordingly.
// This MUST be added to Stripe dashboard as webhook endpoint.
// Events to enable: customer.subscription.created,
//   customer.subscription.updated, customer.subscription.deleted,
//   invoice.payment_succeeded, invoice.payment_failed
// ─────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, getPlanFromPriceId, mapStripeStatus } from '@/lib/stripe'
import { createAdminSupabase } from '@/lib/supabase'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const payload = await req.arrayBuffer()
  const buf = Buffer.from(payload)

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(buf, signature)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminSupabase()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const priceId = sub.items.data[0]?.price.id
        const plan = getPlanFromPriceId(priceId) || 'pro'
        const status = mapStripeStatus(sub.status)

        await admin.from('users').update({
          stripe_subscription_id: sub.id,
          subscription_status: status,
          plan,
        }).eq('stripe_customer_id', customerId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        await admin.from('users').update({
          subscription_status: 'canceled',
          stripe_subscription_id: null,
        }).eq('stripe_customer_id', customerId)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await admin.from('users').update({
          subscription_status: 'active',
        }).eq('stripe_customer_id', customerId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await admin.from('users').update({
          subscription_status: 'past_due',
        }).eq('stripe_customer_id', customerId)
        break
      }

      default:
        // Ignore unhandled event types
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
