// POST /api/send-scope
// Sends a scoped document section to a specific subcontractor.
// Only their trade's scope is included — budget, other trades, and internal flags are never exposed.

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase'
import { generateScopeEmail } from '@/lib/ai'
import { z } from 'zod'

const BodySchema = z.object({
  document_id: z.string().uuid(),
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

  const [{ data: doc }, { data: sub }, { data: project }, { data: profile }] = await Promise.all([
    supabase.from('documents').select('*').eq('id', body.document_id).eq('user_id', user.id).single(),
    supabase.from('subcontractors').select('*').eq('id', body.sub_id).eq('user_id', user.id).single(),
    supabase.from('projects').select('name').eq('id', body.project_id).eq('user_id', user.id).single(),
    supabase.from('users').select('full_name, email, company_name').eq('id', user.id).single(),
  ])

  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  if (!sub) return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const gcName = profile?.company_name || profile?.full_name || 'Project Management'

  // Strip internal-only fields before passing to AI
  const safeExtractedData = { ...(doc.extracted_data ?? {}) }
  delete (safeExtractedData as Record<string, unknown>).flags
  delete (safeExtractedData as Record<string, unknown>).valuation
  delete (safeExtractedData as Record<string, unknown>).total_amount

  let emailBody: string
  if (body.custom_body) {
    emailBody = body.custom_body
  } else {
    try {
      emailBody = await generateScopeEmail({
        subName: sub.company_name,
        trade: sub.trade,
        scopeSummary: doc.extracted_data?.scope_summary ?? '',
        extractedData: safeExtractedData,
        projectName: project.name,
        gcName,
        documentName: doc.name,
      })
    } catch (err) {
      console.error('Scope email generation failed:', err)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }
  }

  if (body.action === 'draft') {
    await admin.from('email_threads').insert({
      project_id: body.project_id,
      user_id: user.id,
      sub_id: sub.id,
      subject: `${sub.trade} Scope — ${project.name}`,
      from_name: gcName,
      from_email: profile?.email ?? '',
      body: emailBody,
      direction: 'outbound',
      ai_draft: emailBody,
      sent_at: null,
    })
    return NextResponse.json({ success: true, draft: emailBody })
  }

  // Send via Resend
  if (sub.email && process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: sendErr } = await resend.emails.send({
      from: `${gcName} <${process.env.RESEND_FROM_EMAIL || 'noreply@constructiq.io'}>`,
      to: sub.email,
      subject: `${sub.trade} Scope — ${project.name}`,
      text: emailBody,
    })
    if (sendErr) {
      console.error('Resend error:', sendErr)
      return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
    }
  }

  await admin.from('email_threads').insert({
    project_id: body.project_id,
    user_id: user.id,
    sub_id: sub.id,
    subject: `${sub.trade} Scope — ${project.name}`,
    from_name: gcName,
    from_email: profile?.email ?? '',
    body: emailBody,
    direction: 'outbound',
    sent_at: new Date().toISOString(),
  })

  await admin.from('subcontractors')
    .update({ last_contact_at: new Date().toISOString() })
    .eq('id', sub.id)

  return NextResponse.json({ success: true })
}
