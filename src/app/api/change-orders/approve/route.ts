import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const body = await req.json().catch(() => ({}))
  const { token, action, notes, gc_name, gc_title } = body

  if (!token || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (!['approved', 'rejected'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const { data: change, error } = await supabase
    .from('change_orders')
    .select('id, status, title, cost_impact')
    .eq('approval_token', token)
    .single()

  if (error || !change) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  if (change.status === 'approved' || change.status === 'rejected') return NextResponse.json({ error: 'Already decided' }, { status: 400 })

  const gcNotes = [
    gc_name ? `Decided by: ${gc_name}${gc_title ? ` (${gc_title})` : ''}` : null,
    notes || null,
  ].filter(Boolean).join('\n') || null

  await supabase.from('change_orders').update({
    status: action,
    owner_notes: gcNotes,
    decided_at: new Date().toISOString(),
  }).eq('approval_token', token)

  return NextResponse.json({ success: true, action, decided_at: new Date().toISOString() })
}
