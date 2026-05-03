import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const JURISDICTION_DATA: Record<string, any> = {
  'clark county': {
    electrical: ['NV State Electrical License', 'Load calculations', 'Panel schedule', 'Site plan with electrical layout', 'Energy compliance form (NVEnergy)', 'Two-hole test results if underground', 'Arc fault protection plan for bedrooms'],
    plumbing: ['NV State Plumbing License', 'Isometric drawing', 'Site plan showing drain/waste/vent', 'Water heater specs', 'SNHD approval if commercial', 'Backflow prevention plan'],
    building: ['NV Contractor License B or C', 'Stamped engineered plans if >2 stories', 'Soils report if new foundation', 'Energy compliance (IECC 2018)', 'HOA approval letter', 'Site plan drawn to scale', 'Structural calculations'],
    hvac: ['NV State Mechanical License', 'Manual J load calculation', 'Duct layout plan', 'Equipment specs/cut sheets', 'Energy compliance form'],
  },
  'las vegas': {
    electrical: ['City of Las Vegas permit application', 'Licensed electrical contractor', 'Load calculations', 'Panel schedule', 'Energy code compliance'],
    plumbing: ['City of Las Vegas permit application', 'Licensed plumbing contractor', 'Plumbing plan', 'SNHD clearance if food service'],
    building: ['City of Las Vegas permit application', 'Plans stamped by NV licensed engineer', 'Energy compliance', 'Site plan'],
  },
  'henderson': {
    electrical: ['Henderson permit application', 'NV electrical license', 'Load calculations', 'IECC 2018 compliance', 'Insurance certificate'],
    plumbing: ['Henderson permit application', 'NV plumbing license', 'Plumbing drawings', 'Insurance certificate'],
    building: ['Henderson permit application', 'NV contractor license', 'Site plan', 'Structural drawings', 'Energy compliance'],
  },
}

function getChecklist(jurisdiction: string, permitType: string): string[] {
  const j = jurisdiction.toLowerCase()
  const p = permitType.toLowerCase()
  for (const [key, trades] of Object.entries(JURISDICTION_DATA)) {
    if (j.includes(key)) {
      for (const [trade, items] of Object.entries(trades)) {
        if (p.includes(trade)) return items as string[]
      }
      return (trades.building || []) as string[]
    }
  }
  return ['Licensed contractor', 'Site plan', 'Load calculations (if electrical)', 'Energy compliance form']
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, permit_type } = await req.json()
  const admin = createAdminSupabase()

  const [{ data: project }, { data: docs }] = await Promise.all([
    admin.from('projects').select('*').eq('id', project_id).single(),
    admin.from('documents').select('name, doc_type, extracted_data').eq('project_id', project_id).eq('status', 'extracted'),
  ])

  const jurisdiction = project?.jurisdiction || project?.city || 'clark county'
  const baseChecklist = getChecklist(jurisdiction, permit_type)
  const uploadedDocs = (docs || []).map(d => d.name.toLowerCase())

  // AI enhances the checklist with project-specific items
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `For a ${permit_type} permit in ${jurisdiction}, NV, review this checklist and mark what's likely covered by uploaded documents.

Base checklist: ${JSON.stringify(baseChecklist)}
Uploaded documents: ${JSON.stringify(uploadedDocs)}

Return ONLY valid JSON:
{
  "checklist": [
    {
      "item": "<requirement>",
      "status": "complete|missing|unknown",
      "note": "<brief note or null>"
    }
  ],
  "ready_count": <number complete>,
  "total_count": <total>,
  "tip": "<one specific tip for this jurisdiction>"
}`
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    return NextResponse.json({ success: true, result, jurisdiction, permitType: permit_type })
  } catch {
    // Fallback: return base checklist without AI enhancement
    const checklist = baseChecklist.map(item => ({ item, status: 'unknown', note: null }))
    return NextResponse.json({ success: true, result: { checklist, ready_count: 0, total_count: checklist.length, tip: `Check ${jurisdiction} building department for latest requirements.` }, jurisdiction, permitType: permit_type })
  }
}
