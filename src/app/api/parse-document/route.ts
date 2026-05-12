// POST /api/parse-document
// Called after upload. Downloads file from Supabase storage,
// sends to Claude for extraction, saves results back to DB.

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase, STORAGE_BUCKET } from '@/lib/supabase'
import { parseDocument, analyzeBlueprint } from '@/lib/ai'
import { z } from 'zod'

const BodySchema = z.object({
  document_id: z.string().uuid(),
  project_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin = createAdminSupabase()

  // Auth check
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof BodySchema>
  try { body = BodySchema.parse(await req.json()) }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  // Get document record
  const { data: doc } = await admin
    .from('documents')
    .select('*')
    .eq('id', body.document_id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  // Get project context + user profile for full personalization
  const [{ data: project }, { data: userData }] = await Promise.all([
    admin.from('projects').select('name, jurisdiction, city, state, trade_type, project_type').eq('id', body.project_id).single(),
    admin.from('users').select('trade_type, company_gc, full_name, company_name').eq('id', user.id).single(),
  ])

  // Mark as processing
  await admin.from('documents').update({ status: 'processing' }).eq('id', doc.id)

  try {
    // Download file from Supabase storage
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(doc.file_path)

    if (downloadErr || !fileData) {
      await admin.from('documents').update({ status: 'needs_review' }).eq('id', doc.id)
      return NextResponse.json({ error: 'Could not download file' }, { status: 500 })
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Determine mime type for Claude
    let mimeType = doc.file_type
    if (mimeType === 'application/pdf') {
      // For PDFs, convert first page to image approach
      // We'll send as PDF and let Claude handle it
      mimeType = 'application/pdf'
    }

    // Only send supported types to Claude vision
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    
    if (!supportedTypes.includes(mimeType)) {
      // For unsupported types (docx, txt), do basic extraction
      await admin.from('documents').update({
        status: 'needs_review',
        ai_notes: 'File type not supported for AI extraction. Please upload PDF or image files.',
      }).eq('id', doc.id)
      return NextResponse.json({ success: true, message: 'Unsupported file type' })
    }

    const jurisdiction = [project?.jurisdiction, project?.city, project?.state].filter(Boolean).join(', ') || 'Nevada'
    const projectName = project?.name || 'Construction Project'

    // Run AI extraction
    const tradeType = (userData?.trade_type || project?.trade_type || 'electrical') as 'electrical' | 'plumbing' | 'both'
    const gcName = userData?.company_gc || 'the General Contractor'
    const projectType = project?.project_type || 'commercial'

    const result = await parseDocument({
      fileBase64: base64,
      mimeType,
      fileName: doc.name,
      docType: doc.doc_type,
      projectName,
      jurisdiction,
      tradeType,
      gcName,
      projectType,
    })

    // If it's a blueprint, run additional analysis (now supports PDF too)
    let blueprintAnalysis = null
    if (doc.doc_type === 'blueprint' && ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(mimeType)) {
      blueprintAnalysis = await analyzeBlueprint({
        fileBase64: base64,
        mimeType,
        projectName,
        jurisdiction,
        jobType: (userData?.trade_type || 'electrical') as 'electrical' | 'plumbing' | 'both',
      })
    }

    // Merge blueprint analysis into extracted data
    const extractedData = {
      ...result.extracted_data,
      ...(blueprintAnalysis ? {
        what_to_add: blueprintAnalysis.what_to_add,
        what_to_remove: blueprintAnalysis.what_to_remove,
        code_issues: blueprintAnalysis.code_issues,
        cost_saving_opportunities: blueprintAnalysis.cost_saving_opportunities,
        safety_flags: blueprintAnalysis.safety_flags,
        blueprint_summary: blueprintAnalysis.summary,
      } : {}),
      flags: result.flags,
    }

    // Save extraction results
    await admin.from('documents').update({
      status: 'extracted',
      extracted_data: extractedData,
      ai_notes: result.ai_notes,
      doc_type: result.doc_type_confirmed || doc.doc_type,
    }).eq('id', doc.id)

    // If permit was found, create/update permit record
    if (result.doc_type_confirmed === 'permit' && result.extracted_data?.permit_number) {
      const ed = result.extracted_data

      await admin.from('permits').upsert({
        document_id: doc.id,
        project_id: body.project_id,
        user_id: user.id,
        permit_number: ed.permit_number,
        permit_type: ed.permit_type || 'Building Permit',
        issued_date: ed.issued_date || null,
        expiry_date: ed.expiry_date || null,
        jurisdiction: ed.jurisdiction || jurisdiction,
        inspector_name: ed.inspector_name || null,
        inspector_phone: ed.inspector_phone || null,
        inspector_email: ed.inspector_email || null,
        valuation: ed.valuation ? parseFloat(String(ed.valuation).replace(/[$,]/g, '')) : null,
        sq_footage: ed.sq_footage ? parseInt(String(ed.sq_footage).replace(/[,]/g, '')) : null,
        special_conditions: ed.special_conditions || [],
        status: 'active',
      }, { onConflict: 'permit_number,project_id' })
    }

    return NextResponse.json({ success: true, extracted: extractedData })

  } catch (err: any) {
    console.error('Parse document error:', err)
    await admin.from('documents').update({
      status: 'needs_review',
      ai_notes: `AI extraction failed: ${err.message || 'Unknown error'}. Please review manually.`,
    }).eq('id', doc.id)
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}
