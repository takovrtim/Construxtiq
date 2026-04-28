// POST /api/stripe/checkout
// Creates a Stripe Checkout session and returns the URL.

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { createStripeCustomer, createCheckoutSession, PRICE_IDS } from '@/lib/stripe'
import { z } from 'zod'

const BodySchema = z.object({
  plan: z.enum(['starter', 'pro', 'company']),
})

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof BodySchema>
  try { body = BodySchema.parse(await req.json()) }
  catch { return NextResponse.json({ error: 'Invalid plan' }, { status: 400 }) }

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id, full_name, email, subscription_status')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Already subscribed — redirect to billing portal instead
  if (profile.subscription_status === 'active') {
    return NextResponse.json({ error: 'Already subscribed. Use billing portal to change plans.' }, { status: 400 })
  }

  let customerId = profile.stripe_customer_id

  // Create Stripe customer if they don't have one
  if (!customerId) {
    const customer = await createStripeCustomer({
      email: profile.email,
      name: profile.full_name || profile.email,
      userId: user.id,
    })
    customerId = customer.id

    await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const priceId = PRICE_IDS[body.plan]
  const session = await createCheckoutSession({
    customerId,
    priceId,
    userId: user.id,
    trialDays: profile.subscription_status === 'trialing' ? undefined : 14,
  })

  return NextResponse.json({ url: session.url })
}
