// POST /api/upload
// Receives a multipart form upload, saves to Supabase storage,
// creates the document record, then kicks off AI parsing.

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase, STORAGE_BUCKET } from '@/lib/supabase'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
]

function inferDocType(fileName: string, mimeType: string): string {
  const lower = fileName.toLowerCase()
  if (lower.includes('permit')) return 'permit'
  if (lower.includes('blueprint') || lower.includes('plan') || lower.includes('drawing')) return 'blueprint'
  if (lower.includes('contract')) return 'contract'
  if (lower.includes('bid') || lower.includes('quote') || lower.includes('proposal')) return 'sub_bid'
  if (lower.includes('inspection')) return 'inspection'
  if (lower.includes('change') || lower.includes('co_') || lower.includes('change_order')) return 'change_order'
  return 'other'
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ success: false, error: 'Invalid form data' }, { status: 400 })

  const file = formData.get('file') as File | null
  const projectId = formData.get('project_id') as string | null

  if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
  if (!projectId) return NextResponse.json({ success: false, error: 'project_id required' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ success: false, error: 'File too large (max 20MB)' }, { status: 413 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ success: false, error: `File type not supported: ${file.type}` }, { status: 415 })

  // Verify project belongs to this user
  const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })

  const admin = createAdminSupabase()
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${user.id}/${projectId}/${timestamp}_${sanitizedName}`

  // Upload to Supabase storage
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, arrayBuffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ success: false, error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
  }

  // Create document record
  const docType = inferDocType(file.name, file.type)
  const { data: doc, error: insertError } = await admin.from('documents').insert({
    project_id: projectId,
    user_id: user.id,
    name: file.name,
    file_path: filePath,
    file_size: file.size,
    file_type: file.type,
    doc_type: docType,
    status: 'uploading',
  }).select().single()

  if (insertError || !doc) {
    // Clean up orphaned storage file
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath])
    return NextResponse.json({ success: false, error: 'Failed to create document record' }, { status: 500 })
  }

  // Trigger async AI parsing (fire and forget — client polls status)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  fetch(`${appUrl}/api/parse-document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') || '' },
    body: JSON.stringify({ document_id: doc.id, project_id: projectId }),
  }).catch(err => console.error('Parse trigger failed:', err))

  return NextResponse.json({
    success: true,
    data: {
      document_id: doc.id,
      name: doc.name,
      status: 'processing',
      doc_type: docType,
    },
  })
}
