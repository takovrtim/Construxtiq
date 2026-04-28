// POST /api/send-reply
// Drafts an AI reply to a subcontractor, optionally logs it.
// The reply is composed by Claude using project + sub context.
// Actual email sending uses Resend if sub has an email on file.

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase'
import { draftSubReply } from '@/lib/ai'
import { z } from 'zod'

const BodySchema = z.object({
  sub_id: z.string().uuid(),
  project_id: z.string().uuid(),
  action: z.enum(['draft', 'send']),
  custom_body: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof BodySchema>
  try { body = BodySchema.parse(await req.json()) }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const admin = createAdminSupabase()

  const [{ data: sub }, { data: project }, { data: profile }, { data: permits }] = await Promise.all([
    supabase.from('subcontractors').select('*').eq('id', body.sub_id).eq('user_id', user.id).single(),
    supabase.from('projects').select('name, jurisdiction').eq('id', body.project_id).eq('user_id', user.id).single(),
    supabase.from('users').select('full_name, email, company_name').eq('id', user.id).single(),
    supabase.from('permits').select('permit_number, special_conditions').eq('project_id', body.project_id),
  ])

  if (!sub) return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const permitConditions = (permits ?? []).flatMap((p) => p.special_conditions ?? [])
  const gcName = profile?.company_name || profile?.full_name || 'Project Management'

  // Use provided body or generate via AI
  let emailBody: string
  if (body.custom_body) {
    emailBody = body.custom_body
  } else {
    try {
      emailBody = await draftSubReply({
        subName: sub.company_name,
        trade: sub.trade,
        bidAmount: sub.bid_amount,
        aiScore: sub.ai_score,
        aiNotes: sub.ai_notes,
        flagMessage: null, // Never expose internal flags in outbound email
        variancePct: sub.variance_pct,
        projectName: project.name,
        permitConditions,
        gcName,
      })
    } catch (err) {
      console.error('AI draft error:', err)
      return NextResponse.json({ error: 'AI draft failed. Check ANTHROPIC_API_KEY.' }, { status: 500 })
    }
  }

  // Draft only — save as draft thread, return body
  if (body.action === 'draft') {
    await admin.from('email_threads').insert({
      project_id: body.project_id,
      user_id: user.id,
      sub_id: sub.id,
      subject: `Re: ${sub.trade} Scope — ${project.name}`,
      from_name: gcName,
      from_email: profile?.email ?? '',
      body: emailBody,
      direction: 'outbound',
      ai_draft: emailBody,
      sent_at: null,
    }).select()

    return NextResponse.json({ success: true, draft: emailBody })
  }

  // Send via Resend if sub has email
  if (sub.email && process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error: sendErr } = await resend.emails.send({
      from: `${gcName} <${process.env.RESEND_FROM_EMAIL || 'noreply@constructiq.io'}>`,
      to: sub.email,
      subject: `Re: ${sub.trade} Scope — ${project.name}`,
      text: emailBody,
    })

    if (sendErr) {
      console.error('Resend error:', sendErr)
      return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
    }
  }

  // Log sent email
  await admin.from('email_threads').insert({
    project_id: body.project_id,
    user_id: user.id,
    sub_id: sub.id,
    subject: `Re: ${sub.trade} Scope — ${project.name}`,
    from_name: gcName,
    from_email: profile?.email ?? '',
    body: emailBody,
    direction: 'outbound',
    sent_at: new Date().toISOString(),
  })

  // Update last contact timestamp
  await admin.from('subcontractors')
    .update({ last_contact_at: new Date().toISOString() })
    .eq('id', sub.id)

  return NextResponse.json({ success: true })
}
