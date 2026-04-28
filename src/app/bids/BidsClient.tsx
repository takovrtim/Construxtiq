'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Project, BidLineItem, Subcontractor } from '@/types'

interface Props {
  user: User
  project: Project | null
  initialBids: BidLineItem[]
  subs: Pick<Subcontractor, 'id' | 'company_name' | 'trade'>[]
}

const STATUS_OPTS = ['not_started', 'bidding', 'awarded', 'revise', 'rejected'] as const
const STATUS_LABEL: Record<string, string> = { not_started: 'Not started', bidding: 'Bidding', awarded: 'Awarded', revise: 'Revise', rejected: 'Rejected' }
const STATUS_CLASS: Record<string, string> = { awarded: 'p-green', bidding: 'p-amber', revise: 'p-red', rejected: 'p-gray', not_started: 'p-gray' }
const FLAG_CLASS: Record<string, string> = { critical: 'alert-r', warning: 'alert-a', info: 'alert-b' }

export function BidsClient({ user, project, initialBids, subs }: Props) {
  const [bids, setBids]       = useState<BidLineItem[]>(initialBids)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId]   = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState('')

  // Form state
  const [trade, setTrade]           = useState('')
  const [scope, setScope]           = useState('')
  const [amount, setAmount]         = useState('')
  const [marketLow, setMarketLow]   = useState('')
  const [marketHigh, setMarketHigh] = useState('')
  const [status, setStatus]         = useState<BidLineItem['status']>('not_started')

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function resetForm() {
    setTrade(''); setScope(''); setAmount(''); setMarketLow(''); setMarketHigh(''); setStatus('not_started')
    setShowAdd(false); setEditId(null)
  }

  function openEdit(b: BidLineItem) {
    setTrade(b.trade); setScope(b.scope_summary); setAmount(String(b.amount))
    setMarketLow(b.market_rate_low ? String(b.market_rate_low) : '')
    setMarketHigh(b.market_rate_high ? String(b.market_rate_high) : '')
    setStatus(b.status); setEditId(b.id); setShowAdd(false)
  }

  function calcVariance(amt: number, lo: number, hi: number): number | null {
    if (!lo || !hi) return null
    const mid = (lo + hi) / 2
    return ((amt - mid) / mid) * 100
  }

  function autoFlag(amt: number, lo: number | null, hi: number | null): { severity: BidLineItem['ai_flag_severity']; message: string } | null {
    if (!lo || !hi) return null
    const variance = calcVariance(amt, lo, hi)
    if (variance === null) return null
    if (variance > 20) return { severity: 'critical', message: `Bid is ${variance.toFixed(1)}% above market rate ($${((lo+hi)/2/1000).toFixed(0)}K avg). Request re-bid.` }
    if (variance > 10) return { severity: 'warning', message: `Bid is ${variance.toFixed(1)}% above market rate. Consider negotiating.` }
    if (variance < -10) return { severity: 'info', message: `Bid is ${Math.abs(variance).toFixed(1)}% below market — verify scope is complete.` }
    return null
  }

  async function saveBid(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !trade || !amount) return
    setSaving(true)

    const amt = parseFloat(amount)
    const lo = marketLow ? parseFloat(marketLow) : null
    const hi = marketHigh ? parseFloat(marketHigh) : null
    const variance = (lo && hi) ? calcVariance(amt, lo, hi) : null
    const flag = autoFlag(amt, lo, hi)

    const payload = {
      project_id: project.id,
      user_id: user.id,
      trade: trade.trim(),
      scope_summary: scope.trim(),
      amount: amt,
      market_rate_low: lo,
      market_rate_high: hi,
      variance_pct: variance,
      status,
      ai_flag: flag?.message ?? null,
      ai_flag_severity: flag?.severity ?? null,
      sort_order: bids.length,
    }

    if (editId) {
      const { data, error } = await supabase.from('bid_line_items').update(payload).eq('id', editId).select().single()
      if (!error && data) { setBids(prev => prev.map(b => b.id === editId ? data as BidLineItem : b)); showMsg('Bid updated') }
    } else {
      const { data, error } = await supabase.from('bid_line_items').insert(payload).select().single()
      if (!error && data) { setBids(prev => [...prev, data as BidLineItem]); showMsg('Bid added') }
    }
    resetForm(); setSaving(false)
  }

  async function deleteBid(id: string) {
    if (!confirm('Delete this line item?')) return
    const { error } = await supabase.from('bid_line_items').delete().eq('id', id)
    if (!error) { setBids(prev => prev.filter(b => b.id !== id)); showMsg('Deleted') }
  }

  async function updateStatus(id: string, newStatus: BidLineItem['status']) {
    const { error } = await supabase.from('bid_line_items').update({ status: newStatus }).eq('id', id)
    if (!error) setBids(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
  }

  // Totals
  const total    = bids.reduce((s, b) => s + Number(b.amount), 0)
  const awarded  = bids.filter(b => b.status === 'awarded').reduce((s, b) => s + Number(b.amount), 0)
  const flags    = bids.filter(b => b.ai_flag)

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>💰</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>No project selected</div>
      <a href="/dashboard?new=1" style={{ color: 'var(--orange)', textDecoration: 'none', fontSize: 13 }}>Create a project →</a>
    </div>
  )

  return (
    <>
      <div className="ptitle">Bids & Budget</div>
      <p className="psub">Track subcontractor bids · AI flags stay private · subs never see your internal notes</p>

      <div className="g2">
        {/* LEFT: Line items */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Line Items</div>
              <button className="btn btn-sm btn-p" onClick={() => { resetForm(); setShowAdd(v => !v) }}>
                {showAdd ? 'Cancel' : '+ Add Line'}
              </button>
            </div>

            {/* Add/Edit form */}
            {(showAdd || editId) && (
              <form onSubmit={saveBid} style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div className="g2">
                  <div>
                    <label className="input-label">Trade / scope *</label>
                    <input className="input" placeholder="Structural Steel" value={trade} onChange={e => setTrade(e.target.value)} required autoFocus />
                  </div>
                  <div>
                    <label className="input-label">Status</label>
                    <select className="input" value={status} onChange={e => setStatus(e.target.value as BidLineItem['status'])}>
                      {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="input-label">Scope summary</label>
                  <input className="input" placeholder="3-story, 580 tons, AISC 360-22 required" value={scope} onChange={e => setScope(e.target.value)} />
                </div>
                <div className="g3">
                  <div>
                    <label className="input-label">Bid amount ($) *</label>
                    <input className="input" type="number" placeholder="680000" value={amount} onChange={e => setAmount(e.target.value)} required min="0" />
                  </div>
                  <div>
                    <label className="input-label">Market low ($)</label>
                    <input className="input" type="number" placeholder="640000" value={marketLow} onChange={e => setMarketLow(e.target.value)} min="0" />
                  </div>
                  <div>
                    <label className="input-label">Market high ($)</label>
                    <input className="input" type="number" placeholder="720000" value={marketHigh} onChange={e => setMarketHigh(e.target.value)} min="0" />
                  </div>
                </div>
                {amount && marketLow && marketHigh && (() => {
                  const flag = autoFlag(parseFloat(amount), parseFloat(marketLow), parseFloat(marketHigh))
                  return flag ? <div className={`alert ${FLAG_CLASS[flag.severity || 'info']}`}>🔒 Internal flag: {flag.message}</div> : null
                })()}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn btn-sm btn-p" disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Add Line Item'}</button>
                  <button type="button" className="btn btn-sm" onClick={resetForm}>Cancel</button>
                </div>
              </form>
            )}

            {/* Bid rows */}
            {bids.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 13 }}>
                No line items yet — click &ldquo;+ Add Line&rdquo; to start
              </div>
            ) : (
              <>
                {bids.map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', background: b.ai_flag_severity === 'critical' ? 'var(--red-l)' : 'transparent', borderRadius: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: b.status === 'awarded' ? 'var(--green)' : b.status === 'bidding' ? 'var(--amber)' : b.status === 'revise' ? 'var(--red)' : '#9e9d99', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{b.trade}</div>
                      {b.scope_summary && <div className="tsm tm">{b.scope_summary}</div>}
                    </div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 500, minWidth: 80, textAlign: 'right' }}>
                      ${Number(b.amount).toLocaleString()}
                    </div>
                    {b.variance_pct !== null && (
                      <div style={{ fontSize: 11, fontWeight: 500, color: Math.abs(b.variance_pct) > 10 ? 'var(--red)' : 'var(--text-3)', minWidth: 48, textAlign: 'right' }}>
                        {b.variance_pct > 0 ? '+' : ''}{b.variance_pct.toFixed(1)}%
                      </div>
                    )}
                    <select
                      value={b.status}
                      onChange={e => updateStatus(b.id, e.target.value as BidLineItem['status'])}
                      style={{ fontSize: 11, border: '1px solid var(--border)', borderRadius: 20, padding: '2px 6px', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                    <button className="btn btn-sm" onClick={() => openEdit(b)} style={{ padding: '3px 8px', fontSize: 11 }}>Edit</button>
                    <button onClick={() => deleteBid(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '0 4px', fontSize: 16, lineHeight: 1 }}>×</button>
                  </div>
                ))}
                <div className="dv" />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span className="tm">Total direct costs</span>
                  <span className="mono bold">${total.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
                  <span className="tm">Awarded so far</span>
                  <span className="mono" style={{ color: 'var(--green)' }}>${awarded.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: AI flags (private) + budget bars */}
        <div>
          <div className="card" style={{ marginBottom: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Internal AI Flags</div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>🔒 Never shared with subs</span>
            </div>
            {flags.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-3)', padding: '12px 0', textAlign: 'center' }}>
                {bids.length === 0 ? 'Add bids to see AI analysis' : '✓ No flags — all bids look good'}
              </div>
            ) : (
              flags.map(b => (
                <div key={b.id} className={`alert ${FLAG_CLASS[b.ai_flag_severity || 'info']}`} style={{ marginBottom: 7 }}>
                  <strong>{b.trade}</strong> — {b.ai_flag}
                </div>
              ))
            )}
          </div>

          {bids.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Budget Allocation</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {bids.map(b => {
                  const pct = total > 0 ? (Number(b.amount) / total) * 100 : 0
                  const color = b.status === 'awarded' ? '#2d7a4f' : b.status === 'revise' ? '#b83232' : b.status === 'bidding' ? '#b06e1a' : '#9e9d99'
                  return (
                    <div key={b.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span>{b.trade}</span>
                        <span className="tm mono">${Number(b.amount).toLocaleString()} · {pct.toFixed(0)}%</span>
                      </div>
                      <div className="pw"><div className="pf" style={{ width: `${Math.min(pct * 2, 100)}%`, background: color }} /></div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}
    </>
  )
}
