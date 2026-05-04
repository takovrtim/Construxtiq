import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Write a 2-sentence professional summary of this change order for a GC's records. Be specific and include the cost/time impact.

Project: ${body.project_name}
Change: ${body.title}
Category: ${body.category}
Requested by: ${body.requested_by}
Description: ${body.description || 'None provided'}
Cost impact: $${body.cost_impact}
Time impact: ${body.time_impact_days} days
Requires permit revision: ${body.requires_permit_revision ? 'Yes' : 'No'}

Write only the summary, no preamble.`
    }],
  })

  const summary = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  return NextResponse.json({ success: true, summary })
}
