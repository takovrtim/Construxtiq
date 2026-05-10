import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))

  if (body.action === 'generate_token') {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const { error } = await supabase
      .from('change_orders')
      .update({ approval_token: token })
      .eq('id', body.change_id)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 })
    const approvalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/approve/${token}`
    return NextResponse.json({ success: true, token, approvalUrl })
  }

  if (body.action === 'summarize') {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Write a 2-sentence professional summary of this change order. Be specific about cost and time impact. Change: ${body.title}. Requested by: ${body.requested_by}. Description: ${body.description}. Cost: $${body.cost_impact}. Time: ${body.time_impact_days} days. Write only the summary.`
        }],
      })
      const summary = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
      return NextResponse.json({ success: true, summary })
    } catch {
      return NextResponse.json({ error: 'AI failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
