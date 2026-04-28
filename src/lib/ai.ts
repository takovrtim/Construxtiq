// ─────────────────────────────────────────────────────────
// CONSTRUCTIQ — AI Service (Claude API)
// All Anthropic API calls go through here.
// Never call the API directly from components or route handlers.
// ─────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk'
import type { ExtractedData } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 2048

// ── DOCUMENT PARSING ──────────────────────────────────────
// Reads raw text extracted from a PDF and returns structured data.
export async function parseDocument(
  rawText: string,
  fileName: string,
  docType: string
): Promise<ExtractedData> {
  const prompt = `You are a construction document parser for a General Contractor management platform.

Parse the following document and extract structured data. Return ONLY valid JSON — no markdown, no explanation, no backticks.

Document name: ${fileName}
Document type hint: ${docType}

Document text:
${rawText.slice(0, 8000)}

Return this exact JSON structure (use null for missing fields):
{
  "permit_number": string | null,
  "permit_type": string | null,
  "issued_date": "YYYY-MM-DD" | null,
  "expiry_date": "YYYY-MM-DD" | null,
  "jurisdiction": string | null,
  "valuation": number | null,
  "sq_footage": number | null,
  "inspector_name": string | null,
  "inspector_email": string | null,
  "contractor_name": string | null,
  "contractor_license": string | null,
  "scope_summary": string | null,
  "total_amount": number | null,
  "start_date": "YYYY-MM-DD" | null,
  "completion_date": "YYYY-MM-DD" | null,
  "trade": string | null,
  "contractor_email": string | null,
  "special_conditions": string[],
  "key_dates": [{"label": string, "date": "YYYY-MM-DD"}],
  "flags": [{"severity": "info"|"warning"|"critical", "message": string}],
  "raw_fields": {}
}`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Strip any accidental markdown fences
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  const parsed = JSON.parse(clean) as ExtractedData
  return parsed
}

// ── AI NOTES GENERATOR ────────────────────────────────────
// Generates a short plain-English summary of what the AI found in a document.
export async function generateDocumentNotes(
  extractedData: ExtractedData,
  projectContext: string
): Promise<string> {
  const prompt = `You are a construction project assistant. Given extracted document data, write 2-3 concise sentences of notes for a General Contractor. Focus on critical dates, risks, and action items. Be direct. No fluff.

Project context: ${projectContext}

Extracted data: ${JSON.stringify(extractedData, null, 2)}

Write only the notes, no labels, no formatting.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}

// ── BID ANALYSIS ──────────────────────────────────────────
// Analyzes a subcontractor bid against market data and project requirements.
export async function analyzeBid(params: {
  subName: string
  trade: string
  bidAmount: number
  scopeSummary: string
  projectContext: string
  permitConditions: string[]
}): Promise<{
  score: string
  marketRateLow: number
  marketRateHigh: number
  variancePct: number
  flagSeverity: 'info' | 'warning' | 'critical' | null
  flagMessage: string | null
  notes: string
}> {
  const prompt = `You are a construction cost estimator AI for a General Contractor platform.

Analyze this subcontractor bid. Return ONLY valid JSON — no markdown, no explanation.

Trade: ${params.trade}
Sub company: ${params.subName}
Their bid: $${params.bidAmount.toLocaleString()}
Scope: ${params.scopeSummary}
Project context: ${params.projectContext}
Permit requirements: ${params.permitConditions.join('; ') || 'none specified'}

Return this exact JSON:
{
  "score": "A" | "B+" | "B" | "C+" | "C" | "D",
  "market_rate_low": number,
  "market_rate_high": number,
  "variance_pct": number,
  "flag_severity": "info" | "warning" | "critical" | null,
  "flag_message": string | null,
  "notes": string
}

Scoring guide:
- A: bid is at or below market, scope is complete, no issues
- B+/B: bid is slightly above market or has minor scope notes
- C+/C: bid is significantly over market OR has scope gaps
- D: bid should be rejected

flag_message should be a single internal note for the GC (never shown to the sub).`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const result = JSON.parse(clean)

  return {
    score: result.score,
    marketRateLow: result.market_rate_low,
    marketRateHigh: result.market_rate_high,
    variancePct: result.variance_pct,
    flagSeverity: result.flag_severity,
    flagMessage: result.flag_message,
    notes: result.notes,
  }
}

// ── EMAIL / REPLY COMPOSER ────────────────────────────────
// Drafts a professional reply to a subcontractor based on project context.
export async function draftSubReply(params: {
  subName: string
  trade: string
  bidAmount: number | null
  aiScore: string | null
  aiNotes: string | null
  flagMessage: string | null
  variancePct: number | null
  projectName: string
  permitConditions: string[]
  gcName: string
}): Promise<string> {
  const prompt = `You are writing a professional email reply on behalf of a General Contractor.

Write a clear, professional, direct reply to this subcontractor. Be firm but respectful. Address specific issues. Do not use flowery language. Sign off as "${params.gcName}, Project Management".

Context:
- Project: ${params.projectName}
- Subcontractor: ${params.subName}
- Trade: ${params.trade}
- Their bid: ${params.bidAmount ? '$' + params.bidAmount.toLocaleString() : 'not specified'}
- AI score: ${params.aiScore || 'not scored'}
- Internal notes: ${params.aiNotes || 'none'}
- Flag: ${params.flagMessage || 'none'}
- Variance from market: ${params.variancePct !== null ? params.variancePct.toFixed(1) + '%' : 'unknown'}
- Permit conditions relevant to this trade: ${params.permitConditions.join('; ') || 'none'}

Write only the email body. No subject line. Start with "Dear ${params.subName}," and end with the sign-off. Do not add any labels or formatting.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}

// ── TRAINING MODULE GENERATOR ─────────────────────────────
// Generates a training module from blueprint/permit text.
export async function generateTrainingModule(params: {
  moduleTitle: string
  documentText: string
  projectName: string
  projectLocation: string
  permitNumbers: string[]
}): Promise<{ content: string; readTimeMinutes: number }> {
  const prompt = `You are writing a construction site training module for new crew members.

Write a clear, practical training module. Use plain language — these are field workers, not engineers. Include specific details from the documents provided. Use headers and bullet points for readability. Keep it under 600 words.

Module title: ${params.moduleTitle}
Project: ${params.projectName} (${params.projectLocation})
Active permits: ${params.permitNumbers.join(', ') || 'see documents'}

Source documents:
${params.documentText.slice(0, 6000)}

Write only the module content. Start directly with the content — no preamble.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  const wordCount = content.split(/\s+/).length
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))

  return { content, readTimeMinutes }
}

// ── SCOPE EMAIL GENERATOR ────────────────────────────────
// Generates a targeted scope email for a specific sub — only their trade, nothing else.
// GC never exposes budget, other trades, or internal flags.
export async function generateScopeEmail(params: {
  subName: string
  trade: string
  scopeSummary: string
  extractedData: Record<string, unknown>
  projectName: string
  gcName: string
  documentName: string
}): Promise<string> {
  const prompt = `You are writing a scope distribution email on behalf of a General Contractor.

The GC is sending this sub ONLY the scope relevant to their trade. Do NOT mention budget, other trades, permit numbers, or any internal flags.

Write a clear, professional email that:
1. States the project and trade scope being shared
2. Lists the key requirements from the document (from extracted data below) that apply to this sub's trade
3. Lists any key dates or deadlines relevant to them
4. Asks them to confirm receipt and their availability to proceed
5. Sign off as "${params.gcName}, Project Management"

Project: ${params.projectName}
Sub company: ${params.subName}
Trade: ${params.trade}
Source document: ${params.documentName}
Scope summary: ${params.scopeSummary || 'See attached details'}
Relevant extracted data: ${JSON.stringify(params.extractedData, null, 2).slice(0, 2000)}

Write only the email body. Start with "Dear ${params.subName}," — no subject line, no labels.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}

// ── AI CHAT ───────────────────────────────────────────────
// Answers questions about a project using all available context.
export async function chatWithProject(params: {
  userMessage: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  projectContext: string   // JSON summary of project state
}): Promise<string> {
  const systemPrompt = `You are ConstructIQ, an AI assistant for General Contractors. You have complete knowledge of the user's current project. Answer questions clearly and directly. Be specific — reference actual permit numbers, amounts, company names from the context. Keep answers concise (under 150 words unless detail is needed).

Project context:
${params.projectContext}`

  const messages = [
    ...params.conversationHistory,
    { role: 'user' as const, content: params.userMessage },
  ]

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: systemPrompt,
    messages,
  })

  return response.content[0].type === 'text' ? response.content[0].text.trim() : ''
}
