import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const admin    = createAdminSupabase()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { change_order_id, gc_email, gc_name } = body

  if (!change_order_id || !gc_email) {
    return NextResponse.json({ error: 'Missing change_order_id or gc_email' }, { status: 400 })
  }

  const { data: co } = await admin.from('change_orders')
    .select('*, projects(name), users!change_orders_user_id_fkey(full_name, company_name, email, phone)')
    .eq('id', change_order_id).single()

  if (!co) return NextResponse.json({ error: 'Change order not found' }, { status: 404 })

  const token = co.approval_token || `co_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  await admin.from('change_orders').update({
    approval_token: token,
    gc_email,
    gc_name: gc_name || co.gc_name,
    sent_at: new Date().toISOString(),
  }).eq('id', change_order_id)

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://construxtiq-two.vercel.app'
  const approveUrl = `${appUrl}/approve/${token}`
  const subName    = co.users?.company_name || co.users?.full_name || 'Subcontractor'
  const subEmail   = co.users?.email || ''
  const subPhone   = co.users?.phone || ''
  const project    = co.projects?.name || 'Construction Project'
  const coNum      = `CO-${String(change_order_id).slice(-6).toUpperCase()}`
  const costStr    = co.cost_impact > 0 ? `$${Number(co.cost_impact).toLocaleString()}` : 'TBD'
  const dateStr    = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const detailRows = [
    { label: 'Reference', value: coNum },
    { label: 'Project', value: project },
    { label: 'Submitted By', value: subName },
    { label: 'Cost Impact', value: costStr },
    co.schedule_impact_days ? { label: 'Schedule Impact', value: `${co.schedule_impact_days} calendar days` } : null,
    { label: 'Submitted', value: dateStr },
  ].filter(Boolean) as { label: string; value: string }[]

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Change Order Approval Request</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <tr><td style="padding-bottom:20px;text-align:center;">
    <span style="display:inline-block;background:#ea580c;width:32px;height:32px;border-radius:8px;line-height:32px;text-align:center;color:white;font-weight:900;font-size:16px;vertical-align:middle;">S</span>
    <span style="font-size:18px;font-weight:800;color:#111827;vertical-align:middle;margin-left:8px;letter-spacing:-0.5px;">SubIQ</span>
  </td></tr>

  <tr><td style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <table width="100%" cellpadding="0" cellspacing="0">

      <tr><td style="background:#ea580c;padding:28px 36px;">
        <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Change Order Approval Request</div>
        <div style="font-size:22px;font-weight:800;color:white;line-height:1.2;margin-bottom:4px;">${co.title}</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.75);">${coNum} &nbsp;|&nbsp; ${project}</div>
      </td></tr>

      <tr><td style="padding:28px 36px;">
        <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px;">
          ${gc_name ? `Hi ${gc_name},` : 'Hi,'}<br><br>
          <strong>${subName}</strong> has submitted a change order for your review and written approval on <strong>${project}</strong>.
          Work cannot proceed on this scope change without your authorization.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:20px 24px;">
            <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px;">Change Order Details</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${detailRows.map(row => `
              <tr>
                <td style="font-size:13px;color:#6b7280;padding:7px 0;border-bottom:1px solid #f3f4f6;width:45%;">${row.label}</td>
                <td style="font-size:13px;font-weight:600;color:#111827;padding:7px 0;border-bottom:1px solid #f3f4f6;text-align:right;">${row.value}</td>
              </tr>`).join('')}
            </table>
          </td></tr>
        </table>

        ${co.description ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td style="padding:18px 20px;background:#fff7ed;border-left:3px solid #ea580c;border-radius:0 10px 10px 0;">
            <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Scope Description</div>
            <div style="font-size:14px;color:#374151;line-height:1.6;">${co.description}</div>
          </td></tr>
        </table>` : ''}

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td align="center" style="padding-bottom:12px;">
            <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:white;font-size:16px;font-weight:700;padding:16px 52px;border-radius:12px;text-decoration:none;letter-spacing:-0.2px;">
              Approve Change Order
            </a>
          </td></tr>
          <tr><td align="center">
            <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">Or view, approve, or reject at:</div>
            <a href="${approveUrl}" style="font-size:12px;color:#ea580c;word-break:break-all;">${approveUrl}</a>
          </td></tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:14px 16px;background:#fef2f2;border-radius:10px;border:1px solid #fecaca;">
            <div style="font-size:12px;color:#991b1b;line-height:1.6;">
              <strong>Notice:</strong> Your approval constitutes written authorization for the above scope and cost.
              This response is timestamped and recorded. If you have questions or need to reject, please respond using the link above.
            </div>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:18px 36px;border-top:1px solid #f3f4f6;background:#f9fafb;">
        <div style="font-size:12px;color:#6b7280;">
          From: <strong style="color:#374151;">${subName}</strong>
          ${subEmail ? ` &nbsp;&bull;&nbsp; <a href="mailto:${subEmail}" style="color:#ea580c;text-decoration:none;">${subEmail}</a>` : ''}
          ${subPhone ? ` &nbsp;&bull;&nbsp; ${subPhone}` : ''}
        </div>
        <div style="font-size:11px;color:#9ca3af;margin-top:4px;">Sent via SubIQ &mdash; subcontractor documentation software</div>
      </td></tr>

    </table>
  </td></tr>

  <tr><td style="padding:20px 0;text-align:center;">
    <div style="font-size:11px;color:#9ca3af;">SubIQ &mdash; Built for subs. Not against them.</div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'changes@subiq.co',
      to: gc_email,
      reply_to: subEmail || undefined,
      subject: `Action Required: Change Order Approval -- ${co.title} (${coNum})`,
      html,
    })
    return NextResponse.json({ success: true, token, approveUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

