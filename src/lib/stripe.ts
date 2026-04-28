// ─────────────────────────────────────────────────────────
// CONSTRUCTIQ — Stripe Service
// All payment operations go through here.
// ─────────────────────────────────────────────────────────

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
})

// Plan price IDs from env
export const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  pro: process.env.STRIPE_PRICE_PRO!,
  company: process.env.STRIPE_PRICE_COMPANY!,
} as const

export type PlanKey = keyof typeof PRICE_IDS

// ── Create Stripe customer ────────────────────────────────
export async function createStripeCustomer(params: {
  email: string
  name: string
  userId: string
}): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: { user_id: params.userId },
  })
}

// ── Create checkout session ───────────────────────────────
export async function createCheckoutSession(params: {
  customerId: string
  priceId: string
  userId: string
  trialDays?: number
}): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: params.customerId,
    payment_method_types: ['card'],
    line_items: [{ price: params.priceId, quantity: 1 }],
    mode: 'subscription',
    subscription_data: params.trialDays
      ? { trial_period_days: params.trialDays }
      : undefined,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=canceled`,
    metadata: { user_id: params.userId },
    allow_promotion_codes: true,
  })
}

// ── Create billing portal session ────────────────────────
export async function createBillingPortalSession(params: {
  customerId: string
}): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })
}

// ── Map Stripe status to our subscription_status ─────────
export function mapStripeStatus(
  status: Stripe.Subscription.Status
): 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' {
  switch (status) {
    case 'trialing': return 'trialing'
    case 'active': return 'active'
    case 'past_due': return 'past_due'
    case 'canceled': return 'canceled'
    case 'unpaid': return 'unpaid'
    default: return 'canceled'
  }
}

// ── Map price ID back to plan name ────────────────────────
export function getPlanFromPriceId(priceId: string): PlanKey | null {
  for (const [plan, id] of Object.entries(PRICE_IDS)) {
    if (id === priceId) return plan as PlanKey
  }
  return null
}

// ── Verify webhook signature ──────────────────────────────
export function constructWebhookEvent(
  payload: Buffer,
  signature: string
): Stripe.Event {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  }
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  )
}
