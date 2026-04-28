// POST /api/training/generate
// Creates a training_module row, generates content with Claude, returns the full module.

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase, STORAGE_BUCKET } from '@/lib/supabase'
import { generateTrainingModule } from '@/lib/ai'
import { z } from 'zod'

const BodySchema = z.object({
  project_id:    z.string().uuid(),
  document_id:   z.string().uuid(),
  title:         z.string().min(1).max(200),
  module_number: z.number().int().min(1),
})

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof BodySchema>
  try { body = BodySchema.parse(await req.json()) }
  catch (e) { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const admin = createAdminSupabase()

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('name, address, city, state')
    .eq('id', body.project_id)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Verify document ownership
  const { data: doc } = await supabase
    .from('documents')
    .select('file_path, extracted_data, ai_notes, name, file_type')
    .eq('id', body.document_id)
    .eq('user_id', user.id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  // Create the module row immediately so client gets a response
  const { data: newModule, error: insertErr } = await admin.from('training_modules').insert({
    project_id:    body.project_id,
    user_id:       user.id,
    document_id:   body.document_id,
    title:         body.title,
    module_number: body.module_number,
    content:       '',
    status:        'generating',
  }).select().single()

  if (insertErr || !newModule) {
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 })
  }

  // Build document text from extracted data (avoids re-downloading PDF)
  let documentText = ''
  if (doc.extracted_data) {
    documentText = `Document: ${doc.name}\n\nExtracted fields: ${JSON.stringify(doc.extracted_data, null, 2)}`
    if (doc.ai_notes) documentText += `\n\nAI summary: ${doc.ai_notes}`
  } else if (doc.file_path) {
    try {
      const { data: fileData } = await supabase.storage.from(STORAGE_BUCKET).download(doc.file_path)
      if (fileData) {
        if (doc.file_type === 'application/pdf') {
          const pdfParse = (await import('pdf-parse')).default
          const buf = Buffer.from(await fileData.arrayBuffer())
          const pdfData = await pdfParse(buf)
          documentText = pdfData.text.slice(0, 6000)
        } else {
          documentText = (await fileData.text()).slice(0, 6000)
        }
      }
    } catch { /* use fallback */ }
  }

  if (!documentText) {
    documentText = `Project: ${project.name}, Location: ${[project.city, project.state].filter(Boolean).join(', ')}`
  }

  // Get permit numbers for context
  const { data: permits } = await supabase
    .from('permits')
    .select('permit_number')
    .eq('project_id', body.project_id)

  const permitNumbers = (permits ?? []).map(p => p.permit_number)

  try {
    const location = [project.city, project.state].filter(Boolean).join(', ')
    const { content, readTimeMinutes } = await generateTrainingModule({
      moduleTitle:     body.title,
      documentText,
      projectName:     project.name,
      projectLocation: location,
      permitNumbers,
    })

    const { data: updated } = await admin
      .from('training_modules')
      .update({ content, status: 'draft', read_time_minutes: readTimeMinutes })
      .eq('id', newModule.id)
      .select()
      .single()

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('Training AI error:', err)
    // Mark as draft with error message so it's not stuck at 'generating'
    await admin.from('training_modules').update({
      content: 'Generation failed. Please delete this module and try again.',
      status: 'draft',
    }).eq('id', newModule.id)

    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
