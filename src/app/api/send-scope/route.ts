import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase'
import { draftSubReply } from '@/lib/ai'
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
  const admin = createAdminSupabase()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof BodySchema>
  try { body = BodySchema.parse(await req.json()) }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const [{ data: doc }, { data: sub }, { data: project }] = await Promise.all([
    admin.from('documents').select('*').eq('id', body.document_id).single(),
    admin.from('subcontractors').select('*').eq('id', body.sub_id).single(),
    admin.from('projects').select('*').eq('id', body.project_id).single(),
  ])

  if (!doc || !sub || !project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.action === 'draft') {
    const draft = await draftSubReply({
      subName: sub.company_name,
      trade: sub.trade,
      bidAmount: sub.bid_amount,
      variancePct: sub.variance_pct,
      aiScore: sub.ai_score,
      aiNotes: sub.ai_notes,
      flagMessage: null,
      projectName: project.name,
      permitConditions: doc.extracted_data?.special_conditions || [],
      gcName: project.name,
    })
    return NextResponse.json({ success: true, draft })
  }

  return NextResponse.json({ success: true, message: 'Sent' })
}