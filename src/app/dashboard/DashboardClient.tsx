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

export function DashboardClient({ user, project, permits, bids, documents, subs, isNewUser }: Props) {
  const router = useRouter()
  const [showNewProject, setShowNewProject] = useState(isNewUser)
  const [projName, setProjName]   = useState('')
  const [projAddress, setProjAddress] = useState('')
  const [projCity, setProjCity]   = useState('')
  const [projState, setProjState] = useState('')
  const [projJuris, setProjJuris] = useState('')
  const [creating, setCreating]   = useState(false)

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!projName.trim()) return
    setCreating(true)

    const { data, error } = await supabase.from('projects').insert({
      user_id: user.id,
      name: projName.trim(),
      address: projAddress.trim() || null,
      city: projCity.trim() || null,
      state: projState.trim() || null,
      jurisdiction: projJuris.trim() || null,
    }).select().single()

    if (!error && data) {
      if (typeof window !== 'undefined') localStorage.setItem('active_project_id', data.id)
      router.push('/documents')
      router.refresh()
    } else {
      setCreating(false)
    }
  }

  // Compute priority alerts
  const today = new Date()
  const alerts: Array<{ severity: 'critical' | 'warning' | 'info'; text: string; href: string }> = []

  permits.forEach(p => {
    if (!p.expiry_date) return
    const days = differenceInDays(parseISO(p.expiry_date), today)
    if (days < 0) alerts.push({ severity: 'critical', text: `Permit ${p.permit_number} expired ${Math.abs(days)} days ago — renew now`, href: '/documents' })
    else if (days <= 7) alerts.push({ severity: 'critical', text: `Permit ${p.permit_number} expires in ${days} days`, href: '/documents' })
    else if (days <= 30) alerts.push({ severity: 'warning', text: `Permit ${p.permit_number} expires in ${days} days`, href: '/documents' })
  })

  bids.forEach(b => {
    if (b.ai_flag && b.ai_flag_severity === 'critical') alerts.push({ severity: 'critical', text: b.ai_flag, href: '/bids' })
    else if (b.ai_flag && b.ai_flag_severity === 'warning') alerts.push({ severity: 'warning', text: b.ai_flag, href: '/bids' })
  })

  if (alerts.length === 0 && project) alerts.push({ severity: 'info', text: 'No urgent issues. All permits and bids look good.', href: '#' })

  // Budget totals
  const totalBid = bids.reduce((s, b) => s + Number(b.amount), 0)
  const awarded  = bids.filter(b => b.status === 'awarded').reduce((s, b) => s + Number(b.amount), 0)

  const alertClass = { critical: 'alert-r', warning: 'alert-a', info: 'alert-b' }
  const alertIcon  = { critical: '🔴', warning: '⚠️', info: 'ℹ️' }

  // New-project / empty state
  if (showNewProject || !project) {
    return (
      <div style={{ maxWidth: 480, margin: '40px auto' }}>
        <div className="ptitle">Create your first project</div>
        <p className="psub">Add a project to start uploading documents and tracking permits.</p>
        <div className="card">
          <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="input-label">Project name *</label>
              <input className="input" placeholder="e.g. Meridian Office Complex" value={projName} onChange={e => setProjName(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="input-label">Address</label>
              <input className="input" placeholder="4820 Flamingo Rd" value={projAddress} onChange={e => setProjAddress(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
              <div>
                <label className="input-label">City</label>
                <input className="input" placeholder="Las Vegas" value={projCity} onChange={e => setProjCity(e.target.value)} />
              </div>
              <div>
                <label className="input-label">State</label>
                <input className="input" placeholder="NV" value={projState} onChange={e => setProjState(e.target.value)} maxLength={2} />
              </div>
            </div>
            <div>
              <label className="input-label">Jurisdiction</label>
              <input className="input" placeholder="Clark County, NV" value={projJuris} onChange={e => setProjJuris(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-p btn-full" disabled={creating} style={{ marginTop: 4 }}>
              {creating ? 'Creating…' : 'Create Project →'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="ptitle">{project.name}</div>
      <p className="psub">{[project.address, project.city, project.state].filter(Boolean).join(', ')}</p>

      {/* STATS */}
      <div className="g4" style={{ marginBottom: 22 }}>
        <div className="stat"><div className="sl">Documents</div><div className="sv">{documents.length}</div></div>
        <div className="stat"><div className="sl">Active Permits</div><div className="sv">{permits.filter(p => p.status === 'active').length}</div><div className="ss" style={permits.some(p=>p.status==='expiring_soon')?{color:'var(--orange)'}:{}}>{permits.filter(p=>p.status==='expiring_soon').length} expiring</div></div>
        <div className="stat"><div className="sl">Total Bid</div><div className="sv">${totalBid > 0 ? (totalBid/1000000).toFixed(1)+'M' : '—'}</div></div>
        <div className="stat"><div className="sl">Subcontractors</div><div className="sv">{subs.length}</div><div className="ss">{subs.filter(s=>s.status==='awarded').length} awarded</div></div>
      </div>

      <div className="g2">
        {/* PRIORITY ALERTS */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Priority Actions</div>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>AI-identified</span>
          </div>
          {alerts.slice(0, 5).map((a, i) => (
            <Link key={i} href={a.href} style={{ textDecoration: 'none', display: 'block' }}>
              <div className={`alert ${alertClass[a.severity]}`} style={{ marginBottom: i < alerts.length - 1 ? 7 : 0, cursor: 'pointer' }}>
                {alertIcon[a.severity]} {a.text}
              </div>
            </Link>
          ))}
        </div>

        {/* RECENT DOCUMENTS */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Recent Documents</div>
            <Link href="/documents" style={{ fontSize: 12, color: 'var(--text-2)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 13 }}>
              No documents yet.{' '}
              <Link href="/documents" style={{ color: 'var(--orange)', fontWeight: 500, textDecoration: 'none' }}>Upload your first →</Link>
            </div>
          ) : (
            documents.slice(0, 5).map(doc => {
              const statusClass: Record<string, string> = { extracted: 'p-green', processing: 'p-amber', needs_review: 'p-red', saved: 'p-green', uploading: 'p-gray' }
              return (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 33, height: 33, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    {doc.doc_type === 'permit' ? '📋' : doc.doc_type === 'blueprint' ? '🏗️' : doc.doc_type === 'sub_bid' ? '💰' : '📄'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{format(parseISO(doc.created_at), 'MMM d, h:mm a')}</div>
                  </div>
                  <span className={`pill ${statusClass[doc.status] || 'p-gray'}`}>{doc.status.replace('_', ' ')}</span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* BUDGET OVERVIEW */}
      {bids.length > 0 && (
        <div className="card" style={{ marginTop: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Budget Overview</div>
            <Link href="/bids" style={{ fontSize: 12, color: 'var(--text-2)', textDecoration: 'none' }}>Manage bids →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bids.map(b => {
              const pct = totalBid > 0 ? Math.round((Number(b.amount) / totalBid) * 100) : 0
              const colors: Record<string, string> = { awarded: '#2d7a4f', bidding: '#b06e1a', revise: '#b83232', rejected: '#9e9d99', not_started: '#9e9d99' }
              return (
                <div key={b.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span>{b.trade}</span>
                    <span className="mono" style={{ color: 'var(--text-2)' }}>${Number(b.amount).toLocaleString()} · {pct}%</span>
                  </div>
                  <div className="pw"><div className="pf" style={{ width: `${Math.min(pct * 2, 100)}%`, background: colors[b.status] || '#9e9d99' }} /></div>
                </div>
              )
            })}
          </div>
          <div className="dv" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span className="tm">Awarded</span>
            <span className="mono bold">${awarded.toLocaleString()}</span>
          </div>
        </div>
      )}
    </>
  )
}
