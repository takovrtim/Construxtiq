import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin = createAdminSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('project_id')
  const jobId = req.nextUrl.searchParams.get('job_id')
  if (!projectId) return NextResponse.json({ error: 'Missing project_id' }, { status: 400 })

  let query = admin.from('job_photos').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
  if (jobId) query = query.eq('job_id', jobId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, photos: data })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin = createAdminSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const projectId = formData.get('project_id') as string
  const jobId = formData.get('job_id') as string | null
  const stage = formData.get('stage') as string || 'other'
  const caption = formData.get('caption') as string | null

  if (!file || !projectId) return NextResponse.json({ error: 'Missing file or project' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${user.id}/${projectId}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await admin.storage
    .from('job-photos')
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('job-photos').getPublicUrl(path)

  const { data, error } = await admin.from('job_photos').insert({
    project_id: projectId,
    user_id: user.id,
    job_id: jobId || null,
    stage,
    caption: caption || null,
    file_path: path,
    file_url: publicUrl,
    file_size: file.size,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, photo: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin = createAdminSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { data: photo } = await admin.from('job_photos').select('file_path, user_id').eq('id', id).single()
  if (!photo || photo.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await admin.storage.from('job-photos').remove([photo.file_path])
  await admin.from('job_photos').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
