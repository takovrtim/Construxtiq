import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { context, projectName, gcName } = await req.json()

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 600,
    system: `You are a senior construction project manager writing a concise weekly briefing for a General Contractor.
Write in plain, direct language. No corporate jargon. Max 250 words.
Structure: 1) Overall status (1 sentence), 2) Top 3 priorities this week, 3) Financial snapshot, 4) One recommendation.
Be specific and actionable. This is private — speak candidly.`,
    messages: [{
      role: 'user',
      content: `Write a weekly executive summary for ${gcName} at ${projectName}.\n\nProject data:\n${context}`,
    }],
  })

  const summary = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ success: true, summary })
}
