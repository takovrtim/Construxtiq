import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { log_id, action } = await req.json()
  if (action !== 'summarize') return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  const { data: log } = await supabase.from('job_logs').select('*').eq('id', log_id).single()
  if (!log) return NextResponse.json({ error: 'Log not found' }, { status: 404 })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Write a concise 1-2 sentence professional summary of this daily construction log entry. Focus on what was accomplished and any notable issues.

Date: ${log.log_date}
Work completed: ${log.work_completed}
Crew: ${log.crew_present || 'Not specified'}
Hours: ${log.hours_worked || 'Not specified'}
Materials: ${log.materials_used || 'None noted'}
Issues: ${log.issues || 'None'}
Inspections: ${log.inspections || 'None'}
Progress: ${log.progress_pct ? log.progress_pct + '%' : 'Not specified'}

Write only the summary, no preamble.`
    }],
  })

  const summary = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  await supabase.from('job_logs').update({ ai_summary: summary }).eq('id', log_id)

  return NextResponse.json({ success: true, summary })
}
