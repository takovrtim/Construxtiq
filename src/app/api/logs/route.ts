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
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Write a 1-2 sentence professional summary of this daily job log entry for a contractor's records.

Project: ${body.project_name}
Job: ${body.job_title || 'General'}
Date: ${body.log_date}
Work completed: ${body.work_completed}
Crew: ${body.crew_present?.join(', ') || 'Not recorded'}
Hours: ${body.hours_worked || 'Not recorded'}
Materials: ${body.materials_used || 'None noted'}
Issues: ${body.issues || 'None'}
Inspections: ${body.inspections_today || 'None'}
Progress: ${body.progress_percent ? body.progress_percent + '%' : 'Not recorded'}

Write only the summary, no preamble. Be specific and professional.`
    }],
  })

  const summary = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  return NextResponse.json({ success: true, summary })
}
