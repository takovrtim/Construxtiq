import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin   = createAdminSupabase()
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'https://construxtiq-two.vercel.app'
  const sent: string[] = []
  const errors: string[] = []

  // Get all active users
  const { data: users } = await admin.from('users')
    .select('id, email, full_name, company_name, notif_invoices')
    .not('email', 'is', null)

  if (!users?.length) return NextResponse.json({ success: true, sent: 0 })

  for (const user of users) {
    if (!user.email) continue

    // Get their active project
    const { data: projects } = await admin.from('projects')
      .select('id, name').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)

    if (!projects?.length) continue
    const project = projects[0]

    const now     = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()

    // Fetch this week's activity
    const [
      { data: delays },
      { data: rfis },
      { data: changes },
      { data: permits },
      { data: logs },
      { data: safety },
    ] = await Promise.all([
      admin.from('delay_logs').select('days_lost, caused_by').eq('project_id', project.id).gte('created_at', weekAgo),
      admin.from('rfis').select('status, response_needed_by').eq('project_id', project.id).eq('status', 'open'),
      admin.from('change_orders').select('status, cost_impact, title').eq('project_id', project.id).eq('status', 'pending'),
      admin.from('permits').select('permit_number, expiry_date').eq('project_id', project.id).eq('status', 'active'),
      admin.from('job_logs').select('id').eq('project_id', project.id).gte('created_at', weekAgo),
      admin.from('safety_checklists').select('id, all_clear').eq('project_id', project.id).gte('created_at', weekAgo),
    ])

    const totalDelayDays   = (delays || []).reduce((s: number, d: any) => s + (d.days_lost || 0), 0)
    const gcDelayDays      = (delays || []).filter((d: any) => d.caused_by === 'gc').reduce((s: number, d: any) => s + (d.days_lost || 0), 0)
    const pendingChanges   = changes || []
    const pendingChangeVal = pendingChanges.reduce((s: number, c: any) => s + Number(c.cost_impact || 0), 0)
    const openRFIs         = rfis || []
    const logsThisWeek     = (logs || []).length
    const safetyThisWeek   = (safety || []).length

    const expiringPermits  = (permits || []).filter((p: any) => {
      if (!p.expiry_date) return false
      const days = Math.ceil((new Date(p.expiry_date).getTime() - now.getTime()) / 86400000)
      return days >= 0 && days <= 30
    })

    const overdueRFIs = (rfis || []).filter((r: any) => {
      if (!r.response_needed_by) return false
      return new Date(r.response_needed_by) < now
    })

    const firstName = user.full_name?.split(' ')[0] || 'there'
    const hasAlerts = overdueRFIs.length > 0 || expiringPermits.length > 0 || pendingChanges.length > 0

    const alertRows = [
      ...overdueRFIs.map(() => ({
        color: '#991b1b', bg: '#fef2f2', border: '#ef4444',
        text: `${overdueRFIs.length} RFI${overdueRFIs.length > 1 ? 's' : ''} past deadline -- GC has not responded`,
        sub: 'Every day without a response is documented delay',
        link: `${appUrl}/rfi`,
        cta: 'View RFIs',
      })),
      ...expiringPermits.map((p: any) => {
        const days = Math.ceil((new Date(p.expiry_date).getTime() - now.getTime()) / 86400000)
        return {
          color: '#92400e', bg: '#fffbeb', border: '#f59e0b',
          text: `Permit ${p.permit_number} expires in ${days} day${days !== 1 ? 's' : ''}`,
          sub: 'Renew before the expiry date to avoid a stop-work order',
          link: `${appUrl}/documents`,
          cta: 'View Permit',
        }
      }),
      ...(pendingChanges.length > 0 ? [{
        color: '#1e40af', bg: '#eff6ff', border: '#3b82f6',
        text: `${pendingChanges.length} change order${pendingChanges.length > 1 ? 's' : ''} waiting for GC approval`,
        sub: `${pendingChangeVal > 0 ? `$${pendingChangeVal.toLocaleString()} ` : ''}pending written authorization`,
        link: `${appUrl}/changes`,
        cta: 'Send Approval Link',
      }] : []),
    ]

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SubIQ Weekly Digest</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <tr><td style="padding-bottom:20px;text-align:center;">
    <span style="display:inline-block;background:#ea580c;width:32px;height:32px;border-radius:8px;line-height:32px;text-align:center;color:white;font-weight:900;font-size:16px;vertical-align:middle;">S</span>
    <span style="font-size:18px;font-weight:800;color:#111827;vertical-align:middle;margin-left:8px;letter-spacing:-0.5px;">SubIQ</span>
    <div style="font-size:12px;color:#9ca3af;margin-top:6px;">Weekly Digest &mdash; ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
  </td></tr>

  <tr><td style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <table width="100%" cellpadding="0" cellspacing="0">

      <tr><td style="background:#0a0a0a;padding:24px 32px;">
        <div style="font-size:20px;font-weight:800;color:white;margin-bottom:4px;">Good morning, ${firstName}</div>
        <div style="font-size:14px;color:#6b7280;">Here is your week on ${project.name}</div>
      </td></tr>

      <tr><td style="padding:28px 32px;">

        <!-- WEEKLY STATS -->
        <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:14px;">This Week</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            ${[
              { label: 'Daily Logs', value: logsThisWeek, ok: logsThisWeek >= 5 },
              { label: 'Safety Checks', value: safetyThisWeek, ok: safetyThisWeek >= 5 },
              { label: 'Delay Days', value: `${totalDelayDays}d`, ok: totalDelayDays === 0 },
              { label: 'GC Caused', value: `${gcDelayDays}d`, ok: gcDelayDays === 0 },
            ].map(s => `
            <td style="width:25%;text-align:center;padding:14px 8px;background:#f9fafb;border-radius:10px;margin:0 4px;">
              <div style="font-size:22px;font-weight:800;color:${s.ok ? '#16a34a' : '#dc2626'};">${s.value}</div>
              <div style="font-size:11px;color:#9ca3af;margin-top:3px;">${s.label}</div>
            </td>`).join('<td style="width:8px;"></td>')}
          </tr>
        </table>

        <!-- ALERTS -->
        ${hasAlerts ? `
        <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Needs Attention</div>
        ${alertRows.map(a => `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
          <tr><td style="padding:14px 16px;background:${a.bg};border-radius:10px;border-left:3px solid ${a.border};">
            <div style="font-size:13px;font-weight:700;color:${a.color};margin-bottom:3px;">${a.text}</div>
            <div style="font-size:12px;color:${a.color};opacity:0.8;margin-bottom:10px;">${a.sub}</div>
            <a href="${a.link}" style="display:inline-block;background:${a.border};color:white;font-size:12px;font-weight:700;padding:7px 16px;border-radius:7px;text-decoration:none;">${a.cta}</a>
          </td></tr>
        </table>`).join('')}` : `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr><td style="padding:16px;background:#f0fdf4;border-radius:10px;border-left:3px solid #22c55e;text-align:center;">
            <div style="font-size:14px;font-weight:700;color:#166534;">No urgent alerts this week</div>
            <div style="font-size:12px;color:#16a34a;margin-top:3px;">Your case file is building. Keep logging daily.</div>
          </td></tr>
        </table>`}

        <!-- OPEN RFIs -->
        ${openRFIs.length > 0 ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr><td style="padding:14px 16px;background:#f9fafb;border-radius:10px;">
            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:3px;">${openRFIs.length} open RFI${openRFIs.length > 1 ? 's' : ''} awaiting GC response</div>
            <div style="font-size:12px;color:#6b7280;">Every day without a response is documented delay you can claim.</div>
          </td></tr>
        </table>` : ''}

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="padding:8px 0 24px;">
            <a href="${appUrl}/dashboard" style="display:inline-block;background:#ea580c;color:white;font-size:15px;font-weight:700;padding:14px 40px;border-radius:11px;text-decoration:none;letter-spacing:-0.2px;">
              Open SubIQ Dashboard
            </a>
          </td></tr>
        </table>

        <div style="font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;border-top:1px solid #f3f4f6;padding-top:20px;">
          SubIQ is building your legal case file every day.<br>
          The more you log, the stronger your protection.
        </div>

      </td></tr>

      <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;background:#f9fafb;text-align:center;">
        <div style="font-size:11px;color:#9ca3af;">
          <a href="${appUrl}/settings" style="color:#9ca3af;text-decoration:none;">Manage notifications</a>
          &nbsp;&bull;&nbsp; SubIQ &mdash; Built for subs. Not against them.
        </div>
      </td></tr>

    </table>
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
        from: process.env.RESEND_FROM_EMAIL || 'digest@subiq.co',
        to: user.email,
        subject: `Your week on ${project.name} -- SubIQ Digest`,
        html,
      })
      sent.push(user.email)
    } catch (err: any) {
      errors.push(`${user.email}: ${err.message}`)
    }
  }

  return NextResponse.json({ success: true, sent: sent.length, errors })
}
