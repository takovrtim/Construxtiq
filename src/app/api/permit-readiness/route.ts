import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin    = createAdminSupabase()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, permit_id } = await req.json().catch(() => ({}))
  if (!project_id) return NextResponse.json({ error: 'Missing project_id' }, { status: 400 })

  const [{ data: project }, { data: userData }, permitResult] = await Promise.all([
    admin.from('projects').select('*').eq('id', project_id).single(),
    admin.from('users').select('trade_type, company_gc, full_name').eq('id', user.id).single(),
    permit_id ? admin.from('permits').select('*').eq('id', permit_id).single() : Promise.resolve({ data: null }),
  ])

  const permit = (permitResult as any)?.data

  const [{ data: logs }, { data: safety }, { data: rfis }, { data: inspections }] = await Promise.all([
    admin.from('job_logs').select('log_date, work_completed').eq('project_id', project_id).order('log_date', { ascending: false }).limit(10),
    admin.from('safety_checklists').select('job_date, all_clear').eq('project_id', project_id).order('job_date', { ascending: false }).limit(7),
    admin.from('rfis').select('status, subject').eq('project_id', project_id),
    admin.from('inspections').select('inspection_type, status, scheduled_date').eq('project_id', project_id),
  ])

  const tradeType   = userData?.trade_type || 'electrical'
  const gcName      = userData?.company_gc || 'the GC'
  const projectName = project?.name || 'Construction Project'
  const openRFIs    = (rfis || []).filter((r: any) => r.status === 'open')

  const context = `Project: ${projectName}
Trade: ${tradeType}
GC: ${gcName}
Jurisdiction: ${[project?.city, project?.state].filter(Boolean).join(', ') || 'Clark County, Nevada'}
${permit ? `Permit: ${permit.permit_number} (${permit.permit_type})
Special conditions: ${(permit.special_conditions || []).join('; ') || 'None'}
Inspector: ${permit.inspector_name || 'Unknown'}` : 'No permit uploaded yet.'}
Daily logs filed: ${(logs || []).length}
Most recent work: ${logs?.[0]?.work_completed || 'No logs yet'}
Safety checks: ${(safety || []).length} completed, ${(safety || []).filter((s: any) => !s.all_clear).length} with issues
Open RFIs: ${openRFIs.length}${openRFIs.length ? ': ' + openRFIs.map((r: any) => r.subject).slice(0, 3).join(', ') : ''}
Upcoming inspections: ${(inspections || []).filter((i: any) => i.status === 'scheduled').length}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `You are an expert construction inspection readiness consultant for a ${tradeType} sub.
You know Clark County requirements, NEC 2020, IPC, and what inspectors look for on commercial casino-grade jobs.
Return ONLY valid JSON.`,
    messages: [{
      role: 'user',
      content: `Assess inspection readiness:\n${context}\n\nReturn JSON:\n{\n  "ready_score": 0-100,\n  "verdict": "Ready" | "Almost Ready" | "Not Ready",\n  "critical_blockers": ["things that WILL cause failure"],\n  "warnings": ["things that might cause issues"],\n  "checklist": [{ "item": "...", "status": "complete|pending|unknown", "note": "..." }],\n  "inspector_tips": ["specific tips for this jurisdiction"],\n  "summary": "2 sentence assessment"\n}`,
    }],
  })

  const text  = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return NextResponse.json({ success: true, ...JSON.parse(clean) })
  } catch {
    return NextResponse.json({
      success: true, ready_score: 50, verdict: 'Unknown',
      critical_blockers: [], warnings: ['Upload permit and daily logs for full assessment'],
      checklist: [], inspector_tips: [],
      summary: 'Upload your permit and recent daily logs for a complete readiness check.',
    })
  }
}
