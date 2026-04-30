import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase, STORAGE_BUCKET } from '@/lib/supabase'
import { parseDocument, analyzeBlueprint } from '@/lib/ai'

const MAX_FILE_SIZE = 20 * 1024 * 1024

function inferDocType(fileName: string): string {
  const lower = fileName.toLowerCase()
  if (lower.includes('permit')) return 'permit'
  if (lower.includes('blueprint') || lower.includes('plan') || lower.includes('drawing')) return 'blueprint'
  if (lower.includes('contract')) return 'contract'
  if (lower.includes('bid') || lower.includes('quote') || lower.includes('proposal')) return 'sub_bid'
  if (lower.includes('inspection')) return 'inspection'
  return 'other'
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ success: false, error: 'Invalid form data' }, { status: 400 })

  const file = formData.get('file') as File | null
  const projectId = formData.get('project_id') as string | null

  if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
  if (!projectId) return NextResponse.json({ success: false, error: 'project_id required' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ success: false, error: 'File too large (max 20MB)' }, { status: 413 })

  const { data: project } = await supabase.from('projects').select('id, name, jurisdiction, city, state').eq('id', projectId).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })

  const admin = createAdminSupabase()
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${user.id}/${projectId}/${timestamp}_${sanitizedName}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, arrayBuffer, { contentType: file.type, upsert: false })
  if (uploadError) return NextResponse.json({ success: false, error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })

  const docType = inferDocType(file.name)
  const { data: doc, error: insertError } = await admin.from('documents').insert({
    project_id: projectId, user_id: user.id, name: file.name,
    file_path: filePath, file_size: file.size, file_type: file.type,
    doc_type: docType, status: 'processing',
  }).select().single()

  if (insertError || !doc) {
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath])
    return NextResponse.json({ success: false, error: 'Failed to create document record' }, { status: 500 })
  }

  // AI parsing runs in background
  ;(async () => {
    try {
      const aiTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
      if (!aiTypes.includes(file.type) && !file.type.startsWith('image/')) {
        await admin.from('documents').update({ status: 'needs_review', ai_notes: 'Upload PDF or image for AI extraction.' }).eq('id', doc.id)
        return
      }

      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const jurisdiction = [project.jurisdiction, project.city, project.state].filter(Boolean).join(', ') || 'Nevada'

      const result = await parseDocument({
        fileBase64: base64, mimeType: file.type, fileName: file.name,
        docType, projectName: project.name || 'Construction Project', jurisdiction,
      })

      let blueprintAnalysis = null
      if (docType === 'blueprint') {
        blueprintAnalysis = await analyzeBlueprint({
          fileBase64: base64, mimeType: file.type,
          projectName: project.name || 'Project', jurisdiction, jobType: 'both',
        })
      }

      const extractedData = {
        ...result.extracted_data,
        ...(blueprintAnalysis ? {
          what_to_add: blueprintAnalysis.what_to_add,
          what_to_remove: blueprintAnalysis.what_to_remove,
          code_issues: blueprintAnalysis.code_issues,
          cost_saving_opportunities: blueprintAnalysis.cost_saving_opportunities,
          safety_flags: blueprintAnalysis.safety_flags,
        } : {}),
        flags: result.flags,
      }

      await admin.from('documents').update({
        status: 'extracted', extracted_data: extractedData,
        ai_notes: result.ai_notes, doc_type: result.doc_type_confirmed || docType,
      }).eq('id', doc.id)

      if (result.doc_type_confirmed === 'permit' && result.extracted_data?.permit_number) {
        const ed = result.extracted_data
        await admin.from('permits').upsert({
          document_id: doc.id, project_id: projectId, user_id: user.id,
          permit_number: ed.permit_number, permit_type: ed.permit_type || 'Building Permit',
          issued_date: ed.issued_date || null, expiry_date: ed.expiry_date || null,
          jurisdiction: ed.jurisdiction || jurisdiction,
          inspector_name: ed.inspector_name || null, inspector_phone: ed.inspector_phone || null,
          valuation: ed.valuation ? parseFloat(String(ed.valuation).replace(/[$,]/g, '')) : null,
          sq_footage: ed.sq_footage ? parseInt(String(ed.sq_footage).replace(/[,]/g, '')) : null,
          special_conditions: ed.special_conditions || [], status: 'active',
        }, { onConflict: 'permit_number,project_id' })
      }

      console.log(`✓ AI parsed: ${file.name} → ${result.doc_type_confirmed}`)
    } catch (err: any) {
      console.error(`✗ Parse failed: ${file.name}:`, err.message)
      await admin.from('documents').update({
        status: 'needs_review', ai_notes: `AI extraction failed: ${err.message}`,
      }).eq('id', doc.id)
    }
  })()

  return NextResponse.json({ success: true, data: { document_id: doc.id, name: doc.name, status: 'processing', doc_type: docType } })
}
