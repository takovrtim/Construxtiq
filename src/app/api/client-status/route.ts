import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id } = await req.json()
  const admin = createAdminSupabase()

  const [{ data: jobs }, { data: permits }, { data: project }] = await Promise.all([
    admin.from('jobs').select('*').eq('project_id', project_id),
    admin.from('permits').select('*').eq('project_id', project_id),
    admin.from('projects').select('*').eq('id', project_id).single(),
  ])

  const pendingPermits = (permits || []).filter(p => p.status === 'pending' || p.status === 'applied')
  const activeJobs     = (jobs || []).filter(j => j.status !== 'completed')

  if (pendingPermits.length === 0 && activeJobs.length === 0) {
    return NextResponse.json({ success: true, predictions: [], message: 'No pending permits or active jobs to analyze.' })
  }

  const prompt = `You are a construction scheduling expert. Analyze these project details and predict delays.

PROJECT: ${project?.name} in ${project?.city}, ${project?.state}

PENDING PERMITS:
${pendingPermits.map(p => `- ${p.permit_type} (${p.permit_number}): applied ${p.issued_date || 'recently'}, status: ${p.status}`).join('\n') || 'None'}

ACTIVE JOBS:
${activeJobs.map(j => `- ${j.title}: status ${j.status}, ${j.description || ''}`).join('\n') || 'None'}

Return ONLY valid JSON array:
[
  {
    "job_title": "<job name>",
    "affected_task": "<what gets delayed>",
    "delay_days": <number>,
    "cause": "<reason>",
    "severity": "critical|warning|info",
    "recommendation": "<what to do now>",
    "cascade_effect": "<what else this affects>"
  }
]

Be specific with day estimates. Base on real Clark County NV permit timelines (electrical: 3-5 days, plumbing: 3-7 days, building: 7-14 days).`

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const predictions = JSON.parse(clean)
    return NextResponse.json({ success: true, predictions })
  } catch {
    return NextResponse.json({ success: true, predictions: [], message: 'No delays detected.' })
  }
}
