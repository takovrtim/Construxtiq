import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  // Accept either log_id OR raw log data
  let logData = body
  if (body.log_id) {
    const { data: log } = await supabase.from('job_logs').select('*').eq('id', body.log_id).eq('user_id', user.id).single()
    if (!log) return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    logData = log
  }

  const { data: userData } = await supabase.from('users').select('company_gc').eq('id', user.id).single()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 200,
    system: `You write professional daily construction log summaries for electrical/plumbing subcontractors.
2 sentences max. Past tense. Specific — include hours, crew count, materials if provided.
Mention issues or delays clearly — these are legal records.
If GC caused anything, note it explicitly.`,
    messages: [{
      role: 'user',
      content: `Summarize this daily log${logData.project_name ? ` for ${logData.project_name}` : ''}:
Date: ${logData.log_date || 'Today'}
Work completed: ${logData.work_completed || 'Not specified'}
Hours worked: ${logData.hours_worked || 'Not specified'}
Crew present: ${logData.crew_present || 'Not specified'}
Weather: ${logData.weather || 'Not specified'}
Materials used: ${logData.materials_used || 'None noted'}
Issues/Delays: ${logData.issues || 'None'}
Inspections: ${logData.inspections || 'None'}
Progress: ${logData.progress_pct ? logData.progress_pct + '% complete' : 'Not specified'}
GC: ${userData?.company_gc || 'Not specified'}

Write only the 2-sentence summary.`
    }],
  })

  const summary = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

  // Save to DB if we have a log ID
  if (body.log_id || logData.id) {
    await supabase.from('job_logs').update({ ai_summary: summary }).eq('id', body.log_id || logData.id)
  }

  return NextResponse.json({ success: true, summary })
}
