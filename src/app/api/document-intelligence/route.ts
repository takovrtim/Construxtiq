import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase'
import { generateRFIs, detectConflicts } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin    = createAdminSupabase()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { action, project_id } = body

  if (!action || !project_id) return NextResponse.json({ error: 'Missing action or project_id' }, { status: 400 })

  const [{ data: userData }, { data: project }] = await Promise.all([
    admin.from('users').select('full_name, company_name, trade_type, company_gc').eq('id', user.id).single(),
    admin.from('projects').select('name, city, state').eq('id', project_id).single(),
  ])

  const submittedBy = userData?.company_name || userData?.full_name || 'Contractor'
  const tradeType   = userData?.trade_type || 'electrical'
  const gcName      = userData?.company_gc || body.gc_name || 'the General Contractor'
  const projectName = project?.name || 'Construction Project'

  // ── Generate RFIs ────────────────────────────────────────
  if (action === 'generate_rfis') {
    const rfiCandidates = body.rfi_candidates || []
    if (!rfiCandidates.length) return NextResponse.json({ error: 'No candidates' }, { status: 400 })
    try {
      const rfis = await generateRFIs({ rfiCandidates, projectName, gcName, tradeType, submittedBy })
      return NextResponse.json({ success: true, rfis })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // ── Detect blueprint vs change order conflicts ───────────
  if (action === 'detect_conflicts') {
    const { blueprint_summary, document_id } = body

    const { data: changeOrders } = await admin
      .from('change_orders').select('title, description, status, cost_impact')
      .eq('project_id', project_id).neq('status', 'rejected')

    if (!changeOrders?.length) return NextResponse.json({ success: true, conflicts: [], summary: 'No change orders to compare.', rfi_needed: false })

    let summary = blueprint_summary
    if (!summary && document_id) {
      const { data: doc } = await admin.from('documents').select('ai_notes, extracted_data').eq('id', document_id).single()
      summary = doc?.extracted_data?.blueprint_summary || doc?.ai_notes || ''
    }

    if (!summary) return NextResponse.json({ error: 'No blueprint data' }, { status: 400 })

    try {
      const report = await detectConflicts({ blueprintSummary: summary, changeOrders, projectName })
      return NextResponse.json({ success: true, ...report })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // ── Project summary stats ────────────────────────────────
  if (action === 'project_summary') {
    const [{ data: delays }, { data: rfis }, { data: changes }, { data: permits }] = await Promise.all([
      admin.from('delay_logs').select('days_lost, caused_by').eq('project_id', project_id),
      admin.from('rfis').select('status').eq('project_id', project_id),
      admin.from('change_orders').select('status, cost_impact').eq('project_id', project_id),
      admin.from('permits').select('expiry_date').eq('project_id', project_id),
    ])

    return NextResponse.json({
      success: true,
      summary: {
        project: projectName,
        total_delay_days: (delays || []).reduce((s: number, d: any) => s + (d.days_lost || 0), 0),
        gc_caused_days: (delays || []).filter((d: any) => d.caused_by === 'gc').reduce((s: number, d: any) => s + (d.days_lost || 0), 0),
        open_rfis: (rfis || []).filter((r: any) => r.status === 'open').length,
        pending_changes: (changes || []).filter((c: any) => c.status === 'pending').length,
        approved_change_value: (changes || []).filter((c: any) => c.status === 'approved').reduce((s: number, c: any) => s + Number(c.cost_impact || 0), 0),
        expiring_permits: (permits || []).filter((p: any) => {
          if (!p.expiry_date) return false
          const days = Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / 86400000)
          return days >= 0 && days <= 30
        }).length,
      },
    })
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
}
