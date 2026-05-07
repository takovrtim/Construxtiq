import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  // Verify this is a legitimate cron call
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminSupabase()
  const today = new Date()
  const in14Days = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in7Days  = new Date(today.getTime() + 7  * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in1Day   = new Date(today.getTime() + 1  * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]

  // Find all permits expiring in the next 14 days
  const { data: permits } = await admin
    .from('permits')
    .select(`
      *,
      projects (
        id, name, user_id,
        users ( email, full_name )
      )
    `)
    .gte('expiry_date', todayStr)
    .lte('expiry_date', in14Days)
    .eq('status', 'active')

  if (!permits || permits.length === 0) {
    return NextResponse.json({ success: true, sent: 0, message: 'No expiring permits' })
  }

  let sent = 0
  const errors: string[] = []

  for (const permit of permits) {
    const project = permit.projects as any
    if (!project?.users?.email) continue

    const expiryDate = new Date(permit.expiry_date)
    const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    let urgency = 'expiring soon'
    let color = '#b06e1a'
    let emoji = '⚠️'

    if (daysLeft <= 1) { urgency = 'EXPIRING TOMORROW'; color = '#b83232'; emoji = '🚨' }
    else if (daysLeft <= 7) { urgency = `expiring in ${daysLeft} days`; color = '#b83232'; emoji = '🔴' }

    const subject = `${emoji} Permit ${permit.permit_number} ${urgency} — ${project.name}`

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'alerts@constructiq.app',
        to: project.users.email,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"/></head>
          <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f7f4;margin:0;padding:40px 20px;">
            <div style="max-width:560px;margin:0 auto;">
              <!-- Header -->
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
                <div style="width:36px;height:36px;background:#d95f2b;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;">🏗️</div>
                <div style="font-size:18px;font-weight:800;letter-spacing:-0.5px;">ConstructIQ</div>
              </div>

              <!-- Alert card -->
              <div style="background:white;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.08);margin-bottom:16px;border-top:4px solid ${color};">
                <div style="font-size:28px;margin-bottom:12px;">${emoji}</div>
                <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:8px;color:${color};">
                  Permit ${urgency}
                </div>
                <div style="font-size:15px;color:#6b6a66;margin-bottom:24px;">
                  Action required for <strong>${project.name}</strong>
                </div>

                <!-- Permit details -->
                <div style="background:#f8f7f4;border-radius:12px;padding:20px;margin-bottom:24px;">
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div>
                      <div style="font-size:11px;font-weight:700;color:#9e9d99;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Permit Number</div>
                      <div style="font-size:16px;font-weight:700;font-family:monospace;">${permit.permit_number}</div>
                    </div>
                    <div>
                      <div style="font-size:11px;font-weight:700;color:#9e9d99;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Expires</div>
                      <div style="font-size:16px;font-weight:700;color:${color};">${new Date(permit.expiry_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                    <div>
                      <div style="font-size:11px;font-weight:700;color:#9e9d99;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Type</div>
                      <div style="font-size:14px;font-weight:500;">${permit.permit_type || 'General'}</div>
                    </div>
                    <div>
                      <div style="font-size:11px;font-weight:700;color:#9e9d99;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Days Left</div>
                      <div style="font-size:16px;font-weight:800;color:${color};">${daysLeft} day${daysLeft !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>

                <!-- What to do -->
                <div style="background:${daysLeft <= 7 ? '#fdf0f0' : '#fdf4e3'};border-radius:10px;padding:16px;border-left:3px solid ${color};margin-bottom:24px;">
                  <div style="font-size:13px;font-weight:700;color:${color};margin-bottom:6px;">What you need to do:</div>
                  <div style="font-size:13px;color:#6b6a66;line-height:1.6;">
                    ${daysLeft <= 1
                      ? '🚨 Contact the permit office immediately to request an extension. Do not let work continue without a valid permit.'
                      : daysLeft <= 7
                      ? '⚡ Contact your jurisdiction now to renew or extend this permit before it expires.'
                      : '📋 Schedule your permit renewal or extension. Allow 3-5 business days for processing.'}
                  </div>
                </div>

                <a href="${process.env.NEXT_PUBLIC_APP_URL}/documents" style="display:inline-block;background:#0f0f0f;color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:700;">
                  View in ConstructIQ →
                </a>
              </div>

              <div style="text-align:center;font-size:12px;color:#9e9d99;margin-top:24px;">
                ConstructIQ Permit Alert · ${project.name}<br/>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color:#9e9d99;">Manage notifications</a>
              </div>
            </div>
          </body>
          </html>
        `,
      })
      sent++

      // Mark permit as expiring_soon in DB
      if (daysLeft <= 14) {
        await admin.from('permits').update({ status: 'expiring_soon' }).eq('id', permit.id)
      }
    } catch (err: any) {
      errors.push(`${permit.permit_number}: ${err.message}`)
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    total: permits.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
