import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { change_id, gc_email, gc_name } = await req.json().catch(() => ({}))
  if (!change_id || !gc_email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Get change order â€” verify ownership
  const { data: change } = await supabase
    .from('change_orders')
    .select('*, projects(name)')
    .eq('id', change_id)
    .eq('user_id', user.id)
    .single()

  if (!change) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Generate approval token if not exists
  let token = change.approval_token
  if (!token) {
    token = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    await supabase.from('change_orders').update({ approval_token: token }).eq('id', change_id)
  }

  const approvalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/approve/${token}`
  const { data: sender } = await supabase.from('users').select('full_name, company_name').eq('id', user.id).single()

  const senderName    = sender?.company_name || sender?.full_name || 'Contractor'
  const projectName   = (change.projects as any)?.name || 'Project'
  const costImpact    = Number(change.cost_impact || 0)
  const timeImpact    = Number(change.time_impact_days || 0)

  // Send via Resend
  const emailBody = {
    from: process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev',
    to: gc_email,
    subject: `Change Order Approval Required â€” ${projectName}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; background: #f6f4f1; padding: 32px 16px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto;">

    <!-- Header -->
    <div style="background: #0a0a0a; border-radius: 14px 14px 0 0; padding: 20px 28px; display: flex; align-items: center; gap: 10px;">
      <div style="width: 28px; height: 28px; background: #E8520A; border-radius: 7px; display: inline-block;"></div>
      <span style="color: white; font-size: 15px; font-weight: 800; letter-spacing: -0.3px; margin-left: 10px;">SubIQ</span>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 28px; border: 1px solid #e8e3da; border-top: none; border-radius: 0 0 14px 14px;">

      <p style="font-size: 14px; color: #555; margin: 0 0 20px;">
        ${gc_name ? `Hi ${gc_name},` : 'Hello,'}<br><br>
        <strong>${senderName}</strong> has submitted a change order for <strong>${projectName}</strong> that requires your approval.
      </p>

      <!-- Change order box -->
      <div style="background: #f6f4f1; border-radius: 10px; padding: 20px; margin-bottom: 20px; border: 1px solid #e8e3da;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin-bottom: 8px;">Change Order</div>
        <div style="font-size: 18px; font-weight: 800; color: #0a0a0a; margin-bottom: 12px; letter-spacing: -0.3px;">${change.title}</div>
        ${change.description ? `<div style="font-size: 13px; color: #555; line-height: 1.6; margin-bottom: 14px;">${change.description}</div>` : ''}
        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 3px;">Cost Impact</div>
            <div style="font-size: 20px; font-weight: 800; color: ${costImpact > 0 ? '#C0392B' : '#0a0a0a'};">+$${costImpact.toLocaleString()}</div>
          </div>
          ${timeImpact > 0 ? `
          <div>
            <div style="font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 3px;">Schedule Impact</div>
            <div style="font-size: 20px; font-weight: 800; color: #C0392B;">+${timeImpact} day${timeImpact !== 1 ? 's' : ''}</div>
          </div>` : ''}
        </div>
      </div>

      ${change.requires_permit_revision ? `
      <div style="background: #FEF8EE; border: 1px solid rgba(160,90,0,0.2); border-left: 3px solid #A05A00; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: #6b4010; font-weight: 600;">
        âš ï¸ This change requires a permit revision before work can proceed
      </div>` : ''}

      <!-- Legal note -->
      <div style="font-size: 12px; color: #888; line-height: 1.6; margin-bottom: 24px; padding: 12px; background: #fafafa; border-radius: 8px; border: 1px solid #ede9e4;">
        Your approval constitutes written authorization for <strong>${senderName}</strong> to proceed with the described work at the stated cost and schedule impact. This approval will be timestamped and legally binding.
      </div>

      <!-- CTA Buttons -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <a href="${approvalUrl}?action=approve" style="flex: 1; display: block; padding: 14px; text-align: center; background: #1a4d31; color: white; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 800; letter-spacing: -0.2px;">
          âœ“ Approve
        </a>
        <a href="${approvalUrl}?action=reject" style="flex: 1; display: block; padding: 14px; text-align: center; background: #C0392B; color: white; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 800; letter-spacing: -0.2px;">
          âœ• Reject
        </a>
      </div>

      <p style="font-size: 12px; color: #aaa; text-align: center; margin: 0;">
        Or <a href="${approvalUrl}" style="color: #E8520A;">view full details and respond here</a>
      </p>
    </div>

    <p style="font-size: 11px; color: #bbb; text-align: center; margin-top: 16px;">
      Sent via SubIQ Â· Secure Â· Timestamped
    </p>
  </div>
</body>
</html>`,
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send(emailBody)
    return NextResponse.json({ success: true, approval_url: approvalUrl })
  } catch (err: any) {
    // Still return the URL even if email fails
    return NextResponse.json({
      success: false,
      approval_url: approvalUrl,
      error: 'Email failed â€” use approval link directly',
    })
  }
}
