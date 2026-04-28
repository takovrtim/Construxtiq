// PATCH /api/training/update  — update status
// DELETE /api/training/update?id=X  — delete module

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { z } from 'zod'

const PatchSchema = z.object({
  module_id: z.string().uuid(),
  status: z.enum(['generating', 'draft', 'published']),
})

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof PatchSchema>
  try { body = PatchSchema.parse(await req.json()) }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { error: updateErr } = await supabase
    .from('training_modules')
    .update({ status: body.status })
    .eq('id', body.module_id)
    .eq('user_id', user.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error: delErr } = await supabase
    .from('training_modules')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
