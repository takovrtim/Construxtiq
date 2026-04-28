'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Project, Subcontractor, EmailThread } from '@/types'

interface Props {
  user: User
  project: Project | null
  initialSubs: Subcontractor[]
  initialEmails: EmailThread[]
}

const STATUS_OPTS = ['prospect', 'bidding', 'awarded', 'active', 'completed', 'rejected'] as const
const STATUS_CLASS: Record<string, string> = { awarded: 'p-green', active: 'p-green', bidding: 'p-amber', prospect: 'p-gray', completed: 'p-blue', rejected: 'p-red' }
const SCORE_COLOR: Record<string, string> = { 'A': 'var(--green)', 'B+': 'var(--green)', 'B': 'var(--blue)', 'C+': 'var(--orange)', 'C': 'var(--orange)', 'D': 'var(--red)' }

export function SubsClient({ user, project, initialSubs, initialEmails }: Props) {
  const [subs, setSubs]           = useState<Subcontractor[]>(initialSubs)
  const [emails, setEmails]       = useState<EmailThread[]>(initialEmails)
  const [selected, setSelected]   = useState<Subcontractor | null>(null)
  const [showAdd, setShowAdd]     = useState(false)
  const [replyDraft, setReplyDraft] = useState('')
  const [drafting, setDrafting]   = useState(false)
  const [sending, setSending]     = useState(false)
  const [toast, setToast]         = useState('')
  const [saving, setSaving]       = useState(false)

  // Add sub form
  const [company, setCompany]     = useState('')
  const [contact, setContact]     = useState('')
  const [email, setEmail]         = useState('')
  const [phone, setPhone]         = useState('')
  const [license, setLicense]     = useState('')
  const [trade, setTrade]         = useState('')
  const [bidAmt, setBidAmt]       = useState('')
  const [mktRate, setMktRate]     = useState('')
  const [subStatus, setSubStatus] = useState<Subcontractor['status']>('prospect')

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3200) }

  function resetForm() {
    setCompany(''); setContact(''); setEmail(''); setPhone(''); setLicense('')
    setTrade(''); setBidAmt(''); setMktRate(''); setSubStatus('prospect')
    setShowAdd(false)
  }

  async function saveSub(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !company || !trade) return
    setSaving(true)

    const amt = bidAmt ? parseFloat(bidAmt) : null
    const mkt = mktRate ? parseFloat(mktRate) : null
    const variance = (amt && mkt) ? ((amt - mkt) / mkt * 100) : null

    const payload = {
      project_id: project.id,
      user_id: user.id,
      company_name: company.trim(),
      contact_name: contact.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      license_number: license.trim() || null,
      trade: trade.trim(),
      status: subStatus,
      bid_amount: amt,
      market_rate: mkt,
      variance_pct: variance,
    }

    const { data, error } = await supabase.from('subcontractors').insert(payload).select().single()
    if (!error && data) { setSubs(prev => [data as Subcontractor, ...prev]); showMsg('Subcontractor added') }
    resetForm(); setSaving(false)
  }

  async function updateSubStatus(id: string, newStatus: Subcontractor['status']) {
    const { error } = await supabase.from('subcontractors').update({ status: newStatus }).eq('id', id)
    if (!error) setSubs(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
  }

  async function draftReply() {
    if (!selected || !project) return
    setDrafting(true); setReplyDraft('')
    const res = await fetch('/api/send-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sub_id: selected.id, project_id: project.id, action: 'draft' }),
    })
    const json = await res.json()
    if (json.success) { setReplyDraft(json.draft); showMsg('Draft generated') }
    else showMsg('Draft failed — check AI config')
    setDrafting(false)
  }

  async function sendReply() {
    if (!selected || !project) return
    setSending(true)
    const res = await fetch('/api/send-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sub_id: selected.id, project_id: project.id, action: 'send', custom_body: replyDraft }),
    })
    const json = await res.json()
    if (json.success) {
      showMsg('Reply sent and logged')
      setReplyDraft('')
      // Reload email threads
      const { data } = await supabase.from('email_threads').select('*').eq('project_id', project.id).order('created_at', { ascending: false }).limit(50)
      if (data) setEmails(data as EmailThread[])
    } else {
      showMsg(json.error || 'Send failed')
    }
    setSending(false)
  }

  const subEmails = emails.filter(e => e.sub_id === selected?.id)

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>No project selected</div>
      <a href="/dashboard?new=1" style={{ color: 'var(--orange)', textDecoration: 'none', fontSize: 13 }}>Create a project →</a>
    </div>
  )

  return (
    <>
      <div className="ptitle">Subcontractors</div>
      <p className="psub">Manage subs, track bids, and send AI-drafted replies</p>

      <div className="g2">
        {/* LEFT: Sub list + add form */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Directory</div>
              <button className="btn btn-sm btn-p" onClick={() => setShowAdd(v => !v)}>{showAdd ? 'Cancel' : '+ Add Sub'}</button>
            </div>

            {showAdd && (
              <form onSubmit={saveSub} style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div className="g2">
                  <div><label className="input-label">Company name *</label><input className="input" placeholder="Desert Steel Co." value={company} onChange={e => setCompany(e.target.value)} required autoFocus /></div>
                  <div><label className="input-label">Trade *</label><input className="input" placeholder="Structural Steel" value={trade} onChange={e => setTrade(e.target.value)} required /></div>
                </div>
                <div className="g2">
                  <div><label className="input-label">Contact name</label><input className="input" placeholder="John Smith" value={contact} onChange={e => setContact(e.target.value)} /></div>
                  <div><label className="input-label">Email</label><input className="input" type="email" placeholder="john@company.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
                </div>
                <div className="g2">
                  <div><label className="input-label">Phone</label><input className="input" placeholder="(702) 555-0100" value={phone} onChange={e => setPhone(e.target.value)} /></div>
                  <div><label className="input-label">License #</label><input className="input" placeholder="NV-SS-4892" value={license} onChange={e => setLicense(e.target.value)} /></div>
                </div>
                <div className="g3">
                  <div><label className="input-label">Bid amount ($)</label><input className="input" type="number" placeholder="695000" value={bidAmt} onChange={e => setBidAmt(e.target.value)} min="0" /></div>
                  <div><label className="input-label">Market rate ($)</label><input className="input" type="number" placeholder="680000" value={mktRate} onChange={e => setMktRate(e.target.value)} min="0" /></div>
                  <div><label className="input-label">Status</label>
                    <select className="input" value={subStatus} onChange={e => setSubStatus(e.target.value as Subcontractor['status'])}>
                      {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn btn-sm btn-p" disabled={saving}>{saving ? 'Saving…' : 'Add Subcontractor'}</button>
                  <button type="button" className="btn btn-sm" onClick={resetForm}>Cancel</button>
                </div>
              </form>
            )}

            {subs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 13 }}>No subcontractors yet</div>
            ) : (
              subs.map(s => (
                <div key={s.id} onClick={() => { setSelected(s); setReplyDraft('') }} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 8px', borderBottom: '1px solid var(--border)', cursor: 'pointer', borderRadius: 6, background: selected?.id === s.id ? 'var(--bg)' : 'transparent' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0, color: 'var(--text-2)' }}>
                    {s.company_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{s.company_name}</div>
                    <div className="tsm tm">{s.trade}{s.license_number ? ` · ${s.license_number}` : ''}</div>
                  </div>
                  {s.bid_amount && <div className="mono tsm">${Number(s.bid_amount).toLocaleString()}</div>}
                  {s.ai_score && <div style={{ fontSize: 13, fontWeight: 600, color: SCORE_COLOR[s.ai_score] || 'var(--text-2)' }}>{s.ai_score}</div>}
                  <select value={s.status} onClick={e => e.stopPropagation()} onChange={e => updateSubStatus(s.id, e.target.value as Subcontractor['status'])} style={{ fontSize: 11, border: '1px solid var(--border)', borderRadius: 20, padding: '2px 6px', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {STATUS_OPTS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Sub detail + reply composer */}
        <div>
          {!selected ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>👆</div>
              <div style={{ fontSize: 13 }}>Select a subcontractor to view details and compose a reply</div>
            </div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{selected.company_name}</div>
                    <div className="tsm tm">{selected.trade}{selected.license_number ? ` · ${selected.license_number}` : ''}</div>
                  </div>
                  <span className={`pill ${STATUS_CLASS[selected.status] || 'p-gray'}`}>{selected.status}</span>
                </div>

                {/* Bid analysis */}
                {selected.bid_amount && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <div className="stat" style={{ padding: 12 }}>
                      <div className="sl">Their Bid</div>
                      <div className="sv mono" style={{ fontSize: 17 }}>${Number(selected.bid_amount).toLocaleString()}</div>
                    </div>
                    {selected.market_rate && (
                      <div className="stat" style={{ padding: 12 }}>
                        <div className="sl">Market Rate</div>
                        <div className="sv mono" style={{ fontSize: 17 }}>${Number(selected.market_rate).toLocaleString()}</div>
                      </div>
                    )}
                    {selected.variance_pct !== null && (
                      <div className="stat" style={{ padding: 12 }}>
                        <div className="sl">Variance</div>
                        <div className="sv" style={{ fontSize: 17, color: Math.abs(selected.variance_pct) > 10 ? 'var(--red)' : 'var(--green)' }}>
                          {selected.variance_pct > 0 ? '+' : ''}{selected.variance_pct.toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {selected.ai_score && (
                      <div className="stat" style={{ padding: 12 }}>
                        <div className="sl">AI Score</div>
                        <div className="sv" style={{ fontSize: 24, color: SCORE_COLOR[selected.ai_score] || 'var(--text-2)' }}>{selected.ai_score}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact */}
                {(selected.contact_name || selected.email || selected.phone) && (
                  <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {selected.contact_name && <div className="fr"><span className="tf" style={{ minWidth: 60 }}>Contact</span><span>{selected.contact_name}</span></div>}
                    {selected.email && <div className="fr"><span className="tf" style={{ minWidth: 60 }}>Email</span><a href={`mailto:${selected.email}`} style={{ color: 'var(--blue)', textDecoration: 'none' }}>{selected.email}</a></div>}
                    {selected.phone && <div className="fr"><span className="tf" style={{ minWidth: 60 }}>Phone</span><a href={`tel:${selected.phone}`} style={{ color: 'var(--blue)', textDecoration: 'none' }}>{selected.phone}</a></div>}
                  </div>
                )}

                {/* Internal notes (private) */}
                {selected.ai_notes && (
                  <div className="alert alert-a" style={{ marginTop: 12 }}>
                    <strong>🔒 Internal:</strong> {selected.ai_notes}
                  </div>
                )}
              </div>

              {/* Reply composer */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Reply Composer</div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button className="btn btn-sm" onClick={draftReply} disabled={drafting}>{drafting ? 'Drafting…' : 'AI Draft'}</button>
                    {replyDraft && <button className="btn btn-sm btn-p" onClick={sendReply} disabled={sending || !selected.email}>{sending ? 'Sending…' : 'Send →'}</button>}
                  </div>
                </div>
                {!selected.email && <div className="alert alert-a" style={{ marginBottom: 10 }}>⚠️ No email on file — add one to send replies</div>}
                <div className="compose-wrap">
                  <div className="compose-field"><label>To</label><input value={`${selected.company_name}${selected.email ? ` <${selected.email}>` : ' (no email)'}`} readOnly /></div>
                  <div className="compose-field"><label>Re</label><input defaultValue={`${selected.trade} Scope — ${project?.name}`} /></div>
                  <div className="compose-body">
                    <textarea
                      rows={8}
                      value={replyDraft}
                      onChange={e => setReplyDraft(e.target.value)}
                      placeholder={drafting ? 'AI is writing…' : "Click 'AI Draft' to generate a reply, or type your message directly"}
                    />
                  </div>
                  <div className="compose-footer">
                    <button className="btn btn-sm" onClick={() => setReplyDraft('')}>Clear</button>
                  </div>
                </div>
              </div>

              {/* Email history */}
              {subEmails.length > 0 && (
                <div className="card">
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Email History</div>
                  {subEmails.map(em => (
                    <div key={em.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className={`pill ${em.direction === 'outbound' ? 'p-blue' : 'p-gray'}`}>{em.direction}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{em.subject}</span>
                        <span className="tsm tf" style={{ marginLeft: 'auto' }}>{em.sent_at ? new Date(em.sent_at).toLocaleDateString() : 'Draft'}</span>
                      </div>
                      <div className="tsm tm" style={{ lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{em.body.slice(0, 200)}{em.body.length > 200 ? '…' : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}
    </>
  )
}
