import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id } = await req.json().catch(() => ({}))
  if (!project_id) return NextResponse.json({ error: 'Missing project_id' }, { status: 400 })

  const { data: project } = await supabase.from('projects').select('*').eq('id', project_id).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [userData, delays, rfis, changes, logs, safety, permits, retention, lienWaivers] = await Promise.all([
    supabase.from('users').select('full_name,company_name,company_gc,license_number').eq('id', user.id).single(),
    supabase.from('delay_logs').select('*').eq('project_id', project_id).order('delay_date'),
    supabase.from('rfis').select('*').eq('project_id', project_id).order('submitted_date'),
    supabase.from('change_orders').select('*').eq('project_id', project_id).order('created_at'),
    supabase.from('job_logs').select('*').eq('project_id', project_id).order('log_date'),
    supabase.from('safety_checklists').select('*').eq('project_id', project_id).order('job_date'),
    supabase.from('permits').select('*').eq('project_id', project_id),
    supabase.from('retention_entries').select('*').eq('project_id', project_id),
    supabase.from('lien_waivers').select('*').eq('project_id', project_id).order('waiver_date'),
  ])

  const d = delays.data || []
  const c = changes.data || []
  const r = rfis.data || []
  const ret = retention.data || []

  return NextResponse.json({
    success: true,
    audit: {
      generated_at: new Date().toISOString(),
      contractor: {
        name: userData.data?.full_name || '',
        company: userData.data?.company_name || '',
        gc: userData.data?.company_gc || '',
        license: userData.data?.license_number || '',
      },
      project: {
        name: project.name,
        address: [project.address, project.city, project.state].filter(Boolean).join(', '),
        contract_value: project.total_bid,
      },
      summary: {
        total_delay_days: d.reduce((s: number, x: any) => s + (x.days_lost || 0), 0),
        gc_caused_days: d.filter((x: any) => x.caused_by === 'gc').reduce((s: number, x: any) => s + (x.days_lost || 0), 0),
        approved_change_value: c.filter((x: any) => x.status === 'approved').reduce((s: number, x: any) => s + Number(x.cost_impact || 0), 0),
        pending_changes: c.filter((x: any) => x.status === 'pending').length,
        overdue_rfis: r.filter((x: any) => ['open','overdue'].includes(x.status)).length,
        retention_outstanding: ret.reduce((s: number, x: any) => s + Number(x.retention_held || 0) - Number(x.retention_released || 0), 0),
        daily_logs: (logs.data || []).length,
        safety_checks: (safety.data || []).length,
      },
      delays: d,
      rfis: r,
      change_orders: c,
      daily_logs: logs.data || [],
      safety_checklists: safety.data || [],
      permits: permits.data || [],
      retention: ret,
      lien_waivers: lienWaivers.data || [],
    },
  })
}
