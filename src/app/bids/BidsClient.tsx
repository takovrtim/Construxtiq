'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Project, BidLineItem, Subcontractor } from '@/types'

interface Props {
  user: User
  project: Project | null
  initialBids: BidLineItem[]
  initialSubs: Subcontractor[]
}

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', bg: '#f1ede6', text: '#6b6a66' },
  bidding:     { label: 'Bidding',     bg: '#E6F1FB', text: '#0C447C' },
  awarded:     { label: 'Awarded',     bg: '#edf5f0', text: '#1a4d31' },
  revise:      { label: 'Revise',      bg: '#fdf4e3', text: '#6b4010' },
  rejected:    { label: 'Rejected',    bg: '#fdf0f0', text: '#6e1a1a' },
}

const TRADES = [
  'Electrical', 'Plumbing', 'HVAC', 'Framing', 'Drywall', 'Roofing',
  'Concrete', 'Painting', 'Flooring', 'Landscaping', 'General Labor', 'Other'
]

export function BidsClient({ user, project, initialBids, initialSubs }: Props) {
  const [bids, setBids]       = useState<BidLineItem[]>(initialBids)
  const [subs, setSubs]       = useState<Subcontractor[]>(initialSubs)
  const [selected, setSelected] = useState<BidLineItem | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [activeTab, setActiveTab] = useState<'bids' | 'subs'>('bids')

  // Bid form
  const [trade, setTrade]         = useState('Electrical')
  const [scope, setScope]         = useState('')
  const [amount, setAmount]       = useState('')
  const [marketLow, setMarketLow] = useState('')
  const [marketHigh, setMarketHigh] = useState('')
  const [status, setStatus]       = useState<BidLineItem['status']>('not_started')
  const [subId, setSubId]         = useState('')

  // Sub form
  const [showAddSub, setShowAddSub] = useState(false)
  const [subCompany, setSubCompany] = useState('')
  const [subContact, setSubContact] = useState('')
  const [subEmail, setSubEmail]     = useState('')
  const [subPhone, setSubPhone]     = useState('')
  const [subTrade, setSubTrade]     = useState('Electrical')
  const [subLicense, setSubLicense] = useState('')
  const [subBid, setSubBid]         = useState('')
  const [savingSub, setSavingSub]   = useState(false)

  function msg(text: string) { setToast(text); setTimeout(() => setToast(''), 3000) }

  // Totals
  const totalBid     = bids.reduce((s, b) => s + Number(b.amount), 0)
  const totalAwarded = bids.filter(b => b.status === 'awarded').reduce((s, b) => s + Number(b.amount), 0)
  const flagged      = bids.filter(b => b.ai_flag_severity === 'critical' || b.ai_flag_severity === 'warning').length

  // Variance color
  function varianceColor(pct: number | null) {
    if (!pct) return '#9e9d99'
    if (pct > 20) return '#b83232'
    if (pct > 10) return '#b06e1a'
    if (pct < -10) return '#2d7a4f'
    return '#9e9d99'
  }

  function formatPhone(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 10)
    if (d.length >= 7) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
    if (d.length >= 4) return `(${d.slice(0,3)}) ${d.slice(3)}`
    if (d.length >= 1) return `(${d}`
    return ''
  }

  async function addBid(e: React.FormEvent) {
    e.preventDefault()
    if (!project) return
    setSaving(true)

    const amt = parseFloat(amount) || 0
    const low = parseFloat(marketLow) || null
    const high = parseFloat(marketHigh) || null
    const marketMid = low && high ? (low + high) / 2 : null
    const variance = marketMid && amt ? ((amt - marketMid) / marketMid) * 100 : null

    let aiFlag = null
    let aiSeverity: BidLineItem['ai_flag_severity'] = null
    if (variance !== null) {
      if (variance > 25) { aiFlag = `${trade} bid is ${variance.toFixed(0)}% above market rate — likely overpriced`; aiSeverity = 'critical' }
      else if (variance > 10) { aiFlag = `${trade} bid is ${variance.toFixed(0)}% above market rate — worth negotiating`; aiSeverity = 'warning' }
      else if (variance < -15) { aiFlag = `${trade} bid is ${Math.abs(variance).toFixed(0)}% below market — verify scope is complete`; aiSeverity = 'warning' }
    }

    const { data, error } = await supabase.from('bid_line_items').insert({
      project_id: project.id,
      user_id: user.id,
      trade, scope_summary: scope, amount: amt,
      market_rate_low: low, market_rate_high: high,
      variance_pct: variance,
      status, sub_id: subId || null,
      ai_flag: aiFlag, ai_flag_severity: aiSeverity,
      sort_order: bids.length,
    }).select().single()

    if (!error && data) {
      setBids(prev => [...prev, data as BidLineItem])
      msg(`✓ ${trade} bid added`)
      setTrade('Electrical'); setScope(''); setAmount('')
      setMarketLow(''); setMarketHigh(''); setSubId('')
      setShowAdd(false)
    } else msg('Failed to save bid')
    setSaving(false)
  }

  async function updateBidStatus(id: string, newStatus: BidLineItem['status']) {
    const { error } = await supabase.from('bid_line_items').update({ status: newStatus }).eq('id', id)
    if (!error) {
      setBids(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null)
      msg(`✓ Status updated`)
    }
  }

  async function deleteBid(id: string) {
    if (!confirm('Delete this bid?')) return
    const { error } = await supabase.from('bid_line_items').delete().eq('id', id)
    if (!error) { setBids(prev => prev.filter(b => b.id !== id)); setSelected(null); msg('Bid deleted') }
  }

  async function addSub(e: React.FormEvent) {
    e.preventDefault()
    if (!project) return
    setSavingSub(true)
    const { data, error } = await supabase.from('subcontractors').insert({
      project_id: project.id, user_id: user.id,
      company_name: subCompany, contact_name: subContact,
      email: subEmail || null, phone: subPhone || null,
      license_number: subLicense || null, trade: subTrade,
      bid_amount: subBid ? parseFloat(subBid) : null,
      status: 'prospect',
    }).select().single()

    if (!error && data) {
      setSubs(prev => [...prev, data as Subcontractor])
      msg(`✓ ${subCompany} added`)
      setSubCompany(''); setSubContact(''); setSubEmail('')
      setSubPhone(''); setSubLicense(''); setSubBid('')
      setShowAddSub(false)
    } else msg('Failed to add sub')
    setSavingSub(false)
  }

  async function deleteSub(id: string) {
    if (!confirm('Remove this subcontractor?')) return
    const { error } = await supabase.from('subcontractors').delete().eq('id', id)
    if (!error) { setSubs(prev => prev.filter(s => s.id !== id)); msg('Sub removed') }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#F1EEE5' }
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9e9d99' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#6b6a66' }}>No project selected</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Bids & Subcontractors</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Track every bid, flag overpriced subs privately</div>
        </div>
        <button
          onClick={() => activeTab === 'bids' ? setShowAdd(v => !v) : setShowAddSub(v => !v)}
          style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit', letterSpacing: '-0.2px' }}
        >
          {activeTab === 'bids' ? '+ Add Bid' : '+ Add Sub'}
        </button>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Bid Value', value: `$${(totalBid/1000).toFixed(0)}K`, sub: `${bids.length} line items`, accent: '' },
          { label: 'Awarded', value: `$${(totalAwarded/1000).toFixed(0)}K`, sub: `${bids.filter(b=>b.status==='awarded').length} awarded`, accent: '#2d7a4f' },
          { label: 'Pending', value: bids.filter(b=>b.status==='bidding').length, sub: 'waiting on bids', accent: '' },
          { label: 'AI Flags', value: flagged, sub: 'pricing concerns', accent: flagged > 0 ? '#b83232' : '' },
        ].map(s => (
          <div key={s.label} style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: s.accent || '#0f0f0f', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f8f7f4', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {(['bids', 'subs'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '7px 18px', fontSize: 13, fontWeight: activeTab === tab ? 700 : 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: activeTab === tab ? 'white' : 'transparent', color: activeTab === tab ? '#0f0f0f' : '#9e9d99', boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', textTransform: 'capitalize' }}>
            {tab === 'bids' ? `Bids (${bids.length})` : `Subcontractors (${subs.length})`}
          </button>
        ))}
      </div>

      {/* BIDS TAB */}
      {activeTab === 'bids' && (
        <>
          {/* Add Bid Form */}
          {showAdd && (
            <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 22, marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>New Bid Line Item</div>
              <form onSubmit={addBid} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Trade *</label>
                    <select style={{ ...inputStyle, background: '#131A26' }} value={trade} onChange={e => setTrade(e.target.value)}>
                      {TRADES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Bid Amount ($) *</label>
                    <input style={inputStyle} type="number" placeholder="25000" value={amount} onChange={e => setAmount(e.target.value)} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select style={{ ...inputStyle, background: '#131A26' }} value={status} onChange={e => setStatus(e.target.value as any)}>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Market Rate Low ($)</label>
                    <input style={inputStyle} type="number" placeholder="20000" value={marketLow} onChange={e => setMarketLow(e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Market Rate High ($)</label>
                    <input style={inputStyle} type="number" placeholder="30000" value={marketHigh} onChange={e => setMarketHigh(e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Assign Sub</label>
                    <select style={{ ...inputStyle, background: '#131A26' }} value={subId} onChange={e => setSubId(e.target.value)}>
                      <option value="">Unassigned</option>
                      {subs.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Scope Summary</label>
                  <textarea style={{ ...inputStyle, resize: 'none' }} rows={2} placeholder="Describe the scope of work..." value={scope} onChange={e => setScope(e.target.value)} />
                </div>
                {marketLow && marketHigh && amount && (
                  <div style={{ background: (() => { const v = ((parseFloat(amount) - (parseFloat(marketLow)+parseFloat(marketHigh))/2) / ((parseFloat(marketLow)+parseFloat(marketHigh))/2)) * 100; return v > 20 ? '#fdf0f0' : v > 10 ? '#fdf4e3' : '#edf5f0' })(), borderRadius: 8, padding: '10px 14px', fontSize: 12, borderLeft: '3px solid' + (() => { const v = ((parseFloat(amount) - (parseFloat(marketLow)+parseFloat(marketHigh))/2) / ((parseFloat(marketLow)+parseFloat(marketHigh))/2)) * 100; return v > 20 ? '#b83232' : v > 10 ? '#b06e1a' : '#2d7a4f' })() }}>
                    {(() => {
                      const mid = (parseFloat(marketLow) + parseFloat(marketHigh)) / 2
                      const v = ((parseFloat(amount) - mid) / mid) * 100
                      if (v > 20) return `🔴 ${v.toFixed(0)}% above market — AI will flag as critical`
                      if (v > 10) return `⚠️ ${v.toFixed(0)}% above market — AI will flag as warning`
                      if (v < -15) return `⚠️ ${Math.abs(v).toFixed(0)}% below market — verify scope is complete`
                      return `✓ Within market range (${v > 0 ? '+' : ''}${v.toFixed(0)}%)`
                    })()}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={saving} style={{ padding: '10px 22px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#131A26', color: 'white', fontFamily: 'inherit' }}>
                    {saving ? 'Saving...' : 'Save Bid'}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '10px 16px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: '#131A26', fontFamily: 'inherit' }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Bids Table */}
          <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            {bids.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '52px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No bids yet</div>
                <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 20 }}>Add your first bid line item to start tracking costs</div>
                <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Add First Bid</button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    {['Trade', 'Sub', 'Bid Amount', 'Market Range', 'Variance', 'Status', 'Flag', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '11px 14px', fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bids.map(bid => {
                    const sub = subs.find(s => s.id === bid.sub_id)
                    const sc = STATUS_CONFIG[bid.status]
                    return (
                      <tr key={bid.id} onClick={() => setSelected(bid === selected ? null : bid)} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer', background: selected?.id === bid.id ? '#f8f7f4' : 'transparent', transition: 'background 0.1s' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600 }}>{bid.trade}</div>
                          {bid.scope_summary && <div style={{ fontSize: 11, color: '#9e9d99', marginTop: 2, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bid.scope_summary}</div>}
                        </td>
                        <td style={{ padding: '12px 14px', color: sub ? '#0f0f0f' : '#9e9d99', fontSize: 12 }}>
                          {sub ? sub.company_name : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'monospace' }}>
                          ${Number(bid.amount).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#9e9d99' }}>
                          {bid.market_rate_low && bid.market_rate_high
                            ? `$${Number(bid.market_rate_low).toLocaleString()} – $${Number(bid.market_rate_high).toLocaleString()}`
                            : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: varianceColor(bid.variance_pct), fontFamily: 'monospace', fontSize: 12 }}>
                          {bid.variance_pct !== null ? `${bid.variance_pct > 0 ? '+' : ''}${Number(bid.variance_pct).toFixed(1)}%` : '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.text }}>{sc.label}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {bid.ai_flag && (
                            <span title={bid.ai_flag} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: bid.ai_flag_severity === 'critical' ? '#fdf0f0' : '#fdf4e3', color: bid.ai_flag_severity === 'critical' ? '#b83232' : '#b06e1a', cursor: 'help' }}>
                              {bid.ai_flag_severity === 'critical' ? '🔴' : '⚠️'} Flag
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={e => { e.stopPropagation(); deleteBid(bid.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9e9d99', fontSize: 16, padding: '0 4px' }} onMouseEnter={e => (e.currentTarget.style.color = '#b83232')} onMouseLeave={e => (e.currentTarget.style.color = '#9e9d99')}>×</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid rgba(0,0,0,0.06)', background: '#f8f7f4' }}>
                    <td colSpan={2} style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#9e9d99' }}>TOTAL</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'monospace', fontSize: 14 }}>${totalBid.toLocaleString()}</td>
                    <td colSpan={5} style={{ padding: '12px 14px', fontSize: 12, color: '#9e9d99' }}>
                      ${totalAwarded.toLocaleString()} awarded · {bids.filter(b => b.ai_flag).length} flagged by AI
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Bid Detail Panel */}
          {selected && (
            <>
              <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(3px)' }} />
              <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, background: '#131A26', borderLeft: '1px solid rgba(0,0,0,0.08)', boxShadow: '-12px 0 48px rgba(0,0,0,0.15)', zIndex: 100, overflowY: 'auto', padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 3 }}>{selected.trade}</div>
                    <div style={{ fontSize: 12, color: '#9e9d99' }}>{selected.scope_summary || 'No scope added'}</div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: '#f8f7f4', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9d99' }}>×</button>
                </div>

                {/* AI Flag */}
                {selected.ai_flag && (
                  <div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 9, borderLeft: `3px solid ${selected.ai_flag_severity === 'critical' ? '#b83232' : '#b06e1a'}`, background: selected.ai_flag_severity === 'critical' ? '#fdf0f0' : '#fdf4e3', fontSize: 13, color: selected.ai_flag_severity === 'critical' ? '#6e1a1a' : '#6b4010', lineHeight: 1.6 }}>
                    {selected.ai_flag_severity === 'critical' ? '🔴' : '⚠️'} <strong>AI Flag (Private):</strong> {selected.ai_flag}
                  </div>
                )}

                {/* Financials */}
                <div style={{ background: '#131A26', borderRadius: 12, padding: 16, marginBottom: 16, color: 'white' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Bid Amount</div>
                      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-1px' }}>${Number(selected.amount).toLocaleString()}</div>
                    </div>
                    {selected.variance_pct !== null && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>vs Market</div>
                        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-1px', color: selected.variance_pct > 15 ? '#f87171' : selected.variance_pct < -10 ? '#4ade80' : 'white' }}>
                          {selected.variance_pct > 0 ? '+' : ''}{Number(selected.variance_pct).toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                  {selected.market_rate_low && selected.market_rate_high && (
                    <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      Market range: ${Number(selected.market_rate_low).toLocaleString()} – ${Number(selected.market_rate_high).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Update Status</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 18 }}>
                  {(Object.keys(STATUS_CONFIG) as BidLineItem['status'][]).map(s => {
                    const cfg = STATUS_CONFIG[s]
                    const active = selected.status === s
                    return (
                      <button key={s} onClick={() => updateBidStatus(selected.id, s)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${active ? '#0f0f0f' : 'rgba(0,0,0,0.07)'}`, background: active ? cfg.bg : 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .12s' }}>
                        <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? cfg.text : '#6b6a66', flex: 1 }}>{cfg.label}</span>
                        {active && <span style={{ color: cfg.text }}>✓</span>}
                      </button>
                    )
                  })}
                </div>

                <button onClick={() => deleteBid(selected.id)} style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit' }}>
                  Delete Bid
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* SUBS TAB */}
      {activeTab === 'subs' && (
        <>
          {showAddSub && (
            <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 22, marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Add Subcontractor</div>
              <form onSubmit={addSub} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>Company Name *</label><input style={inputStyle} placeholder="ABC Electric LLC" value={subCompany} onChange={e => setSubCompany(e.target.value)} required autoFocus /></div>
                  <div><label style={labelStyle}>Trade</label>
                    <select style={{ ...inputStyle, background: '#131A26' }} value={subTrade} onChange={e => setSubTrade(e.target.value)}>
                      {TRADES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Contact Name</label><input style={inputStyle} placeholder="John Smith" value={subContact} onChange={e => setSubContact(e.target.value)} /></div>
                  <div><label style={labelStyle}>Phone</label><input style={inputStyle} placeholder="(702) 555-0100" value={subPhone} type="tel" onChange={e => setSubPhone(formatPhone(e.target.value))} /></div>
                  <div><label style={labelStyle}>Email</label><input style={inputStyle} placeholder="john@abcelectric.com" type="email" value={subEmail} onChange={e => setSubEmail(e.target.value)} /></div>
                  <div><label style={labelStyle}>License #</label><input style={inputStyle} placeholder="NV-C2-12345" value={subLicense} onChange={e => setSubLicense(e.target.value.toUpperCase())} /></div>
                  <div><label style={labelStyle}>Bid Amount ($)</label><input style={inputStyle} type="number" placeholder="25000" value={subBid} onChange={e => setSubBid(e.target.value)} /></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={savingSub} style={{ padding: '10px 22px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#131A26', color: 'white', fontFamily: 'inherit' }}>
                    {savingSub ? 'Saving...' : 'Add Sub'}
                  </button>
                  <button type="button" onClick={() => setShowAddSub(false)} style={{ padding: '10px 16px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: '#131A26', fontFamily: 'inherit' }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            {subs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '52px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👷</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No subs yet</div>
                <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 20 }}>Add your subcontractors to assign them to bids</div>
                <button onClick={() => setShowAddSub(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Add First Sub</button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    {['Company', 'Trade', 'Contact', 'Phone', 'License', 'Bid', 'Status', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '11px 14px', fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subs.map(sub => (
                    <tr key={sub.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background 0.1s' }} onMouseEnter={e => (e.currentTarget.style.background = '#f8f7f4')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600 }}>{sub.company_name}</div>
                        {sub.email && <div style={{ fontSize: 11, color: '#9e9d99' }}>{sub.email}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#6b6a66' }}>{sub.trade}</td>
                      <td style={{ padding: '12px 14px', color: '#6b6a66' }}>{sub.contact_name || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {sub.phone ? <a href={`tel:${sub.phone.replace(/\D/g,'')}`} style={{ color: '#1f5fa6', textDecoration: 'none', fontSize: 12 }}>{sub.phone}</a> : <span style={{ color: '#9e9d99' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: '#6b6a66' }}>{sub.license_number || '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace' }}>
                        {sub.bid_amount ? `$${Number(sub.bid_amount).toLocaleString()}` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#edf5f0', color: '#1a4d31', textTransform: 'capitalize' }}>{sub.status}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button onClick={() => deleteSub(sub.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9e9d99', fontSize: 16, padding: '0 4px' }} onMouseEnter={e => (e.currentTarget.style.color = '#b83232')} onMouseLeave={e => (e.currentTarget.style.color = '#9e9d99')}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: selected ? 404 : 24, zIndex: 9999, background: '#131A26', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
          {toast}
        </div>
      )}
    </>
  )
}
