import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const JURISDICTION_RULES: Record<string, string> = {
  'clark county': 'Clark County NV requires: licensed contractor with NV state license, site plan drawn to scale, load calculations for electrical, two-hole test for plumbing, IRC 2018 compliance, HOA approval letter if applicable.',
  'las vegas': 'City of Las Vegas requires: contractor license number on all permits, stamped engineered plans for structural work, energy compliance forms, SNHD approval for commercial food service.',
  'henderson': 'Henderson NV requires: permit application, site plan, contractor license, insurance certificate, energy code compliance (IECC 2018).',
  'north las vegas': 'North Las Vegas requires: contractor registration, site plan, load calculations, 2018 NEC compliance for electrical.',
  default: 'Standard requirements: licensed contractor, site plan, load calculations where applicable, current code compliance (check local jurisdiction for specifics).',
}

function getJurisdictionRules(jurisdiction: string): string {
  const j = (jurisdiction || '').toLowerCase()
  for (const [key, rules] of Object.entries(JURISDICTION_RULES)) {
    if (j.includes(key)) return rules
  }
  return JURISDICTION_RULES.default
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin = createAdminSupabase()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, permit_type } = await req.json()

  // Fetch project + all docs + permits
  const [{ data: project }, { data: docs }, { data: permits }] = await Promise.all([
    admin.from('projects').select('*').eq('id', project_id).single(),
    admin.from('documents').select('*').eq('project_id', project_id).eq('status', 'extracted').or('status.eq.saved'),
    admin.from('permits').select('*').eq('project_id', project_id),
  ])

  const jurisdiction = project?.jurisdiction || project?.city || 'default'
  const jurisdictionRules = getJurisdictionRules(jurisdiction)

  const docSummary = (docs || []).map(d => `- ${d.name} (${d.doc_type}): ${JSON.stringify(d.extracted_data || {})}`).join('\n')
  const permitSummary = (permits || []).map(p => `- ${p.permit_number} (${p.permit_type}): ${p.status}`).join('\n')

  const prompt = `You are a construction permit specialist for ${jurisdiction}.

JURISDICTION REQUIREMENTS:
${jurisdictionRules}

PROJECT: ${project?.name}
PERMIT TYPE REQUESTED: ${permit_type || 'General Building Permit'}

DOCUMENTS ON FILE:
${docSummary || 'None uploaded yet'}

EXISTING PERMITS:
${permitSummary || 'None'}

Analyze readiness to submit a ${permit_type || 'building'} permit. Return ONLY valid JSON:
{
  "score": <0-100 integer>,
  "status": "<Ready to Submit | Almost Ready | Needs Work | Not Ready>",
  "missing_docs": ["<item>", ...],
  "issues": [{"severity": "critical|warning|info", "message": "<specific issue>"}],
  "next_steps": ["<actionable step>", ...],
  "estimated_approval_days": <integer>,
  "delay_risk": "<Low|Medium|High>",
  "summary": "<2 sentence plain English summary>"
}`

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    return NextResponse.json({ success: true, result })
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
