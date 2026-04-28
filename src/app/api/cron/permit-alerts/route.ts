// ─────────────────────────────────────────────────────────
// GET /api/cron/permit-alerts
// Called by a cron job (Vercel Cron or external).
// Checks all permits, sends alerts for expiring ones.
//
// Vercel cron.json config:
// { "crons": [{ "path": "/api/cron/permit-alerts", "schedule": "0 7 * * *" }] }
//
// Protected by CRON_SECRET env var.
// ─────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'
import { sendPermitExpiryAlert, sendDailyDigest } from '@/lib/email'
import { differenceInDays, format, parseISO } from 'date-fns'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminSupabase()
  const today = new Date()
  const results = { alerts_sent: 0, digests_sent: 0, errors: 0 }

  // ── Fetch all active permits with expiry dates ──────────
  const { data: permits, error } = await admin
    .from('permits')
    .select(`
      *,
      projects!inner(name, user_id),
      users!inner(email, full_name, sms_alerts_enabled)
    `)
    .not('expiry_date', 'is', null)
    .not('status', 'eq', 'expired')
    .not('status', 'eq', 'revoked')

  if (error) {
    console.error('Failed to fetch permits:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // ── Update expired permit statuses ─────────────────────
  const expiredIds = (permits || [])
    .filter(p => parseISO(p.expiry_date) < today)
    .map(p => p.id)

  if (expiredIds.length > 0) {
    await admin.from('permits').update({ status: 'expired' }).in('id', expiredIds)
  }

  // ── Send alerts for each threshold ─────────────────────
  for (const permit of permits || []) {
    const expiryDate = parseISO(permit.expiry_date)
    const daysUntil = differenceInDays(expiryDate, today)

    if (daysUntil < 0) continue // Already expired

    const user = permit.users as { email: string; full_name: string }
    const project = permit.projects as { name: string }

    try {
      if (daysUntil <= 7 && !permit.alert_sent_7d) {
        await sendPermitExpiryAlert({
          to: user.email,
          userName: user.full_name || 'there',
          projectName: project.name,
          permitNumber: permit.permit_number,
          permitType: permit.permit_type,
          expiryDate: format(expiryDate, 'MMMM d, yyyy'),
          daysUntilExpiry: daysUntil,
        })
        await admin.from('permits').update({ alert_sent_7d: true, status: 'expiring_soon' }).eq('id', permit.id)
        results.alerts_sent++
      } else if (daysUntil <= 14 && !permit.alert_sent_14d) {
        await sendPermitExpiryAlert({
          to: user.email,
          userName: user.full_name || 'there',
          projectName: project.name,
          permitNumber: permit.permit_number,
          permitType: permit.permit_type,
          expiryDate: format(expiryDate, 'MMMM d, yyyy'),
          daysUntilExpiry: daysUntil,
        })
        await admin.from('permits').update({ alert_sent_14d: true, status: 'expiring_soon' }).eq('id', permit.id)
        results.alerts_sent++
      } else if (daysUntil <= 30 && !permit.alert_sent_30d) {
        await sendPermitExpiryAlert({
          to: user.email,
          userName: user.full_name || 'there',
          projectName: project.name,
          permitNumber: permit.permit_number,
          permitType: permit.permit_type,
          expiryDate: format(expiryDate, 'MMMM d, yyyy'),
          daysUntilExpiry: daysUntil,
        })
        await admin.from('permits').update({ alert_sent_30d: true, status: 'expiring_soon' }).eq('id', permit.id)
        results.alerts_sent++
      }
    } catch (err) {
      console.error(`Alert failed for permit ${permit.permit_number}:`, err)
      results.errors++
    }
  }

  // ── Send daily digest to all active users ──────────────
  const { data: users } = await admin
    .from('users')
    .select('id, email, full_name')
    .in('subscription_status', ['trialing', 'active'])

  for (const user of users || []) {
    try {
      // Gather digest items for this user
      const digestItems: Array<{ type: 'permit' | 'bid' | 'action'; text: string; severity: 'info' | 'warning' | 'critical' }> = []

      // Expiring permits
      const userPermits = (permits || []).filter(p => {
        const proj = p.projects as { user_id: string }
        return proj.user_id === user.id
      })

      for (const p of userPermits) {
        const days = differenceInDays(parseISO(p.expiry_date), today)
        if (days >= 0 && days <= 30) {
          const proj = p.projects as { name: string }
          digestItems.push({
            type: 'permit',
            text: `Permit ${p.permit_number} on ${proj.name} expires in ${days} days`,
            severity: days <= 7 ? 'critical' : days <= 14 ? 'warning' : 'info',
          })
        }
      }

      // Over-budget bids
      const { data: flaggedBids } = await admin
        .from('bid_line_items')
        .select('trade, ai_flag, ai_flag_severity, projects!inner(name)')
        .eq('user_id', user.id)
        .not('ai_flag', 'is', null)
        .in('status', ['bidding', 'not_started'])
        .limit(5)

      for (const bid of flaggedBids || []) {
        const proj = (bid.projects as unknown) as { name: string }
        digestItems.push({
          type: 'bid',
          text: `${bid.trade} bid on ${proj.name}: ${bid.ai_flag}`,
          severity: (bid.ai_flag_severity as 'info' | 'warning' | 'critical') || 'info',
        })
      }

      if (digestItems.length > 0) {
        const { data: projectCount } = await admin
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active')

        await sendDailyDigest({
          to: user.email,
          userName: user.full_name || 'there',
          items: digestItems,
          projectCount: (projectCount as unknown as { count: number })?.count || 0,
        })
        results.digests_sent++
      }
    } catch (err) {
      console.error(`Digest failed for user ${user.id}:`, err)
      results.errors++
    }
  }

  console.log('Cron completed:', results)
  return NextResponse.json({ success: true, ...results })
}
