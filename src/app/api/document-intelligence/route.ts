import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { generateRFIs, detectConflicts } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  // Generate RFIs from blueprint candidates
  if (body.action === 'generate_rfis') {
    const { rfi_candidates, project_id } = body
    if (!rfi_candidates?.length) return NextResponse.json({ rfis: [] })

    const { data: project } = await supabase.from('projects').select('name').eq('id', project_id).single()
    const { data: userRow } = await supabase.from('users').select('full_name, company_name, company_gc').eq('id', user.id).single()

    const rfis = await generateRFIs({
      rfiCandidates: rfi_candidates,
      projectName: project?.name || 'Project',
      gcName: (userRow as any)?.company_gc || 'General Contractor',
      tradeType: 'electrical',
      submittedBy: (userRow as any)?.company_name || (userRow as any)?.full_name || 'Contractor',
    })

    return NextResponse.json({ success: true, rfis })
  }

  // Detect conflicts between blueprints and change orders
  if (body.action === 'detect_conflicts') {
    const { blueprint_summary, project_id } = body

    const { data: project } = await supabase.from('projects').select('name').eq('id', project_id).single()
    const { data: changes } = await supabase.from('change_orders')
      .select('title, description, status, cost_impact')
      .eq('project_id', project_id)
      .in('status', ['pending', 'approved', 'in_progress'])

    if (!changes?.length) return NextResponse.json({ conflicts: [], summary: 'No change orders to compare against.', rfi_needed: false })

    const report = await detectConflicts({
      blueprintSummary: blueprint_summary,
      changeOrders: changes as any,
      projectName: project?.name || 'Project',
    })

    return NextResponse.json({ success: true, ...report })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
