// ─────────────────────────────────────────────────────────
// CONSTRUCTIQ — AI Layer
// All Claude API calls live here. Typed, error-handled.
// ─────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-opus-4-5'

// ── DOCUMENT PARSING ──────────────────────────────────────
// Reads any construction document and extracts structured data.
// Works on permits, blueprints, contracts, inspection reports.

export async function parseDocument(params: {
  fileBase64: string
  mimeType: string
  fileName: string
  docType: string
  projectName: string
  jurisdiction?: string
}): Promise<{
  extracted_data: Record<string, any>
  ai_notes: string
  doc_type_confirmed: string
  flags: Array<{ severity: 'info' | 'warning' | 'critical'; message: string }>
}> {
  const systemPrompt = `You are an expert construction document analyst for ${params.projectName}.
You specialize in electrical and plumbing contractor work in ${params.jurisdiction || 'Nevada'}.

Your job is to extract EVERY useful piece of information from construction documents.
Return ONLY valid JSON — no markdown, no explanation, just the JSON object.

For PERMITS extract:
- permit_number, permit_type, issued_date, expiry_date
- jurisdiction, inspector_name, inspector_phone, inspector_email
- valuation, sq_footage, contractor_name, contractor_license
- special_conditions (array of strings)
- work_description
- approved_plans_date

For BLUEPRINTS extract:
- project_name, architect, engineer, scale
- sheet_numbers (array), revision_date
- key_dimensions, materials_specified (array)
- special_requirements (array)
- code_references (array - e.g. NEC 2020, IPC 2021)
- what_needs_to_be_added (array - gaps or missing items AI notices)
- what_to_remove (array - items AI flags as problematic or unnecessary)
- electrical_panel_size, service_voltage
- pipe_sizes, fixture_count

For CONTRACTS extract:
- parties (array), contract_value, start_date, completion_date
- payment_terms, retention_pct
- key_milestones (array), penalty_clauses (array)
- scope_of_work_summary

For INSPECTION REPORTS extract:
- inspection_date, inspector_name, result (pass/fail/conditional)
- items_passed (array), items_failed (array)
- corrections_required (array), re_inspection_required

Always include:
- flags: array of {severity: "info"|"warning"|"critical", message: string}
  Flag anything: expired dates, missing info, code violations, unusual clauses, high risk items
- ai_notes: 2-3 sentence plain English summary of what this document means for the contractor`

  const userPrompt = `Analyze this ${params.docType} document: "${params.fileName}"
  
Extract all information and return as JSON with these keys:
{
  "extracted_data": { ...all extracted fields... },
  "doc_type_confirmed": "permit|blueprint|contract|inspection|other",
  "ai_notes": "plain English summary",
  "flags": [{"severity": "warning", "message": "..."}]
}`

  // Build message content based on file type
  const content: any[] = []

  if (params.mimeType === 'application/pdf' || params.mimeType.startsWith('image/')) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: params.mimeType as any,
        data: params.fileBase64,
      },
    })
  }

  content.push({ type: 'text', text: userPrompt })

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  
  // Strip markdown if Claude wrapped in code blocks
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    return JSON.parse(clean)
  } catch {
    // Fallback if JSON parse fails
    return {
      extracted_data: { raw_text: text },
      ai_notes: 'Document was read but structured extraction failed. Raw text available.',
      doc_type_confirmed: params.docType,
      flags: [{ severity: 'warning', message: 'Could not fully parse document structure. Review manually.' }],
    }
  }
}

// ── BLUEPRINT ANALYSIS ────────────────────────────────────
// Specifically analyzes blueprints for what to add/remove

export async function analyzeBlueprint(params: {
  fileBase64: string
  mimeType: string
  projectName: string
  jurisdiction: string
  jobType: 'electrical' | 'plumbing' | 'both'
}): Promise<{
  what_to_add: string[]
  what_to_remove: string[]
  code_issues: string[]
  cost_saving_opportunities: string[]
  safety_flags: string[]
  summary: string
}> {
  const systemPrompt = `You are a senior ${params.jobType} contractor reviewing blueprints in ${params.jurisdiction}.
You have 20 years of experience and know exactly what inspectors look for.
Return ONLY valid JSON — no markdown, no explanation.`

  const userPrompt = `Review this blueprint for "${params.projectName}".

As an experienced ${params.jobType} contractor, analyze it and return JSON:
{
  "what_to_add": ["list of items missing that should be added - code requirements, safety items, etc"],
  "what_to_remove": ["list of items that are problematic, redundant, or non-compliant"],
  "code_issues": ["specific code violations or concerns - cite NEC/IPC/local codes"],
  "cost_saving_opportunities": ["ways to reduce cost without sacrificing quality"],
  "safety_flags": ["safety concerns that must be addressed"],
  "summary": "2-3 sentence plain English summary for the contractor"
}`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: params.mimeType as any, data: params.fileBase64 } },
        { type: 'text', text: userPrompt },
      ],
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  
  try {
    return JSON.parse(clean)
  } catch {
    return {
      what_to_add: [],
      what_to_remove: [],
      code_issues: [],
      cost_saving_opportunities: [],
      safety_flags: ['Could not analyze blueprint — ensure file is clear and readable'],
      summary: 'Blueprint analysis failed. Please re-upload a clearer image.',
    }
  }
}

// ── SUB REPLY DRAFTING ────────────────────────────────────

export async function draftSubReply(params: {
  subName: string
  trade: string
  bidAmount: number | null
  variancePct: number | null
  aiScore: string | null
  aiNotes: string | null
  flagMessage: string | null
  projectName: string
  permitConditions: string[]
  gcName: string
}): Promise<string> {
  const systemPrompt = `You are a professional General Contractor writing to a subcontractor.
Write in a direct, professional tone. Never reveal internal pricing analysis or AI scores.
Keep it under 150 words. No fluff.`

  const context = [
    `Project: ${params.projectName}`,
    `Sub company: ${params.subName}`,
    `Trade: ${params.trade}`,
    params.bidAmount ? `Their bid: $${params.bidAmount.toLocaleString()}` : '',
    params.permitConditions.length ? `Permit requirements: ${params.permitConditions.join(', ')}` : '',
  ].filter(Boolean).join('\n')

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Write a professional reply to ${params.subName} regarding their ${params.trade} bid.\n\nContext:\n${context}\n\nDraft a reply that acknowledges receipt, asks any relevant clarifying questions about scope, and mentions any permit requirements they need to account for. Sign off as ${params.gcName}.`,
    }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

// ── TRAINING MODULE GENERATION ────────────────────────────

export async function generateTrainingModule(params: {
  moduleTitle: string
  documentText: string
  projectName: string
  projectLocation: string
  permitNumbers: string[]
}): Promise<{ content: string; readTimeMinutes: number }> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: `You write clear, practical training content for construction crews. 
Write at a 8th grade reading level. Use bullet points. Be specific and actionable.
No corporate jargon. Write like you're talking to a crew member on their first day.`,
    messages: [{
      role: 'user',
      content: `Create a training module titled "${params.moduleTitle}" for ${params.projectName} in ${params.projectLocation}.
${params.permitNumbers.length ? `Active permits: ${params.permitNumbers.join(', ')}` : ''}
${params.documentText ? `Source document:\n${params.documentText.slice(0, 3000)}` : ''}

Write a practical training module with:
- What the crew needs to know
- Step-by-step procedures
- Safety requirements
- Common mistakes to avoid
- What to do if something goes wrong

Keep it under 600 words.`,
    }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''
  const wordCount = content.split(' ').length
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))

  return { content, readTimeMinutes }
}

// ── PROJECT CHAT ──────────────────────────────────────────

export async function chatWithProject(params: {
  userMessage: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  projectContext: string
}): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    system: `You are an expert construction project assistant. You have full context of this project.
Be concise, direct, and practical. Answer like a senior project manager would.
Always give actionable advice. If you see a risk, call it out immediately.

Project context:
${params.projectContext}`,
    messages: [
      ...params.conversationHistory,
      { role: 'user', content: params.userMessage },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
