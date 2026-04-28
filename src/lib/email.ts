// ─────────────────────────────────────────────────────────
// CONSTRUCTIQ — Email Service (Resend)
// All transactional emails go through here.
// ─────────────────────────────────────────────────────────

import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL || 'alerts@constructiq.io'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://constructiq.io'

// ── Permit expiry alert ───────────────────────────────────
export async function sendPermitExpiryAlert(params: {
  to: string
  userName: string
  projectName: string
  permitNumber: string
  permitType: string
  expiryDate: string
  daysUntilExpiry: number
}) {
  const urgency = params.daysUntilExpiry <= 7 ? 'URGENT: ' : params.daysUntilExpiry <= 14 ? 'Action Required: ' : ''
  const color = params.daysUntilExpiry <= 7 ? '#b83232' : params.daysUntilExpiry <= 14 ? '#d95f2b' : '#b06e1a'

  return resend.emails.send({
    from: `ConstructIQ <${FROM}>`,
    to: params.to,
    subject: `${urgency}Permit ${params.permitNumber} expires in ${params.daysUntilExpiry} days`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'DM Sans',sans-serif;background:#f8f7f4;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid rgba(0,0,0,0.08);overflow:hidden">
    <div style="background:#1a1a1a;padding:20px 24px;display:flex;align-items:center;gap:10px">
      <span style="color:#fff;font-size:16px;font-weight:600">ConstructIQ</span>
    </div>
    <div style="padding:24px">
      <div style="background:${color}15;border-left:3px solid ${color};border-radius:4px;padding:12px 16px;margin-bottom:20px">
        <p style="margin:0;font-size:14px;font-weight:600;color:${color}">${urgency.replace(': ','')}Permit Expiring in ${params.daysUntilExpiry} Days</p>
      </div>
      <p style="margin:0 0 16px;font-size:14px;color:#111">Hi ${params.userName},</p>
      <p style="margin:0 0 20px;font-size:14px;color:#6b6a66;line-height:1.6">
        The following permit on project <strong style="color:#111">${params.projectName}</strong> is expiring soon and requires your attention.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">
        <tr style="border-bottom:1px solid #f0ede8"><td style="padding:10px 0;color:#9e9d99;width:40%">Permit Number</td><td style="padding:10px 0;font-weight:500">${params.permitNumber}</td></tr>
        <tr style="border-bottom:1px solid #f0ede8"><td style="padding:10px 0;color:#9e9d99">Type</td><td style="padding:10px 0">${params.permitType}</td></tr>
        <tr style="border-bottom:1px solid #f0ede8"><td style="padding:10px 0;color:#9e9d99">Expires</td><td style="padding:10px 0;font-weight:600;color:${color}">${params.expiryDate}</td></tr>
        <tr><td style="padding:10px 0;color:#9e9d99">Days Remaining</td><td style="padding:10px 0;font-weight:600;color:${color}">${params.daysUntilExpiry} days</td></tr>
      </table>
      <a href="${APP_URL}/permits" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:500">View Permit Tracker →</a>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #f0ede8;font-size:12px;color:#9e9d99">
      ConstructIQ · <a href="${APP_URL}/settings" style="color:#9e9d99">Manage alerts</a>
    </div>
  </div>
</body>
</html>`,
  })
}

// ── Daily digest ──────────────────────────────────────────
export async function sendDailyDigest(params: {
  to: string
  userName: string
  items: Array<{ type: 'permit' | 'bid' | 'action'; text: string; severity: 'info' | 'warning' | 'critical' }>
  projectCount: number
}) {
  if (params.items.length === 0) return // Nothing to report

  const colorMap = { info: '#1f5fa6', warning: '#d95f2b', critical: '#b83232' }
  const emojiMap = { info: 'ℹ', warning: '⚠', critical: '🔴' }

  const itemsHtml = params.items
    .slice(0, 8)
    .map(
      item => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:${colorMap[item.severity]};width:20px;vertical-align:top">${emojiMap[item.severity]}</td>
      <td style="padding:8px 0 8px 10px;font-size:13px;color:#111;line-height:1.5">${item.text}</td>
    </tr>`
    )
    .join('')

  return resend.emails.send({
    from: `ConstructIQ <${FROM}>`,
    to: params.to,
    subject: `Your ConstructIQ Morning Digest — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'DM Sans',sans-serif;background:#f8f7f4;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid rgba(0,0,0,0.08);overflow:hidden">
    <div style="background:#1a1a1a;padding:20px 24px"><span style="color:#fff;font-size:16px;font-weight:600">ConstructIQ</span></div>
    <div style="padding:24px">
      <p style="margin:0 0 6px;font-size:18px;font-weight:600;color:#111">Good morning, ${params.userName}</p>
      <p style="margin:0 0 20px;font-size:13px;color:#9e9d99">${params.projectCount} active project${params.projectCount !== 1 ? 's' : ''} · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      <p style="margin:0 0 12px;font-size:13px;font-weight:500;color:#111">Today's action items:</p>
      <table style="width:100%;border-collapse:collapse">${itemsHtml}</table>
      <div style="margin-top:24px"><a href="${APP_URL}/dashboard" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:500">Open Dashboard →</a></div>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #f0ede8;font-size:12px;color:#9e9d99">
      ConstructIQ · <a href="${APP_URL}/settings" style="color:#9e9d99">Unsubscribe from digest</a>
    </div>
  </div>
</body>
</html>`,
  })
}

// ── Welcome email ─────────────────────────────────────────
export async function sendWelcomeEmail(params: {
  to: string
  userName: string
  trialEndsAt: string
}) {
  return resend.emails.send({
    from: `ConstructIQ <${FROM}>`,
    to: params.to,
    subject: 'Welcome to ConstructIQ — here\'s how to get started',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'DM Sans',sans-serif;background:#f8f7f4;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid rgba(0,0,0,0.08);overflow:hidden">
    <div style="background:#1a1a1a;padding:20px 24px"><span style="color:#fff;font-size:16px;font-weight:600">ConstructIQ</span></div>
    <div style="padding:28px 24px">
      <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#111">Welcome, ${params.userName} 👋</p>
      <p style="margin:0 0 20px;font-size:14px;color:#6b6a66;line-height:1.6">Your 14-day trial is active until <strong style="color:#111">${params.trialEndsAt}</strong>. Here's how to get the most out of it:</p>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px">
        <div style="display:flex;gap:12px;align-items:flex-start"><div style="width:24px;height:24px;border-radius:50%;background:#EAF3DE;color:#1a4d31;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">1</div><div><p style="margin:0;font-size:13px;font-weight:500;color:#111">Create your first project</p><p style="margin:3px 0 0;font-size:12px;color:#6b6a66">Name it, add the address and jurisdiction.</p></div></div>
        <div style="display:flex;gap:12px;align-items:flex-start"><div style="width:24px;height:24px;border-radius:50%;background:#EAF3DE;color:#1a4d31;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">2</div><div><p style="margin:0;font-size:13px;font-weight:500;color:#111">Upload a permit or blueprint</p><p style="margin:3px 0 0;font-size:12px;color:#6b6a66">AI reads it and extracts every field in seconds.</p></div></div>
        <div style="display:flex;gap:12px;align-items:flex-start"><div style="width:24px;height:24px;border-radius:50%;background:#EAF3DE;color:#1a4d31;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">3</div><div><p style="margin:0;font-size:13px;font-weight:500;color:#111">Add a subcontractor bid</p><p style="margin:3px 0 0;font-size:12px;color:#6b6a66">AI analyzes it against market rate and flags issues — privately.</p></div></div>
      </div>
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:500">Get Started →</a>
    </div>
  </div>
</body>
</html>`,
  })
}
