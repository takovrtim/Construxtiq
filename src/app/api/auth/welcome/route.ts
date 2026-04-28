import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/email'
import { format, addDays } from 'date-fns'

export async function POST(req: NextRequest) {
  const { user_id } = await req.json().catch(() => ({}))
  if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

  const admin = createAdminSupabase()
  const { data: user } = await admin
    .from('users')
    .select('email, full_name, trial_ends_at')
    .eq('id', user_id)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const trialEnd = user.trial_ends_at
    ? format(new Date(user.trial_ends_at), 'MMMM d, yyyy')
    : format(addDays(new Date(), 14), 'MMMM d, yyyy')

  try {
    await sendWelcomeEmail({ to: user.email, userName: user.full_name || 'there', trialEndsAt: trialEnd })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
  }
}
