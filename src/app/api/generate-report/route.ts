import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Write a professional project status report for a general contractor. Be specific, actionable, and highlight risks. Use plain paragraphs — no bullet points or markdown.

Project: ${body.project.name}
Address: ${body.project.address || 'Not specified'}

Financial:
- Total invoiced: $${body.stats.totalRevenue.toLocaleString()}
- Collected: $${body.stats.totalPaid.toLocaleString()}
- Total costs: $${body.stats.totalCosts.toLocaleString()}
- Gross profit: $${(body.stats.totalRevenue - body.stats.totalCosts).toLocaleString()}
- Change orders total: $${body.stats.totalChangeCost.toLocaleString()}

Progress:
- Total jobs: ${body.jobCount} (${body.stats.activeJobs} active, ${body.stats.completedJobs} completed)
- Daily logs: ${body.logCount}
- Total labor hours: ${body.stats.totalHours}h

Compliance:
- Permits: ${body.permitCount}
- Inspections passed: ${body.stats.passedInspect}
- Safety checklists: ${body.safetyCount} (${body.stats.safetyRate}% all-clear rate)
- Change orders: ${body.changeCount}

Write 3-4 sentences covering: overall project health, financial status, any concerns, and recommended next actions. Be direct and professional.`
    }],
  })

  const report = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  return NextResponse.json({ success: true, report })
}
