import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminSupabase()
  const today = new Date()
  const alerts: string[] = []
  const errors: string[] = []

  for (const days of [14, 7, 1]) {
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + days)
    const dateStr = targetDate.toISOString().split('T')[0]

    const { data: permits } = await admin
      .from('permits')
      .select('*, projects(name, user_id), users!inner(email, full_name, notif_permits)')
      .eq('expiry_date', dateStr)
      .eq('status', 'active')

    for (const permit of permits || []) {
      const user    = (permit as any).users
      const project = (permit as any).projects
      if (!user?.notif_permits || !user?.email) continue

      const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;padding:32px 16px;background:#f9fafb;">
<div style="max-width:520px;margin:0 auto;background:white;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:#000;padding:18px 22px;"><span style="color:white;font-weight:700;font-size:15px;">⚠️ ConstructIQ Permit Alert</span></div>
  <div style="padding:24px 22px;">
    <div style="font-size:20px;font-weight:900;color:#111827;margin-bottom:4px;">Permit expires in ${days} day${days !== 1 ? 's' : ''}</div>
    <div style="font-size:14px;color:#6b7280;margin-bottom:20px;">${project?.name}</div>
    <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:14px;margin-bottom:16px;">
      <div style="font-size:14px;font-weight:700;color:#991b1b;">${permit.permit_number} — ${permit.permit_type}</div>
      <div style="font-size:12px;color:#b91c1c;margin-top:4px;">Expires: ${permit.expiry_date}${permit.inspector_name ? ' · Inspector: ' + permit.inspector_name : ''}</div>
    </div>
    ${(permit.special_conditions || []).length > 0 ? `<div style="background:#fffbeb;border-radius:8px;padding:12px;margin-bottom:16px;font-size:12px;color:#92400e;">${(permit.special_conditions || []).slice(0, 3).map((c: string, i: number) => `${i+1}. ${c}`).join('<br>')}</div>` : ''}
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/documents" style="display:block;text-align:center;background:#ea580c;color:white;text-decoration:none;padding:12px;border-radius:9px;font-size:14px;font-weight:700;">View Permit in ConstructIQ →</a>
  </div>
</div>
</body></html>`

      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'alerts@constructiq.app',
          to: user.email,
          subject: `Permit expires in ${days} day${days !== 1 ? 's' : ''} — ${permit.permit_number}`,
          html,
        })
        alerts.push(`${days}d alert → ${user.email} for ${permit.permit_number}`)
      } catch (err: any) {
        errors.push(`Failed ${user.email}: ${err.message}`)
      }
    }
  }

  // Mark expired
  const { data: expiredToday } = await admin.from('permits')
    .select('id, permit_number').eq('expiry_date', today.toISOString().split('T')[0]).eq('status', 'active')

  if (expiredToday?.length) {
    await admin.from('permits').update({ status: 'expired' }).in('id', expiredToday.map((p: any) => p.id))
    alerts.push(`Marked ${expiredToday.length} permit(s) as expired`)
  }

  return NextResponse.json({ success: true, alerts_sent: alerts.length, alerts, errors, checked_at: new Date().toISOString() })
}
