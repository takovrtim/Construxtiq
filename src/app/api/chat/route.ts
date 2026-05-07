// POST /api/chat
// Receives a user message + conversation history,
// builds project context from DB, calls Claude, returns reply.

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { chatWithProject } from '@/lib/ai'
import { z } from 'zod'

const BodySchema = z.object({
  project_id: z.string().uuid(),
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(20).default([]),
})

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof BodySchema>
  try { body = BodySchema.parse(await req.json()) }
  catch (e) { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  // Verify project ownership
  const { data: project } = await supabase.from('projects').select('*').eq('id', body.project_id).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Build context from all project data
  const [{ data: permits }, { data: bids }, { data: subs }, { data: docs }] = await Promise.all([
    supabase.from('permits').select('permit_number, permit_type, expiry_date, status, special_conditions').eq('project_id', body.project_id),
    supabase.from('bid_line_items').select('trade, amount, status, ai_flag, variance_pct').eq('project_id', body.project_id),
    supabase.from('subcontractors').select('company_name, trade, status, ai_score, bid_amount, variance_pct, ai_notes').eq('project_id', body.project_id),
    supabase.from('documents').select('name, doc_type, status').eq('project_id', body.project_id).limit(20),
  ])

  const context = JSON.stringify({
    project: { name: project.name, address: project.address, jurisdiction: project.jurisdiction, total_bid: project.total_bid },
    permits: permits ?? [],
    bids: bids ?? [],
    subcontractors: subs ?? [],
    documents: docs ?? [],
  }, null, 2)

  try {
    const reply = await chatWithProject({
      userMessage: body.message,
      conversationHistory: (body.history || []).map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content as string })),
      projectContext: context,
    })
    return NextResponse.json({ success: true, reply })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'AI unavailable, please try again' }, { status: 500 })
  }
}
