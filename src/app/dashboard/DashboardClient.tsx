'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { differenceInDays, format, parseISO } from 'date-fns'
import type { User, Project, Permit, BidLineItem, Subcontractor } from '@/types'

interface Props {
  user: User
  project: Project | null
  permits: Permit[]
  bids: BidLineItem[]
  documents: Array<{ id: string; name: string; status: string; doc_type: string; created_at: string }>
  subs: Subcontractor[]
  isNewUser: boolean
}

// ── PROJECT CALCULATOR ────────────────────────────────────
function ProjectCalculator() {
  const [jobType, setJobType] = useState<'electrical' | 'plumbing'>('electrical')
  const [sqft, setSqft] = useState('')
  const [hours, setHours] = useState('')
  const [laborRate, setLaborRate] = useState('85')
  const [materials, setMaterials] = useState('')
  const [overhead, setOverhead] = useState('15')
  const [margin, setMargin] = useState('25')
  const [shown, setShown] = useState(false)

  const laborCost   = (parseFloat(hours) || 0) * (parseFloat(laborRate) || 0)
  const materialCost = parseFloat(materials) || 0
  const overheadCost = (laborCost + materialCost) * ((parseFloat(overhead) || 0) / 100)
  const subtotal     = laborCost + materialCost + overheadCost
  const profit       = subtotal * ((parseFloat(margin) || 0) / 100)
  const total        = subtotal + profit
  const perSqft      = sqft ? total / parseFloat(sqft) : 0

  return (
    <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>Project Calculator</div>
          <div style={{ fontSize: 12, color: '#9e9d99', marginTop: 2 }}>Estimate any job in 30 seconds</div>
        </div>
        <div style={{ display: 'flex', background: '#f8f7f4', borderRadius: 8, padding: 3 }}>
          {(['electrical', 'plumbing'] as const).map(t => (
            <button key={t} onClick={() => setJobType(t)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: jobType === t ? 'white' : 'transparent', color: jobType === t ? '#0f0f0f' : '#9e9d99', boxShadow: jobType === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
              {t === 'electrical' ? '⚡ Electrical' : '🔧 Plumbing'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Labor Hours', value: hours, set: setHours, placeholder: '40', suffix: 'hrs' },
          { label: 'Labor Rate ($/hr)', value: laborRate, set: setLaborRate, placeholder: '85', suffix: '/hr' },
          { label: 'Materials ($)', value: materials, set: setMaterials, placeholder: '2500', suffix: '$' },
          { label: 'Square Footage', value: sqft, set: setSqft, placeholder: '1200', suffix: 'sf' },
          { label: 'Overhead %', value: overhead, set: setOverhead, placeholder: '15', suffix: '%' },
          { label: 'Profit Margin %', value: margin, set: setMargin, placeholder: '25', suffix: '%' },
        ].map(field => (
          <div key={field.label}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9e9d99', display: 'block', marginBottom: 5, letterSpacing: '0.2px', textTransform: 'uppercase' }}>{field.label}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={field.value}
                onChange={e => field.set(e.target.value)}
                placeholder={field.placeholder}
                style={{ width: '100%', padding: '9px 11px', fontSize: 13, fontWeight: 500, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#0f0f0f', transition: 'border 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#0f0f0f'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      <div style={{ background: '#0f0f0f', borderRadius: 12, padding: 18, color: 'white' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
          {[
            { label: 'Labor', value: `$${laborCost.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}` },
            { label: 'Materials', value: `$${materialCost.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}` },
            { label: 'Overhead', value: `$${overheadCost.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}` },
            { label: 'Profit', value: `$${profit.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`, accent: true },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 5 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', color: item.accent ? '#d95f2b' : 'white' }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>Total Bid Price</div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1.5px', color: '#d95f2b' }}>
              ${total.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
            </div>
          </div>
          {perSqft > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>Per Sq Ft</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>${perSqft.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MAIN DASHBOARD ────────────────────────────────────────
export function DashboardClient({ user, project, permits, bids, documents, subs, isNewUser }: Props) {
  const router = useRouter()
  const [projName, setProjName]   = useState('')
  const [creating, setCreating]   = useState(false)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = (user.full_name || user.email || '').split(' ')[0] || 'there'

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!projName.trim()) return
    setCreating(true)
    const { data, error } = await supabase.from('projects').insert({
      user_id: user.id,
      name: projName.trim(),
      city: 'Las Vegas',
      state: 'NV',
      jurisdiction: 'Clark County, NV',
    }).select().single()
    if (!error && data) {
      if (typeof window !== 'undefined') localStorage.setItem('active_project_id', data.id)
      router.push('/documents')
      router.refresh()
    }
    setCreating(false)
  }

  const today = new Date()

  const alerts: Array<{ level: 'critical' | 'warning' | 'info'; text: string; href: string }> = []
  permits.forEach(p => {
    if (!p.expiry_date) return
    const days = differenceInDays(parseISO(p.expiry_date), today)
    if (days < 0)   alerts.push({ level: 'critical', text: `Permit ${p.permit_number} expired ${Math.abs(days)}d ago — renew immediately`, href: '/documents' })
    else if (days <= 7)  alerts.push({ level: 'critical', text: `Permit ${p.permit_number} expires in ${days} days`, href: '/documents' })
    else if (days <= 30) alerts.push({ level: 'warning', text: `Permit ${p.permit_number} expires in ${days} days`, href: '/documents' })
  })
  bids.forEach(b => {
    if (b.ai_flag_severity === 'critical') alerts.push({ level: 'critical', text: `${b.trade}: ${b.ai_flag}`, href: '/bids' })
    else if (b.ai_flag_severity === 'warning') alerts.push({ level: 'warning', text: `${b.trade}: ${b.ai_flag}`, href: '/bids' })
  })
  if (alerts.length === 0 && project) alerts.push({ level: 'info', text: 'No urgent issues — all permits and bids look good ✓', href: '#' })

  const totalBid = bids.reduce((s, b) => s + Number(b.amount), 0)
  const awarded  = bids.filter(b => b.status === 'awarded').reduce((s, b) => s + Number(b.amount), 0)

  const alertStyle = {
    critical: { bg: '#fdf0f0', text: '#6e1a1a', border: '#b83232', icon: '🔴' },
    warning:  { bg: '#fdf4e3', text: '#6b4010', border: '#b06e1a', icon: '⚠️' },
    info:     { bg: '#eef3fb', text: '#0f3360', border: '#1f5fa6', icon: 'ℹ️' },
  }

  // New user — create first project
  if (!project) return (
    <div style={{ maxWidth: 480, margin: '48px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 }}>Welcome to ConstructIQ</div>
        <div style={{ fontSize: 14, color: '#6b6a66' }}>Create your first project to get started</div>
      </div>
      <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 28, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6a66', display: 'block', marginBottom: 6 }}>Project / Company name *</label>
            <input
              style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 10, fontFamily: 'inherit', outline: 'none' }}
              placeholder="e.g. The Repair Crew — Main"
              value={projName}
              onChange={e => setProjName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <button type="submit" disabled={creating} style={{ padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit', marginTop: 4, letterSpacing: '-0.2px' }}>
            {creating ? 'Creating…' : 'Create Project →'}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* GREETING */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 2 }}>
          {greeting}, {firstName} ☀️
        </div>
        <div style={{ fontSize: 13, color: '#9e9d99' }}>
          {project.name} · {[project.city, project.state].filter(Boolean).join(', ')} · {format(today, 'EEEE, MMMM d')}
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Documents', value: documents.length, sub: `${documents.filter(d => d.status === 'extracted' || d.status === 'saved').length} extracted`, accent: '' },
          { label: 'Active Permits', value: permits.filter(p => p.status === 'active').length, sub: `${permits.filter(p => p.status === 'expiring_soon').length} expiring soon`, accent: permits.some(p => p.status === 'expiring_soon') ? '#b06e1a' : '' },
          { label: 'Total Bid', value: totalBid > 0 ? `$${(totalBid/1000).toFixed(0)}K` : '—', sub: `$${(awarded/1000).toFixed(0)}K awarded`, accent: '' },
          { label: 'Subcontractors', value: subs.length, sub: `${subs.filter(s => s.status === 'awarded').length} awarded`, accent: '' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: '#0f0f0f', marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent ? s.accent : '#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* PRIORITY ALERTS */}
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>Priority Actions</div>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#9e9d99', letterSpacing: '0.4px', textTransform: 'uppercase' }}>AI-identified</span>
          </div>
          {alerts.slice(0, 5).map((a, i) => {
            const s = alertStyle[a.level]
            return (
              <Link key={i} href={a.href} style={{ textDecoration: 'none', display: 'block', marginBottom: 8 }}>
                <div style={{ background: s.bg, color: s.text, borderLeft: `3px solid ${s.border}`, borderRadius: '0 8px 8px 0', padding: '10px 13px', fontSize: 12, lineHeight: 1.55, transition: 'opacity 0.15s', cursor: 'pointer' }}>
                  {s.icon} {a.text}
                </div>
              </Link>
            )
          })}
        </div>

        {/* RECENT DOCUMENTS */}
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>Recent Documents</div>
            <Link href="/documents" style={{ fontSize: 12, color: '#9e9d99', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
          </div>
          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📄</div>
              <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 12 }}>No documents yet</div>
              <Link href="/documents" style={{ fontSize: 13, fontWeight: 600, color: '#d95f2b', textDecoration: 'none', background: '#fdf0e8', padding: '8px 16px', borderRadius: 8 }}>Upload first permit →</Link>
            </div>
          ) : (
            documents.slice(0, 5).map(doc => {
              const icons: Record<string, string> = { permit: '📋', blueprint: '🏗️', contract: '📝', sub_bid: '💰', inspection: '🔍', other: '📄' }
              const statusColors: Record<string, { bg: string; text: string }> = {
                extracted: { bg: '#edf5f0', text: '#1a4d31' },
                saved: { bg: '#edf5f0', text: '#1a4d31' },
                processing: { bg: '#fdf4e3', text: '#6b4010' },
                uploading: { bg: '#fdf4e3', text: '#6b4010' },
                needs_review: { bg: '#fdf0f0', text: '#6e1a1a' },
              }
              const sc = statusColors[doc.status] || { bg: '#f1ede6', text: '#6b6a66' }
              return (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {icons[doc.doc_type] || '📄'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                    <div style={{ fontSize: 11, color: '#9e9d99', marginTop: 1 }}>{format(parseISO(doc.created_at), 'MMM d, h:mm a')}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: sc.bg, color: sc.text, whiteSpace: 'nowrap' }}>
                    {doc.status === 'processing' || doc.status === 'uploading' ? '⏳ AI reading' : doc.status.replace('_', ' ')}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* PROJECT CALCULATOR */}
      <ProjectCalculator />

      {/* QUICK LINKS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16 }}>
        {[
          { href: '/jobs', icon: '🔧', label: 'Job Board', desc: 'Track all active jobs' },
          { href: '/documents', icon: '📋', label: 'Upload Permit', desc: 'AI reads it instantly' },
          { href: '/subs', icon: '👥', label: 'Crew & Subs', desc: 'Message the team' },
          { href: '/bids', icon: '💰', label: 'Bids', desc: 'Track project costs' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none', background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f0f0f', letterSpacing: '-0.2px' }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#9e9d99', marginTop: 1 }}>{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}