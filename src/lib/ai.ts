// ─────────────────────────────────────────────────────────
// CONSTRUCTIQ — AI Layer
// Built for commercial electrical/plumbing subs at casino scale.
// Handles permits, blueprints, contracts, NDAs, submittals,
// insurance certs, RFI generation, conflict detection.
// ─────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL  = 'claude-opus-4-5'

// ── TYPES ─────────────────────────────────────────────────

export interface DocumentFlag {
  severity: 'info' | 'warning' | 'critical'
  category: 'deadline' | 'compliance' | 'scope' | 'financial' | 'safety' | 'legal'
  message: string
}

export interface ParsedDocument {
  extracted_data: Record<string, any>
  ai_notes: string
  doc_type_confirmed: string
  flags: DocumentFlag[]
  rfi_candidates?: string[]       // Questions that should become RFIs
  scope_gaps?: string[]           // Missing specs or undefined scope
  action_items?: string[]         // Things John needs to do NOW
}

export interface BlueprintAnalysis {
  what_to_add: string[]
  what_to_remove: string[]
  code_issues: string[]
  cost_saving_opportunities: string[]
  safety_flags: string[]
  scope_gaps: string[]
  rfi_candidates: string[]        // Unanswered questions in blueprints
  spec_conflicts: string[]        // Conflicts between sheets
  summary: string
}

export interface ConflictReport {
  conflicts: Array<{
    severity: 'minor' | 'major' | 'critical'
    description: string
    blueprint_reference: string
    change_order_reference: string
    recommendation: string
  }>
  summary: string
  rfi_needed: boolean
}

// ── MASTER DOCUMENT PARSER ────────────────────────────────
// Reads ANY construction document and extracts what matters
// for a commercial electrical/plumbing sub.

export async function parseDocument(params: {
  fileBase64: string
  mimeType: string
  fileName: string
  docType: string
  projectName: string
  jurisdiction?: string
  tradeType?: 'electrical' | 'plumbing' | 'both'
}): Promise<ParsedDocument> {

  const trade = params.tradeType || 'electrical'
  const jurisdiction = params.jurisdiction || 'Clark County, Nevada'

  const systemPrompt = `You are an expert construction document analyst for a commercial ${trade} subcontractor.
Project: ${params.projectName}
Jurisdiction: ${jurisdiction}
Trade focus: ${trade} work — think NEC 2020, Clark County electrical/plumbing codes, casino-grade commercial standards.

You extract EVERY useful piece of information from construction documents.
You think like a contractor who has been burned by missing deadlines, vague scope, and GC disputes.
Flag ANYTHING that could cost money, cause delays, or create legal exposure.

Return ONLY valid JSON — no markdown, no explanation, just the JSON object.

DOCUMENT TYPE EXTRACTION RULES:

PERMITS — Extract:
  permit_number, permit_type, issued_date, expiry_date, jurisdiction
  inspector_name, inspector_phone, inspector_email
  contractor_name, contractor_license, contractor_license_expiry
  valuation, sq_footage, work_description
  approved_plans_date, approved_plans_number
  special_conditions: [] — every condition listed, verbatim
  required_inspections: [] — all inspection stages required
  bond_required, insurance_required

BLUEPRINTS — Extract:
  project_name, architect, engineer, structural_engineer
  sheet_count, sheet_numbers: [], revision_date, revision_number
  scale, drawing_date
  electrical_panel_size, service_voltage, service_amperage
  conduit_types: [], wire_gauge_specs: []
  pipe_sizes: {}, fixture_count: {}
  materials_specified: []
  code_references: [] — every code cited (NEC 2020, IPC, local)
  special_requirements: []
  dimensions_key: {}
  scope_gaps: [] — things NOT specified that should be
  rfi_candidates: [] — questions that need GC/architect answers

CONTRACTS — Extract:
  parties: [], contract_value, retention_pct
  start_date, completion_date, substantial_completion_date
  payment_terms, payment_schedule: []
  key_milestones: []
  penalty_clauses: [] — liquidated damages, delay penalties, VERBATIM
  termination_clauses: []
  dispute_resolution
  scope_of_work_summary
  exclusions: [] — what is NOT included
  allowances: []
  change_order_process
  notice_requirements — how many days notice for changes/claims
  warranty_period

NDAs — Extract:
  parties: [], effective_date, expiry_date
  confidential_info_definition
  restrictions: [] — what CANNOT be shared
  permitted_disclosures: []
  penalties: []
  governing_law
  non_compete_clauses: []
  project_restrictions: []

SUBMITTALS — Extract:
  submittal_type, submittal_number
  submitted_by, submitted_to, submitted_date
  response_required_by
  approved, approved_with_comments, rejected
  comments: []
  resubmittal_required
  product_data: {}
  shop_drawing_sheets: []

INSPECTION REPORTS — Extract:
  inspection_date, inspector_name, inspector_id
  result: pass/fail/conditional
  items_passed: [], items_failed: []
  corrections_required: [] — specific items to fix
  re_inspection_required, re_inspection_date
  stop_work_issued

INSURANCE CERTS — Extract:
  insured_name, policy_number
  insurer, agent_name, agent_phone
  policy_type
  effective_date, expiry_date
  coverage_amounts: {}
  additional_insured: []
  certificate_holder
  project_specific

LICENSES — Extract:
  license_number, license_type, license_holder
  issued_date, expiry_date, state
  contractor_classifications: [] — C-10, C-36, etc
  bonding_amount, insurance_amount
  restrictions: []
  qualifying_individual
  renewal_date

ALWAYS INCLUDE:
  flags: [{severity, category, message}]
    - severity: info | warning | critical
    - category: deadline | compliance | scope | financial | safety | legal
    - Flag: expiry within 30 days (warning), expired (critical)
    - Flag: missing scope items (scope)
    - Flag: penalty clauses over $1000/day (financial)
    - Flag: OSHA or code violations (safety/compliance)
    - Flag: unusual contract terms (legal)
    - Flag: missing insurance (financial)
  
  rfi_candidates: [] — questions that NEED answers before work starts
  scope_gaps: [] — things that should be specified but aren't
  action_items: [] — what John needs to do TODAY based on this document
  ai_notes: 2-3 sentence plain English summary, written to the contractor`

  const userPrompt = `Analyze this ${params.docType} document: "${params.fileName}"

Return JSON with EXACTLY this structure:
{
  "extracted_data": { ...all fields for this document type... },
  "doc_type_confirmed": "permit|blueprint|contract|nda|submittal|inspection|insurance|license|other",
  "ai_notes": "plain English summary for the contractor",
  "flags": [{"severity": "warning", "category": "deadline", "message": "..."}],
  "rfi_candidates": ["question 1", "question 2"],
  "scope_gaps": ["gap 1", "gap 2"],
  "action_items": ["do this now", "do this by date X"]
}`

  const content: any[] = []

  if (params.mimeType === 'application/pdf') {
    content.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: params.fileBase64 },
    })
  } else if (params.mimeType.startsWith('image/')) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: params.mimeType as any, data: params.fileBase64 },
    })
  }

  content.push({ type: 'text', text: userPrompt })

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content }],
  })

  const text  = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    return {
      extracted_data: { raw_text: text },
      ai_notes: 'Document was read but structured extraction failed. Raw text preserved.',
      doc_type_confirmed: params.docType,
      flags: [{ severity: 'warning', category: 'compliance', message: 'Could not fully parse. Review manually.' }],
      rfi_candidates: [],
      scope_gaps: [],
      action_items: ['Review this document manually — AI extraction failed'],
    }
  }
}

// ── BLUEPRINT DEEP SCAN ───────────────────────────────────
// Full analysis for an electrical/plumbing sub reviewing plans.
// Finds scope gaps, code issues, and generates RFIs.

export async function analyzeBlueprint(params: {
  fileBase64: string
  mimeType: string
  projectName: string
  jurisdiction: string
  jobType: 'electrical' | 'plumbing' | 'both'
  existingChangeOrders?: string[]
}): Promise<BlueprintAnalysis> {

  const systemPrompt = `You are a senior ${params.jobType} contractor with 25 years of experience on commercial casino-grade projects.
You are reviewing blueprints for ${params.projectName} in ${params.jurisdiction}.
You know Clark County code requirements, NEC 2020, IPC 2021, and what inspectors look for.
You think like someone who has lost money from vague specs and wants to protect this contractor.
Return ONLY valid JSON.`

  const changeOrderContext = params.existingChangeOrders?.length
    ? `\n\nExisting change orders on this project:\n${params.existingChangeOrders.join('\n')}\nFlag any conflicts between these changes and what you see in the blueprints.`
    : ''

  const userPrompt = `Review these blueprints for ${params.projectName}.
Trade: ${params.jobType}${changeOrderContext}

Return JSON:
{
  "what_to_add": ["items missing that should be added - be specific with locations and specs"],
  "what_to_remove": ["items that are problematic, redundant, or non-compliant - cite reasons"],
  "code_issues": ["specific violations - cite NEC section, IPC section, or Clark County code"],
  "cost_saving_opportunities": ["specific ways to reduce cost without sacrificing quality or compliance"],
  "safety_flags": ["OSHA, NEC, or IPC safety concerns that MUST be addressed"],
  "scope_gaps": ["things not specified that need to be before work starts - protect yourself"],
  "rfi_candidates": ["questions that NEED answers from GC or architect before you start - be specific"],
  "spec_conflicts": ["conflicts between different sheets or between specs and drawings"],
  "summary": "3 sentence plain English summary of what the contractor needs to know"
}`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: [
        params.mimeType === 'application/pdf'
          ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: params.fileBase64 } }
          : { type: 'image', source: { type: 'base64', media_type: params.mimeType as any, data: params.fileBase64 } },
        { type: 'text', text: userPrompt },
      ],
    }],
  })

  const text  = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    return {
      what_to_add: [],
      what_to_remove: [],
      code_issues: [],
      cost_saving_opportunities: [],
      safety_flags: ['Could not analyze — ensure file is a clear PDF or high-res image'],
      scope_gaps: [],
      rfi_candidates: [],
      spec_conflicts: [],
      summary: 'Blueprint analysis failed. Re-upload a clearer file.',
    }
  }
}

// ── BLUEPRINT vs CHANGE ORDER CONFLICT DETECTOR ───────────
// Compares blueprint specs against approved/pending change orders.
// Tells John exactly where the GC's changes conflict with the plans.

export async function detectConflicts(params: {
  blueprintSummary: string
  changeOrders: Array<{ title: string; description: string; status: string; cost_impact: number }>
  projectName: string
}): Promise<ConflictReport> {

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: `You are a senior construction claims consultant reviewing potential conflicts between original blueprints and subsequent change orders for ${params.projectName}.
You identify conflicts that could cause disputes, rework, or legal exposure.
Return ONLY valid JSON.`,
    messages: [{
      role: 'user',
      content: `Original blueprint summary:
${params.blueprintSummary}

Change orders on this project:
${params.changeOrders.map((co, i) => `${i+1}. [${co.status.toUpperCase()}] ${co.title}: ${co.description} ($${co.cost_impact} impact)`).join('\n')}

Identify conflicts and return JSON:
{
  "conflicts": [{
    "severity": "minor|major|critical",
    "description": "what conflicts",
    "blueprint_reference": "what the blueprint says",
    "change_order_reference": "what the change order says",
    "recommendation": "what John should do"
  }],
  "summary": "plain English summary",
  "rfi_needed": true|false
}`,
    }],
  })

  const text  = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    return { conflicts: [], summary: 'Could not analyze conflicts.', rfi_needed: false }
  }
}

// ── RFI GENERATOR ─────────────────────────────────────────
// Takes blueprint analysis or document gaps and generates
// formal RFI text ready to send to the GC/architect.

export async function generateRFIs(params: {
  rfiCandidates: string[]
  projectName: string
  gcName: string
  tradeType: string
  submittedBy: string
}): Promise<Array<{
  subject: string
  question: string
  why_needed: string
  impact_if_unanswered: string
}>> {

  if (!params.rfiCandidates.length) return []

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: `You write formal RFIs (Requests for Information) for construction projects.
You are writing on behalf of ${params.submittedBy}, a ${params.tradeType} subcontractor.
RFIs must be professional, specific, and make clear the business impact of not getting an answer.
Return ONLY valid JSON.`,
    messages: [{
      role: 'user',
      content: `Project: ${params.projectName}
GC/Architect: ${params.gcName}
Trade: ${params.tradeType}

The following questions need to become formal RFIs:
${params.rfiCandidates.map((q, i) => `${i+1}. ${q}`).join('\n')}

Convert each into a formal RFI. Return JSON array:
[{
  "subject": "short RFI title",
  "question": "formal professional question, 2-3 sentences, specific",
  "why_needed": "why this is blocking work",
  "impact_if_unanswered": "what happens to schedule and cost if ignored"
}]`,
    }],
  })

  const text  = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    return []
  }
}

// ── DAILY LOG AI SUMMARY ──────────────────────────────────

export async function summarizeDailyLog(params: {
  log_date: string
  work_completed: string
  issues?: string
  materials_used?: string
  hours_worked?: number
  crew_present?: string
  weather?: string
  project_name: string
}): Promise<string> {

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: `You write professional construction daily log summaries for a commercial electrical/plumbing contractor.
Write in past tense, 2 sentences. Be specific. Include hours and crew if provided.
Mention any issues or delays clearly — these are legal records.`,
    messages: [{
      role: 'user',
      content: `Summarize this daily log for ${params.project_name}:
Date: ${params.log_date}
Work: ${params.work_completed}
Hours: ${params.hours_worked || 'not specified'}
Crew: ${params.crew_present || 'not specified'}
Weather: ${params.weather || 'not specified'}
Issues: ${params.issues || 'none'}
Materials: ${params.materials_used || 'not specified'}

Write only the 2-sentence summary.`,
    }],
  })

  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}

// ── CHANGE ORDER AI SUMMARY ───────────────────────────────

export async function summarizeChangeOrder(params: {
  title: string
  description: string
  requested_by: string
  cost_impact: number
  time_impact_days: number
  project_name: string
}): Promise<string> {

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: `You write professional change order summaries for GC records.
2 sentences. Be specific about cost and time impact. Professional tone.`,
    messages: [{
      role: 'user',
      content: `Summarize for ${params.project_name}:
Change: ${params.title}
Requested by: ${params.requested_by}
Description: ${params.description}
Cost: $${params.cost_impact}
Time: ${params.time_impact_days} days
Write only the 2-sentence summary.`,
    }],
  })

  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}

// ── PROJECT CHAT ──────────────────────────────────────────
// Answers questions about the project using all available context.

export async function chatWithProject(params: {
  userMessage: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  projectContext: string
}): Promise<string> {

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: `You are an expert construction project assistant for a commercial electrical/plumbing subcontractor.
You have full context of this project.
Be direct, practical, and think like a senior PM who has seen everything go wrong.
Always give actionable advice. Call out risks immediately. Protect the contractor.

Project context:
${params.projectContext}`,
    messages: [
      ...params.conversationHistory,
      { role: 'user', content: params.userMessage },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
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

  const context = [
    `Project: ${params.projectName}`,
    `Sub: ${params.subName} (${params.trade})`,
    params.bidAmount ? `Bid: $${params.bidAmount.toLocaleString()}` : '',
    params.permitConditions.length ? `Permit requirements: ${params.permitConditions.join(', ')}` : '',
  ].filter(Boolean).join('\n')

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: `You write professional replies to subcontractors. Direct, under 150 words. No fluff.`,
    messages: [{
      role: 'user',
      content: `Reply to ${params.subName} about their ${params.trade} bid.\n${context}\nSign as ${params.gcName}.`,
    }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
