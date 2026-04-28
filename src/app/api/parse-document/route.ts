// ─────────────────────────────────────────────────────────
// POST /api/parse-document
// Called after a file is uploaded to Supabase storage.
// Fetches the file, extracts text, runs AI parse, saves result.
// ─────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase, STORAGE_BUCKET } from '@/lib/supabase'
import { parseDocument, generateDocumentNotes, analyzeBid } from '@/lib/ai'
import { z } from 'zod'

const BodySchema = z.object({
  document_id: z.string().uuid(),
  project_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()

  // ── Auth check ─────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // ── Validate body ──────────────────────────────────────
  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const admin = createAdminSupabase()

  try {
    // ── Fetch document record ──────────────────────────────
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', body.document_id)
      .eq('user_id', user.id)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 })
    }

    // ── Update status to processing ────────────────────────
    await admin.from('documents').update({ status: 'processing' }).eq('id', doc.id)

    // ── Download file from Supabase storage ───────────────
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(doc.file_path)

    if (downloadError || !fileData) {
      await admin.from('documents').update({ status: 'needs_review' }).eq('id', doc.id)
      return NextResponse.json({ success: false, error: 'Failed to download file' }, { status: 500 })
    }

    // ── Extract text from PDF ──────────────────────────────
    let rawText = ''
    if (doc.file_type === 'application/pdf') {
      const arrayBuffer = await fileData.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      // Dynamic import to avoid build-time issues with pdf-parse
      const pdfParse = (await import('pdf-parse')).default
      const pdfData = await pdfParse(buffer)
      rawText = pdfData.text
    } else if (doc.file_type.startsWith('text/') || doc.file_type.includes('document')) {
      rawText = await fileData.text()
    } else {
      // Image or unsupported — mark for manual review
      await admin.from('documents').update({ status: 'needs_review' }).eq('id', doc.id)
      return NextResponse.json({ success: false, error: 'Unsupported file type for auto-extraction' }, { status: 422 })
    }

    if (!rawText.trim()) {
      await admin.from('documents').update({ status: 'needs_review' }).eq('id', doc.id)
      return NextResponse.json({ success: false, error: 'No text could be extracted from document' }, { status: 422 })
    }

    // ── Fetch project context ──────────────────────────────
    const { data: project } = await supabase
      .from('projects')
      .select('name, jurisdiction, address')
      .eq('id', body.project_id)
      .single()

    const projectContext = project
      ? `Project: ${project.name}, Location: ${project.address || ''}, Jurisdiction: ${project.jurisdiction || ''}`
      : ''

    // ── Run AI extraction ──────────────────────────────────
    const [extractedData, aiNotes] = await Promise.all([
      parseDocument(rawText, doc.name, doc.doc_type),
      generateDocumentNotes(
        await parseDocument(rawText, doc.name, doc.doc_type),
        projectContext
      ).catch(() => ''),
    ])

    // ── Determine if this is a permit ──────────────────────
    const isPermit = doc.doc_type === 'permit' || !!extractedData.permit_number

    // ── Save extracted data to documents table ─────────────
    await admin.from('documents').update({
      status: 'extracted',
      extracted_data: extractedData,
      ai_notes: aiNotes,
      doc_type: isPermit ? 'permit' : doc.doc_type,
    }).eq('id', doc.id)

    // ── If permit, create/update permit record ─────────────
    if (isPermit && extractedData.permit_number) {
      const { error: permitError } = await admin.from('permits').upsert({
        document_id: doc.id,
        project_id: body.project_id,
        user_id: user.id,
        permit_number: extractedData.permit_number,
        permit_type: extractedData.permit_type || 'General',
        issued_date: extractedData.issued_date || null,
        expiry_date: extractedData.expiry_date || null,
        jurisdiction: extractedData.jurisdiction || project?.jurisdiction || null,
        inspector_name: extractedData.inspector_name || null,
        inspector_email: extractedData.inspector_email || null,
        valuation: extractedData.valuation || null,
        sq_footage: extractedData.sq_footage || null,
        special_conditions: extractedData.special_conditions || [],
      }, {
        onConflict: 'document_id',
      })

      if (permitError) {
        console.error('Permit upsert error:', permitError)
      }
    }

    // ── If sub_bid, auto-create sub + bid line item ────────
    let autoSubId: string | null = null
    if (doc.doc_type === 'sub_bid' && extractedData.contractor_name) {
      const trade = extractedData.trade || 'General'
      const bidAmount = extractedData.total_amount ?? null

      // Upsert subcontractor (match by company name + project)
      const { data: existingSub } = await admin
        .from('subcontractors')
        .select('id')
        .eq('project_id', body.project_id)
        .ilike('company_name', extractedData.contractor_name)
        .single()

      let subId: string
      if (existingSub) {
        subId = existingSub.id
        await admin.from('subcontractors').update({
          bid_amount: bidAmount,
          email: extractedData.contractor_email ?? undefined,
          license_number: extractedData.contractor_license ?? undefined,
          status: 'bidding',
        }).eq('id', subId)
      } else {
        const { data: newSub } = await admin.from('subcontractors').insert({
          project_id: body.project_id,
          user_id: user.id,
          company_name: extractedData.contractor_name,
          email: extractedData.contractor_email ?? null,
          license_number: extractedData.contractor_license ?? null,
          trade,
          status: 'bidding',
          bid_amount: bidAmount,
        }).select('id').single()
        subId = newSub?.id ?? ''
      }

      autoSubId = subId

      // Run AI bid analysis + create bid line item
      if (subId && bidAmount) {
        const projectContext = project
          ? `${project.name}, ${project.address || ''}, ${project.jurisdiction || ''}`
          : ''

        const analysis = await analyzeBid({
          subName: extractedData.contractor_name,
          trade,
          bidAmount,
          scopeSummary: extractedData.scope_summary || '',
          projectContext,
          permitConditions: [],
        }).catch(() => null)

        if (analysis) {
          await admin.from('subcontractors').update({
            ai_score: analysis.score,
            market_rate: (analysis.marketRateLow + analysis.marketRateHigh) / 2,
            variance_pct: analysis.variancePct,
            ai_notes: analysis.notes,
          }).eq('id', subId)
        }

        // Create bid line item linked to this sub
        await admin.from('bid_line_items').insert({
          project_id: body.project_id,
          user_id: user.id,
          trade,
          scope_summary: extractedData.scope_summary || '',
          amount: bidAmount,
          market_rate_low: analysis?.marketRateLow ?? null,
          market_rate_high: analysis?.marketRateHigh ?? null,
          variance_pct: analysis?.variancePct ?? null,
          status: 'bidding',
          ai_flag: analysis?.flagMessage ?? null,
          ai_flag_severity: analysis?.flagSeverity ?? null,
          sub_id: subId,
          sort_order: 0,
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        document_id: doc.id,
        extracted_data: extractedData,
        ai_notes: aiNotes,
        is_permit: isPermit,
        auto_sub_id: autoSubId,
      },
    })

  } catch (err) {
    console.error('Document parse error:', err)
    // Reset document status so user can retry
    await admin.from('documents').update({ status: 'needs_review' }).eq('id', body.document_id)
    return NextResponse.json(
      { success: false, error: 'AI parsing failed. Document marked for manual review.' },
      { status: 500 }
    )
  }
}
