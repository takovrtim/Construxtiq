'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// ── COLORS ────────────────────────────────────────────────────
const C = {
  bg:        '#07090E',
  surface:   '#0D1117',
  surface2:  '#111827',
  border:    '#1C2333',
  border2:   '#232E42',
  orange:    '#FF6B1F',
  orangeDim: 'rgba(255,107,31,0.10)',
  text:      '#F1EEE5',
  muted:     '#7B8497',
  dim:       '#3D4558',
  green:     '#4FE3B5',
  greenDim:  'rgba(79,227,181,0.1)',
  red:       '#FF5260',
  redDim:    'rgba(255,82,96,0.1)',
  yellow:    '#F5A623',
  yellowDim: 'rgba(245,166,35,0.1)',
  blue:      '#4A9EFF',
  blueDim:   'rgba(74,158,255,0.1)',
}

// ── TYPES ─────────────────────────────────────────────────────
type BidStatus = 'draft' | 'submitted' | 'reviewing' | 'won' | 'lost'

interface Bid {
  id: string
  project_name: string
  gc_name: string
  trade: string
  bid_value: number | null
  due_date: string | null
  submitted_date: string | null
  status: BidStatus
  notes: string | null
  source: string | null
  created_at: string
}

// ── STATUS CONFIG ─────────────────────────────────────────────
const STATUS: Record<BidStatus, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',       color: C.muted,  bg: 'rgba(123,132,151,0.1)' },
  submitted: { label: 'Submitted',   color: C.yellow, bg: C.yellowDim              },
  reviewing: { label: 'Reviewing',   color: C.blue,   bg: C.blueDim                },
  won:       { label: 'Won',         color: C.green,  bg: C.greenDim               },
  lost:      { label: 'Lost',        color: C.red,    bg: C.redDim                 },
}

const STATUSES: BidStatus[] = ['draft', 'submitted', 'reviewing', 'won', 'lost']
const TRADES = ['Electrical', 'Plumbing', 'Mechanical', 'HVAC', 'Fire Protection', 'General', 'Other']
const SOURCES = ['City of Las Vegas', 'Clark County', 'Henderson', 'PlanetBids', 'DemandStar', 'Direct GC', 'Other']

// ── HELPERS ───────────────────────────────────────────────────
function fmt$(n: number | null) {
  if (!n) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function daysUntil(date: string | null) {
  if (!date) return null
  const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000)
  return d
}

function fmtDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── STAT CARD ─────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || C.text, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

// ── STATUS PILL ───────────────────────────────────────────────
function StatusPill({ status }: { status: BidStatus }) {
  const s = STATUS[status]
  return (
    <span style={{ background: s.bg, color: s.color, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

// ── BID CARD ──────────────────────────────────────────────────
function BidCard({ bid, onStatusChange, onDelete }: {
  bid: Bid
  onStatusChange: (id: string, status: BidStatus) => void
  onDelete: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const days = daysUntil(bid.due_date)
  const urgent = days !== null && days <= 3 && days >= 0 && bid.status !== 'won' && bid.status !== 'lost'

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${urgent ? 'rgba(255,82,96,0.3)' : C.border}`,
      borderLeft: `3px solid ${STATUS[bid.status].color}`,
      borderRadius: 10, padding: '14px 16px',
      marginBottom: 8, position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
            {bid.project_name}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>{bid.gc_name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <StatusPill status={bid.status} />
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dim, padding: '2px 4px', fontSize: 16, lineHeight: 1, fontFamily: 'inherit' }}
            >⋯</button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                <div style={{ position: 'absolute', right: 0, top: '100%', background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, zIndex: 99, overflow: 'hidden', minWidth: 150, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  <div style={{ padding: '6px 0' }}>
                    <div style={{ padding: '4px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Update status</div>
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => { onStatusChange(bid.id, s); setMenuOpen(false) }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                        onMouseEnter={e => (e.currentTarget.style.background = C.border)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS[s].color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: C.text }}>{STATUS[s].label}</span>
                        {bid.status === s && <span style={{ marginLeft: 'auto', fontSize: 10, color: C.green }}>✓</span>}
                      </button>
                    ))}
                  </div>
                  <div style={{ borderTop: `1px solid ${C.border}` }}>
                    <button onClick={() => { onDelete(bid.id); setMenuOpen(false) }}
                      style={{ width: '100%', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: C.red, textAlign: 'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.redDim)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >Delete bid</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: bid.status === 'won' ? C.green : C.text }}>{fmt$(bid.bid_value)}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim }}>·</span>
        <span style={{ fontSize: 11, color: C.muted }}>{bid.trade}</span>
        {bid.source && (
          <>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim }}>·</span>
            <span style={{ fontSize: 11, color: C.dim }}>{bid.source}</span>
          </>
        )}
        {bid.due_date && bid.status !== 'won' && bid.status !== 'lost' && (
          <>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim }}>·</span>
            <span style={{ fontSize: 11, color: urgent ? C.red : C.muted, fontWeight: urgent ? 600 : 400 }}>
              {days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : days !== null && days < 0 ? 'Overdue' : `Due ${fmtDate(bid.due_date)}`}
              {urgent && ' ⚠'}
            </span>
          </>
        )}
      </div>

      {bid.notes && (
        <div style={{ marginTop: 8, fontSize: 11, color: C.muted, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {bid.notes}
        </div>
      )}
    </div>
  )
}

// ── ADD BID MODAL ─────────────────────────────────────────────
function AddBidModal({ onClose, onSave }: { onClose: () => void; onSave: (bid: Partial<Bid>) => void }) {
  const [form, setForm] = useState({ project_name: '', gc_name: '', trade: 'Electrical', bid_value: '', due_date: '', submitted_date: '', status: 'draft' as BidStatus, source: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.project_name || !form.gc_name) return
    setSaving(true)
    await onSave({
      project_name:   form.project_name,
      gc_name:        form.gc_name,
      trade:          form.trade,
      bid_value:      form.bid_value ? parseFloat(form.bid_value) : null,
      due_date:       form.due_date || null,
      submitted_date: form.submitted_date || null,
      status:         form.status,
      source:         form.source || null,
      notes:          form.notes || null,
    })
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', fontSize: 13, border: `1.5px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s' }
  const lbl: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.12em' }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 501, width: '100%', maxWidth: 520, background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 16, padding: '28px', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Add Bid</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Track a new bid opportunity</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 20, padding: 4, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Project Name *</label>
            <input style={inp} placeholder="Hardrock Tower — Electrical Rough-In" value={form.project_name} onChange={e => set('project_name', e.target.value)}
              onFocus={e => (e.target.style.borderColor = C.orange)} onBlur={e => (e.target.style.borderColor = C.border)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>GC / Owner *</label>
              <input style={inp} placeholder="Turner Construction" value={form.gc_name} onChange={e => set('gc_name', e.target.value)}
                onFocus={e => (e.target.style.borderColor = C.orange)} onBlur={e => (e.target.style.borderColor = C.border)} />
            </div>
            <div>
              <label style={lbl}>Trade</label>
              <select style={{ ...inp, appearance: 'none' }} value={form.trade} onChange={e => set('trade', e.target.value)}>
                {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Bid Value ($)</label>
              <input style={inp} type="number" placeholder="94200" value={form.bid_value} onChange={e => set('bid_value', e.target.value)}
                onFocus={e => (e.target.style.borderColor = C.orange)} onBlur={e => (e.target.style.borderColor = C.border)} />
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={{ ...inp, appearance: 'none' }} value={form.status} onChange={e => set('status', e.target.value as BidStatus)}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS[s].label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Due Date</label>
              <input style={inp} type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                onFocus={e => (e.target.style.borderColor = C.orange)} onBlur={e => (e.target.style.borderColor = C.border)} />
            </div>
            <div>
              <label style={lbl}>Submitted Date</label>
              <input style={inp} type="date" value={form.submitted_date} onChange={e => set('submitted_date', e.target.value)}
                onFocus={e => (e.target.style.borderColor = C.orange)} onBlur={e => (e.target.style.borderColor = C.border)} />
            </div>
          </div>

          <div>
            <label style={lbl}>Source</label>
            <select style={{ ...inp, appearance: 'none' }} value={form.source} onChange={e => set('source', e.target.value)}>
              <option value="">Select source...</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>Notes</label>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 72 }} placeholder="Scope notes, risks, contacts..." value={form.notes} onChange={e => set('notes', e.target.value)}
              onFocus={e => (e.target.style.borderColor = C.orange)} onBlur={e => (e.target.style.borderColor = C.border)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: `1px solid ${C.border2}`, background: 'transparent', color: C.muted, fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={submit} disabled={saving || !form.project_name || !form.gc_name}
            style={{ flex: 2, padding: '11px', fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', border: 'none', background: saving ? 'rgba(255,107,31,0.4)' : C.orange, color: 'white', fontFamily: 'inherit' }}>
            {saving ? 'Saving...' : 'Add Bid'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── BID SCORE DEMO ────────────────────────────────────────────
function BidScoreDemo() {
  const [phase, setPhase] = useState<'idle'|'analyzing'|'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [score, setScore] = useState(0)

  function run() {
    setPhase('analyzing'); setProgress(0); setScore(0)
    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 9 + 3
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => { setPhase('done'); animScore() }, 300) }
      setProgress(p)
    }, 120)
  }

  function animScore() {
    let s = 0
    const iv = setInterval(() => {
      s += 3
      if (s >= 74) { clearInterval(iv); setScore(74) }
      else setScore(s)
    }, 18)
  }

  const checks = [
    { label: 'Union wage rates verified',    ok: true  },
    { label: 'Material escalation included', ok: true  },
    { label: 'Permit fees accounted',        ok: true  },
    { label: 'Bonding requirement noted',    ok: false, flag: 'Missing: Performance bond 100% contract value' },
    { label: 'Prevailing wage clause',       ok: false, flag: 'Clark County project — prevailing wage applies' },
  ]

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.orange, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>AI Bid Scorer</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Score any bid in 30 seconds</div>
        </div>
        {phase === 'done' && (
          <button onClick={() => { setPhase('idle'); setScore(0); setProgress(0) }}
            style={{ fontSize: 11, color: C.muted, background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Reset
          </button>
        )}
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ border: `2px dashed ${phase !== 'idle' ? C.orange : C.border}`, borderRadius: 10, padding: '20px', marginBottom: 16, textAlign: 'center', background: phase !== 'idle' ? C.orangeDim : 'transparent', transition: 'all 0.3s' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            {phase === 'idle' ? 'Bid Document' : phase === 'analyzing' ? 'Analyzing...' : 'Analysis Complete'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: phase === 'idle' ? 12 : 0 }}>
            Hardrock Tower — Electrical Rough-In.pdf
          </div>
          {phase === 'idle' && (
            <button onClick={run} style={{ marginTop: 4, padding: '8px 20px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: 'none', background: C.orange, color: 'white', fontFamily: 'inherit' }}>
              Score This Bid
            </button>
          )}
          {phase === 'analyzing' && (
            <div style={{ height: 3, background: C.border, borderRadius: 99, overflow: 'hidden', marginTop: 10 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: C.orange, borderRadius: 99, transition: 'width 0.1s' }}/>
            </div>
          )}
        </div>

        {phase === 'done' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Win Score', value: `${score}`, sub: 'out of 100', color: C.orange },
                { label: 'Win Range', value: '$89K–97K',  sub: 'Your bid: $94.2K', color: C.green },
                { label: 'Margin',    value: '18.4%',     sub: 'Market avg: 14.1%', color: C.text },
              ].map((s, i) => (
                <div key={i} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 9, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: i === 0 ? 28 : 15, fontWeight: 700, color: s.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Bid Analysis</div>
            {checks.map((c, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: c.ok ? 'rgba(79,227,181,0.1)' : C.redDim, border: `1px solid ${c.ok ? C.green : C.red}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 8, color: c.ok ? C.green : C.red }}>{c.ok ? '✓' : '!'}</span>
                  </div>
                  <span style={{ fontSize: 12, color: c.ok ? C.muted : C.red, fontWeight: c.ok ? 400 : 600 }}>{c.label}</span>
                </div>
                {c.flag && <div style={{ marginLeft: 24, marginTop: 3, fontSize: 10, color: C.red, fontStyle: 'italic' }}>{c.flag}</div>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function BidIQPage() {
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<BidStatus | 'all'>('all')
  const [tab, setTab] = useState<'pipeline' | 'score'>('pipeline')

  useEffect(() => { loadBids() }, [])

  async function loadBids() {
    setLoading(true)
    const { data } = await supabase
      .from('bids')
      .select('*')
      .order('created_at', { ascending: false })
    setBids(data || [])
    setLoading(false)
  }

  async function addBid(bid: Partial<Bid>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('bids').insert({ ...bid, user_id: user.id }).select().single()
    if (data) { setBids(prev => [data, ...prev]); setShowAdd(false) }
  }

  async function updateStatus(id: string, status: BidStatus) {
    await supabase.from('bids').update({ status }).eq('id', id)
    setBids(prev => prev.map(b => b.id === id ? { ...b, status } : b))
  }

  async function deleteBid(id: string) {
    await supabase.from('bids').delete().eq('id', id)
    setBids(prev => prev.filter(b => b.id !== id))
  }

  // Stats
  const active   = bids.filter(b => !['won','lost'].includes(b.status))
  const won      = bids.filter(b => b.status === 'won')
  const pipeline = active.reduce((s, b) => s + (b.bid_value || 0), 0)
  const winRate  = bids.length > 0 ? Math.round((won.length / bids.filter(b => b.status === 'won' || b.status === 'lost').length || 0) * 100) : 0
  const urgent   = active.filter(b => { const d = daysUntil(b.due_date); return d !== null && d <= 3 && d >= 0 })

  const filtered = filter === 'all' ? bids : bids.filter(b => b.status === filter)

  // Group by status for pipeline view
  const byStatus = (status: BidStatus) => bids.filter(b => b.status === status)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        .bid-tab { background: none; border: none; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 500; padding: 8px 16px; border-radius: 7px; transition: all 0.15s; }
        .bid-tab.active { background: rgba(255,107,31,0.1); color: #FF6B1F; }
        .bid-tab:not(.active) { color: #7B8497; }
        .bid-tab:not(.active):hover { color: #F1EEE5; background: rgba(255,255,255,0.04); }
        .filter-btn { background: none; border: 1px solid #1C2333; cursor: pointer; font-family: inherit; font-size: 11px; padding: 5px 12px; border-radius: 6px; transition: all 0.15s; white-space: nowrap; }
        .filter-btn.active { border-color: #FF6B1F; color: #FF6B1F; background: rgba(255,107,31,0.08); }
        .filter-btn:not(.active) { color: #7B8497; }
        .filter-btn:not(.active):hover { border-color: #232E42; color: #F1EEE5; }
        .col-header { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #3D4558; text-transform: uppercase; letter-spacing: 0.14em; padding: 0 0 10px; display: flex; align-items: center; gap: 6px; }
        .col-count { background: #1C2333; color: #7B8497; font-size: 9px; padding: 1px 6px; border-radius: 99px; font-weight: 600; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.orange, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Daily Work</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: '-0.5px', marginBottom: 4 }}>BidIQ</h1>
            <p style={{ fontSize: 13, color: C.muted }}>Track every bid. Know every status. Miss nothing.</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: C.orange, color: 'white', fontFamily: 'inherit', flexShrink: 0 }}
          >
            + Add Bid
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label="Active Bids"     value={String(active.length)}   sub={`${bids.length} total`} />
          <StatCard label="Pipeline Value"  value={fmt$(pipeline)}           sub="active bids" color={C.orange} />
          <StatCard label="Win Rate"        value={winRate ? `${winRate}%` : '—'} sub={`${won.length} won`} color={C.green} />
          <StatCard label="Due Soon"        value={String(urgent.length)}    sub="within 3 days" color={urgent.length > 0 ? C.red : C.muted} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          <button className={`bid-tab ${tab === 'pipeline' ? 'active' : ''}`} onClick={() => setTab('pipeline')}>Pipeline</button>
          <button className={`bid-tab ${tab === 'score' ? 'active' : ''}`} onClick={() => setTab('score')}>AI Scorer</button>
        </div>
      </div>

      {/* PIPELINE TAB */}
      {tab === 'pipeline' && (
        <>
          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              All ({bids.length})
            </button>
            {STATUSES.map(s => (
              <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                {STATUS[s].label} ({bids.filter(b => b.status === s).length})
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>Loading bids...</div>
          ) : filter !== 'all' ? (
            /* List view when filtered */
            <div>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', border: `2px dashed ${C.border}`, borderRadius: 12 }}>
                  <div style={{ fontSize: 14, color: C.muted, marginBottom: 8 }}>No {STATUS[filter as BidStatus].label.toLowerCase()} bids</div>
                  <button onClick={() => setShowAdd(true)} style={{ fontSize: 12, color: C.orange, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Add one now</button>
                </div>
              ) : (
                filtered.map(bid => (
                  <BidCard key={bid.id} bid={bid} onStatusChange={updateStatus} onDelete={deleteBid} />
                ))
              )}
            </div>
          ) : (
            /* Kanban view */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, alignItems: 'start' }}>
              {STATUSES.map(status => (
                <div key={status}>
                  <div className="col-header">
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS[status].color, flexShrink: 0 }} />
                    {STATUS[status].label}
                    <span className="col-count">{byStatus(status).length}</span>
                  </div>
                  {byStatus(status).length === 0 ? (
                    <div style={{ border: `1px dashed ${C.border}`, borderRadius: 10, padding: '20px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: C.dim }}>Empty</div>
                    </div>
                  ) : (
                    byStatus(status).map(bid => (
                      <BidCard key={bid.id} bid={bid} onStatusChange={updateStatus} onDelete={deleteBid} />
                    ))
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && bids.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 24px', border: `2px dashed ${C.border}`, borderRadius: 14, marginTop: 8 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>No bids tracked yet</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
                Every bid you chase should be here. Add your first one and start tracking your pipeline.
              </div>
              <button onClick={() => setShowAdd(true)} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: C.orange, color: 'white', fontFamily: 'inherit' }}>
                Add Your First Bid
              </button>
            </div>
          )}
        </>
      )}

      {/* SCORE TAB */}
      {tab === 'score' && (
        <div style={{ maxWidth: 600 }}>
          <BidScoreDemo />
        </div>
      )}

      {/* Add modal */}
      {showAdd && <AddBidModal onClose={() => setShowAdd(false)} onSave={addBid} />}
    </>
  )
}
