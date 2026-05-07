import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const admin = createAdminSupabase()
  const { token, action, notes } = await req.json()

  if (!token || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data: change, error } = await admin
    .from('change_orders')
    .select('id, status')
    .eq('approval_token', token)
    .single()

  if (error || !change) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (change.status === 'approved' || change.status === 'rejected') {
    return NextResponse.json({ error: 'Already decided' }, { status: 400 })
  }

  await admin.from('change_orders').update({
    status: action,
    owner_notes: notes || null,
    decided_at: new Date().toISOString(),
  }).eq('id', change.id)

  return NextResponse.json({ success: true })
}
