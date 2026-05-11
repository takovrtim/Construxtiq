import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const gcName = searchParams.get('gc_name')
  if (!gcName) return NextResponse.json({ error: 'Missing gc_name' }, { status: 400 })

  // Pull all projects across ALL users for this GC (anonymous aggregate)
  const [delays, rfis, changes, retentionData] = await Promise.all([
    supabase.from('delay_logs').select('caused_by,days_lost,project_id').eq('caused_by', 'gc').ilike('gc_name', `%${gcName}%`),
    supabase.from('rfis').select('status,submitted_to').ilike('submitted_to', `%${gcName}%`),
    supabase.from('change_orders').select('status,cost_impact,decided_at,created_at').ilike('gc_name', `%${gcName}%`),
    supabase.from('retention_entries').select('retention_held,retention_released,gc_name').ilike('gc_name', `%${gcName}%`),
  ])

  // Also pull user's OWN data for this GC
  const [myDelays, myRFIs, myChanges] = await Promise.all([
    supabase.from('delay_logs').select('*').eq('user_id', user.id).ilike('gc_name', `%${gcName}%`),
    supabase.from('rfis').select('*').eq('user_id', user.id).ilike('submitted_to', `%${gcName}%`),
    supabase.from('change_orders').select('*').eq('user_id', user.id).ilike('gc_name', `%${gcName}%`),
  ])

  // Score calculation (0-100)
  const d = delays.data || []
  const r = rfis.data || []
  const c = changes.data || []
  const ret = retentionData.data || []

  // Payment score: retention released vs held
  const totalHeld = ret.reduce((s: number, x: any) => s + Number(x.retention_held || 0), 0)
  const totalReleased = ret.reduce((s: number, x: any) => s + Number(x.retention_released || 0), 0)
  const paymentScore = totalHeld > 0 ? Math.min(100, Math.round((totalReleased / totalHeld) * 100)) : 70

  // Response score: RFIs answered vs total
  const totalRFIs = r.length
  const answeredRFIs = r.filter((x: any) => x.status === 'responded' || x.status === 'closed').length
  const responseScore = totalRFIs > 0 ? Math.round((answeredRFIs / totalRFIs) * 100) : 75

  // Change order score: how fast they approve
  const decidedChanges = c.filter((x: any) => x.decided_at && x.created_at)
  const avgDays = decidedChanges.length > 0
    ? decidedChanges.reduce((s: number, x: any) => {
        const diff = (new Date(x.decided_at).getTime() - new Date(x.created_at).getTime()) / (1000 * 60 * 60 * 24)
        return s + diff
      }, 0) / decidedChanges.length
    : 7
  const changeScore = Math.max(0, Math.min(100, Math.round(100 - (avgDays * 5))))

  // Delay score: how many days they caused
  const gcDays = d.reduce((s: number, x: any) => s + (x.days_lost || 0), 0)
  const delayScore = Math.max(0, Math.min(100, 100 - (gcDays * 3)))

  const overall = Math.round((paymentScore * 0.35 + responseScore * 0.25 + changeScore * 0.25 + delayScore * 0.15))

  return NextResponse.json({
    success: true,
    gc_name: gcName,
    score: overall,
    grade: overall >= 80 ? 'A' : overall >= 65 ? 'B' : overall >= 50 ? 'C' : overall >= 35 ? 'D' : 'F',
    breakdown: {
      payment: { score: paymentScore, label: 'Retention Release', weight: '35%' },
      response: { score: responseScore, label: 'RFI Response Rate', weight: '25%' },
      changes: { score: changeScore, label: 'Change Order Speed', weight: '25%' },
      delays: { score: delayScore, label: 'Delay Caused', weight: '15%' },
    },
    my_data: {
      delay_days: (myDelays.data || []).reduce((s: number, x: any) => s + (x.days_lost || 0), 0),
      open_rfis: (myRFIs.data || []).filter((x: any) => x.status === 'open').length,
      pending_changes: (myChanges.data || []).filter((x: any) => x.status === 'pending').length,
    },
    data_points: d.length + r.length + c.length + ret.length,
    note: (d.length + r.length + c.length + ret.length) < 5 ? 'Limited data — score based on your records only' : `Based on ${d.length + r.length + c.length} data points`,
  })
}

