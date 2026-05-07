'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface Material {
  id: string
  project_id: string
  job_id: string | null
  name: string
  description: string | null
  quantity: number
  unit: string
  unit_cost: number | null
  total_cost: number | null
  supplier: string | null
  status: 'needed' | 'ordered' | 'delivered' | 'installed' | 'returned'
  order_date: string | null
  delivery_date: string | null
  actual_delivery: string | null
  flagged: boolean
  notes: string | null
  created_at: string
}

interface Props {
  user: any
  project: any
  initialMaterials: Material[]
  jobs: { id: string; title: string }[]
}

const STATUS_CONFIG = {
  needed:    { label: 'Needed',    bg: '#fdf4e3', text: '#6b4010', dot: '#EF9F27' },
  ordered:   { label: 'Ordered',   bg: '#eef3fb', text: '#0C447C', dot: '#378ADD' },
  delivered: { label: 'Delivered', bg: '#edf5f0', text: '#1a4d31', dot: '#2d7a4f' },
  installed: { label: 'Installed', bg: '#f1ede6', text: '#6b6a66', dot: '#9e9d99' },
  returned:  { label: 'Returned',  bg: '#fdf0f0', text: '#6e1a1a', dot: '#b83232' },
}

const UNITS = ['each', 'ft', 'lf', 'sf', 'box', 'roll', 'bundle', 'lb', 'bag', 'gal', 'set', 'lot']

export function MaterialsClient({ user, project, initialMaterials, jobs }: Props) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [showAdd, setShowAdd]     = useState(false)
  const [selected, setSelected]   = useState<Material | null>(null)
  const [toast, setToast]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterJob, setFilterJob] = useState('all')

  // Form
  const [name, setName]             = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity]     = useState('1')
  const [unit, setUnit]             = useState('each')
  const [unitCost, setUnitCost]     = useState('')
  const [supplier, setSupplier]     = useState('')
  const [jobId, setJobId]           = useState(jobs[0]?.id || '')
  const [orderDate, setOrderDate]   = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes]           = useState('')
  const [flagged, setFlagged]       = useState(false)

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const totalCost = materials.reduce((s, m) => s + (m.total_cost || 0), 0)
  const needed = materials.filter(m => m.status === 'needed').length
  const ordered = materials.filter(m => m.status === 'ordered').length
  const flaggedCount = materials.filter(m => m.flagged).length
  const qty = parseFloat(quantity) || 0
  const cost = parseFloat(unitCost) || 0
  const totalPreview = qty * cost

  const filtered = materials
    .filter(m => filterStatus === 'all' || m.status === filterStatus)
    .filter(m => filterJob === 'all' || m.job_id === filterJob)

  async function addMaterial(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !name.trim()) return
    setSaving(true)

    const { data, error } = await supabase.from('materials').insert({
      project_id: project.id,
      user_id: user.id,
      job_id: jobId || null,
      name: name.trim(),
      description: description.trim() || null,
      quantity: qty,
      unit,
      unit_cost: cost || null,
      total_cost: totalPreview || null,
      supplier: supplier.trim() || null,
      status: 'needed',
      order_date: orderDate || null,
      delivery_date: deliveryDate || null,
      flagged,
      notes: notes.trim() || null,
    }).select().single()

    if (!error && data) {
      setMaterials(prev => [data as Material, ...prev])
      msg(`✓ ${name} added`)
      setName(''); setDescription(''); setQuantity('1'); setUnitCost('')
      setSupplier(''); setOrderDate(''); setDeliveryDate(''); setNotes('')
      setFlagged(false); setShowAdd(false)
    } else msg('Failed to save')
    setSaving(false)
  }

  async function updateStatus(id: string, newStatus: Material['status']) {
    const updates: any = { status: newStatus }
    if (newStatus === 'delivered') updates.actual_delivery = new Date().toISOString().split('T')[0]

    const { error } = await supabase.from('materials').update(updates).eq('id', id)
    if (!error) {
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...updates } : null)
      msg(`✓ ${STATUS_CONFIG[newStatus].label}`)
    }
  }

  async function toggleFlag(id: string, current: boolean) {
    const { error } = await supabase.from('materials').update({ flagged: !current }).eq('id', id)
    if (!error) {
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, flagged: !current } : m))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, flagged: !current } : null)
    }
  }

  async function deleteMaterial(id: string) {
    if (!confirm('Delete this material?')) return
    const { error } = await supabase.from('materials').delete().eq('id', id)
    if (!error) { setMaterials(prev => prev.filter(m => m.id !== id)); setSelected(null); msg('Deleted') }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#0f0f0f' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Materials</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Track every material — ordered, delivered, installed</div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showAdd ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showAdd ? '✕ Cancel' : '+ Add Material'}
        </button>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Cost', value: `$${totalCost.toLocaleString()}`, sub: `${materials.length} items`, accent: '' },
          { label: 'Still Needed', value: needed, sub: 'not yet ordered', accent: needed > 0 ? '#b06e1a' : '' },
          { label: 'On Order', value: ordered, sub: 'awaiting delivery', accent: ordered > 0 ? '#1f5fa6' : '' },
          { label: 'Flagged', value: flaggedCount, sub: 'need attention', accent: flaggedCount > 0 ? '#b83232' : '' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px', color: s.accent || '#0f0f0f', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || '#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ADD FORM */}
      {showAdd && (
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Add Material</div>
          <form onSubmit={addMaterial} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Material Name *</label>
                <input style={inp} placeholder="e.g. 12/2 Romex Wire" value={name} onChange={e => setName(e.target.value)} required autoFocus />
              </div>
              <div>
                <label style={lbl}>Job</label>
                <select style={{ ...inp, background: 'white' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                  <option value="">No specific job</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Quantity</label>
                <input type="number" style={inp} min="0" step="0.5" value={quantity} onChange={e => setQuantity(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Unit</label>
                <select style={{ ...inp, background: 'white' }} value={unit} onChange={e => setUnit(e.target.value)}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Unit Cost ($)</label>
                <input type="number" style={inp} placeholder="0.00" min="0" step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Total</label>
                <div style={{ ...inp, background: '#f1ede6', fontWeight: 700, color: totalPreview > 0 ? '#d95f2b' : '#9e9d99' }}>
                  {totalPreview > 0 ? `$${totalPreview.toLocaleString()}` : '—'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Supplier</label>
                <input style={inp} placeholder="Home Depot, Ferguson..." value={supplier} onChange={e => setSupplier(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Order Date</label>
                <input type="date" style={inp} value={orderDate} onChange={e => setOrderDate(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Expected Delivery</label>
                <input type="date" style={inp} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={lbl}>Notes</label>
              <input style={inp} placeholder="Specs, model numbers, special instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: flagged ? '#fdf0f0' : '#f8f7f4', borderRadius: 10, cursor: 'pointer' }} onClick={() => setFlagged(v => !v)}>
              <input type="checkbox" checked={flagged} onChange={() => setFlagged(v => !v)} style={{ width: 16, height: 16, accentColor: '#b83232', cursor: 'pointer' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: flagged ? '#b83232' : '#6b6a66' }}>🚩 Flag this item — delayed, missing, or needs follow-up</span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving || !name.trim()} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : 'Add Material'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#f8f7f4', borderRadius: 10, padding: 4 }}>
          {['all', ...Object.keys(STATUS_CONFIG)].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '6px 12px', fontSize: 12, fontWeight: filterStatus === s ? 700 : 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filterStatus === s ? 'white' : 'transparent', color: filterStatus === s ? '#0f0f0f' : '#9e9d99', boxShadow: filterStatus === s ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
              {s === 'all' ? `All (${materials.length})` : `${STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label} (${materials.filter(m=>m.status===s).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* MATERIALS LIST */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'white', borderRadius: 16, border: '2px dashed rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{materials.length === 0 ? 'No materials tracked yet' : 'No results'}</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 20 }}>Track materials to prevent delays from missing supplies</div>
          {materials.length === 0 && <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Add First Material</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(mat => {
            const sc = STATUS_CONFIG[mat.status]
            const job = jobs.find(j => j.id === mat.job_id)
            return (
              <div key={mat.id} onClick={() => setSelected(mat === selected ? null : mat)} style={{ background: 'white', border: `1.5px solid ${mat.flagged ? 'rgba(184,50,50,0.3)' : selected?.id === mat.id ? '#0f0f0f' : 'rgba(0,0,0,0.07)'}`, borderRadius: 12, padding: '14px 18px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📦</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{mat.name}</span>
                      {mat.flagged && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#fdf0f0', color: '#b83232' }}>🚩</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#9e9d99' }}>
                      {mat.quantity} {mat.unit}
                      {mat.supplier ? ` · ${mat.supplier}` : ''}
                      {job ? ` · ${job.title}` : ''}
                      {mat.delivery_date ? ` · Expected ${format(parseISO(mat.delivery_date), 'MMM d')}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {mat.total_cost && <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>${mat.total_cost.toLocaleString()}</div>}
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text }}>{sc.label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* DETAIL PANEL */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 400, background: 'white', borderLeft: '1px solid rgba(0,0,0,0.08)', boxShadow: '-12px 0 48px rgba(0,0,0,0.15)', zIndex: 100, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: '#9e9d99' }}>{selected.quantity} {selected.unit}{selected.supplier ? ` · ${selected.supplier}` : ''}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: '#f8f7f4', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9d99' }}>×</button>
            </div>

            {selected.total_cost && (
              <div style={{ background: '#0f0f0f', borderRadius: 12, padding: 16, marginBottom: 16, color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Total Cost</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#d95f2b' }}>${selected.total_cost.toLocaleString()}</div>
                {selected.unit_cost && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>${selected.unit_cost} per {selected.unit}</div>}
              </div>
            )}

            <div style={{ background: '#f8f7f4', borderRadius: 11, padding: 14, marginBottom: 16, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selected.description && <div><span style={{ color: '#9e9d99' }}>Description: </span>{selected.description}</div>}
              {selected.supplier && <div><span style={{ color: '#9e9d99' }}>Supplier: </span>{selected.supplier}</div>}
              {selected.order_date && <div><span style={{ color: '#9e9d99' }}>Ordered: </span>{format(parseISO(selected.order_date), 'MMM d, yyyy')}</div>}
              {selected.delivery_date && <div><span style={{ color: '#9e9d99' }}>Expected: </span>{format(parseISO(selected.delivery_date), 'MMM d, yyyy')}</div>}
              {selected.actual_delivery && <div><span style={{ color: '#9e9d99' }}>Delivered: </span>{format(parseISO(selected.actual_delivery), 'MMM d, yyyy')}</div>}
              {selected.notes && <div><span style={{ color: '#9e9d99' }}>Notes: </span>{selected.notes}</div>}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Update Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 }}>
              {(Object.keys(STATUS_CONFIG) as Material['status'][]).map(s => {
                const cfg = STATUS_CONFIG[s]
                const active = selected.status === s
                return (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${active ? cfg.dot : 'rgba(0,0,0,0.07)'}`, background: active ? cfg.bg : 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot }} />
                    <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? cfg.text : '#6b6a66', flex: 1 }}>{cfg.label}</span>
                    {active && <span style={{ color: cfg.dot }}>✓</span>}
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => toggleFlag(selected.id, selected.flagged)} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: `1px solid ${selected.flagged ? 'rgba(184,50,50,0.2)' : 'rgba(0,0,0,0.1)'}`, background: selected.flagged ? '#fdf0f0' : 'white', color: selected.flagged ? '#b83232' : '#6b6a66', fontFamily: 'inherit' }}>
                {selected.flagged ? '🚩 Unflag' : '🚩 Flag'}
              </button>
              <button onClick={() => deleteMaterial(selected.id)} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit' }}>
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: selected ? 424 : 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
          {toast}
        </div>
      )}
    </>
  )
}
