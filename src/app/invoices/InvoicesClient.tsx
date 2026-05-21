'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface LineItem { description: string; qty: number; rate: number; amount: number }
interface Invoice {
  id: string; project_id: string; job_id: string | null; invoice_number: string
  client_name: string; client_email: string | null; status: 'draft' | 'sent' | 'paid' | 'overdue'
  issue_date: string; due_date: string; line_items: LineItem[]
  subtotal: number; tax_rate: number; tax_amount: number; total: number
  notes: string | null; created_at: string
}
interface Props {
  user: any; project: any; initialInvoices: Invoice[]
  jobs: { id: string; title: string; client_name: string; client_email: string; contract_value: number }[]
  approvedChanges: { id: string; title: string; cost_impact: number }[]
}

const STATUS_CONFIG = {
  draft:   { label: 'Draft',   bg: '#f1ede6', text: '#6b6a66', dot: '#9e9d99' },
  sent:    { label: 'Sent',    bg: '#eef3fb', text: '#0C447C', dot: '#1f5fa6' },
  paid:    { label: 'Paid',    bg: '#edf5f0', text: '#1a4d31', dot: '#2d7a4f' },
  overdue: { label: 'Overdue', bg: '#fdf0f0', text: '#6e1a1a', dot: '#b83232' },
}

function genNum() { return `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}` }

export function InvoicesClient({ user, project, initialInvoices, jobs, approvedChanges }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [showNew, setShowNew]   = useState(false)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState('')
  const [invoiceNum, setInvoiceNum] = useState(genNum())
  const [jobId, setJobId]           = useState(jobs[0]?.id || '')
  const [clientName, setClientName] = useState(jobs[0]?.client_name || '')
  const [clientEmail, setClientEmail] = useState(jobs[0]?.client_email || '')
  const [issueDate, setIssueDate]   = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate]       = useState(() => { const d = new Date(); d.setDate(d.getDate()+30); return d.toISOString().split('T')[0] })
  const [taxRate, setTaxRate]       = useState('0')
  const [notes, setNotes]           = useState('')
  const [lineItems, setLineItems]   = useState<LineItem[]>([{ description: '', qty: 1, rate: 0, amount: 0 }])

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }
  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0)
  const taxAmount = subtotal * (parseFloat(taxRate) / 100)
  const total = subtotal + taxAmount
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)

  function updateLine(idx: number, field: keyof LineItem, val: string | number) {
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: val }
      if (field === 'qty' || field === 'rate') updated.amount = Math.round((updated.qty * updated.rate) * 100) / 100
      return updated
    }))
  }

  function importChanges() {
    const lines = approvedChanges.map(c => ({ description: `Change Order: ${c.title}`, qty: 1, rate: Number(c.cost_impact), amount: Number(c.cost_impact) }))
    setLineItems(prev => [...prev, ...lines])
    msg(`v Imported ${lines.length} change orders`)
  }

  function onJobChange(id: string) {
    setJobId(id)
    const job = jobs.find(j => j.id === id)
    if (job) { setClientName(job.client_name || ''); setClientEmail(job.client_email || '') }
  }

  async function saveInvoice() {
    if (!project || !clientName.trim()) return
    setSaving(true)
    const validLines = lineItems.filter(l => l.description.trim())
    const { data, error } = await supabase.from('invoices').insert({
      project_id: project.id, user_id: user.id, job_id: jobId || null,
      invoice_number: invoiceNum, client_name: clientName.trim(), client_email: clientEmail.trim() || null,
      status: 'draft', issue_date: issueDate, due_date: dueDate,
      line_items: validLines, subtotal, tax_rate: parseFloat(taxRate) || 0, tax_amount: taxAmount, total,
      notes: notes.trim() || null,
    }).select().single()
    if (!error && data) {
      setInvoices(prev => [data as Invoice, ...prev])
      msg('v Invoice saved')
      setShowNew(false); setLineItems([{ description: '', qty: 1, rate: 0, amount: 0 }])
      setInvoiceNum(genNum()); setNotes('')
    } else msg('Failed to save')
    setSaving(false)
  }

  async function updateStatus(id: string, status: Invoice['status']) {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', id)
    if (!error) {
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
      msg(`v Marked as ${status}`)
    }
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice?')) return
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (!error) { setInvoices(prev => prev.filter(i => i.id !== id)); setSelected(null); msg('Deleted') }
  }

  function printInvoice(inv: Invoice) {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>${inv.invoice_number}</title><style>body{font-family:-apple-system,sans-serif;padding:48px;color:#0f0f0f;max-width:800px;margin:0 auto}h1{font-size:28px;font-weight:800;margin:0 0 4px}.meta{font-size:13px;color:#6b6a66}table{width:100%;border-collapse:collapse;margin:24px 0}th{text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9e9d99;padding:8px 12px;border-bottom:2px solid #e8e3da}td{padding:11px 12px;border-bottom:1px solid #f1ede6;font-size:14px}.total{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}.grand{border-top:2px solid #0f0f0f;padding-top:10px;font-size:18px;font-weight:800}@media print{body{padding:24px}}</style></head><body>
    <div style="display:flex;justify-content:space-between;margin-bottom:40px"><div><div style="font-size:20px;font-weight:800">ConstructIQ</div><div class="meta">${project?.name||''}</div></div><div style="text-align:right"><h1>${inv.invoice_number}</h1><div class="meta">Issued: ${format(parseISO(inv.issue_date),'MMMM d, yyyy')}</div><div class="meta">Due: ${format(parseISO(inv.due_date),'MMMM d, yyyy')}</div></div></div>
    <div style="margin-bottom:28px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9e9d99;margin-bottom:6px">Bill To</div><div style="font-size:16px;font-weight:700">${inv.client_name}</div>${inv.client_email?`<div class="meta">${inv.client_email}</div>`:''}</div>
    <table><thead><tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead><tbody>${inv.line_items.map(l=>`<tr><td>${l.description}</td><td style="text-align:right">${l.qty}</td><td style="text-align:right">$${l.rate.toLocaleString()}</td><td style="text-align:right;font-weight:600">$${l.amount.toLocaleString()}</td></tr>`).join('')}</tbody></table>
    <div style="display:flex;justify-content:flex-end"><div style="width:260px"><div class="total"><span>Subtotal</span><span>$${inv.subtotal.toLocaleString()}</span></div>${inv.tax_rate>0?`<div class="total"><span>Tax (${inv.tax_rate}%)</span><span>$${inv.tax_amount.toLocaleString()}</span></div>`:''}<div class="total grand"><span>Total Due</span><span style="color:#d95f2b">$${inv.total.toLocaleString()}</span></div></div></div>
    ${inv.notes?`<div style="margin-top:28px;padding:14px;background:#f8f7f4;border-radius:8px;font-size:13px;color:#6b6a66"><strong>Notes:</strong> ${inv.notes}</div>`:''}
    <script>window.onload=()=>window.print()</script></body></html>`)
    win.document.close()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#0f0f0f' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: 40 }}>$</div><a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13 }}>Create a project first</a></div>

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div><div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Invoices</div><div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Create, send, and track invoices  get paid faster</div></div>
        <button onClick={() => setShowNew(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showNew ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>{showNew ? 'x Cancel' : '+ New Invoice'}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Invoiced', value: `$${totalInvoiced.toLocaleString()}`, sub: `${invoices.length} invoices`, accent: '' },
          { label: 'Collected', value: `$${totalPaid.toLocaleString()}`, sub: `${invoices.filter(i=>i.status==='paid').length} paid`, accent: '#2d7a4f' },
          { label: 'Outstanding', value: `$${(totalInvoiced-totalPaid).toLocaleString()}`, sub: `${invoices.filter(i=>['sent','overdue'].includes(i.status)).length} open`, accent: totalInvoiced-totalPaid > 0 ? '#b06e1a' : '' },
          { label: 'Overdue', value: invoices.filter(i=>i.status==='overdue').length, sub: 'need follow-up', accent: invoices.filter(i=>i.status==='overdue').length > 0 ? '#b83232' : '' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.accent || '#0f0f0f', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || '#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {showNew && (
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 28, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>New Invoice</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={lbl}>Invoice #</label><input style={inp} value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)} /></div>
            <div><label style={lbl}>Issue Date</label><input type="date" style={inp} value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
            <div><label style={lbl}>Due Date</label><input type="date" style={inp} value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div><label style={lbl}>Job</label>
              <select style={{ ...inp, background: 'white' }} value={jobId} onChange={e => onJobChange(e.target.value)}>
                <option value="">No specific job</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Bill To *</label><input style={inp} placeholder="Client name" value={clientName} onChange={e => setClientName(e.target.value)} /></div>
            <div><label style={lbl}>Client Email</label><input type="email" style={inp} placeholder="client@email.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} /></div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Line Items</div>
              {approvedChanges.length > 0 && <button onClick={importChanges} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit', color: '#1f5fa6' }}>+ Import {approvedChanges.length} Change Order{approvedChanges.length !== 1 ? 's' : ''}</button>}
            </div>
            <div style={{ background: '#f8f7f4', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 70px 100px 100px 36px', padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                {['Description','Qty','Rate ($)','Amount',''].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</div>)}
              </div>
              {lineItems.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 70px 100px 100px 36px', padding: '5px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)', alignItems: 'center' }}>
                  <input style={{ ...inp, background: 'transparent', border: 'none', padding: '6px 0' }} placeholder="Description..." value={item.description} onChange={e => updateLine(idx, 'description', e.target.value)} />
                  <input type="number" style={{ ...inp, background: 'transparent', border: 'none', padding: '6px 4px', textAlign: 'right' }} min="0" step="0.5" value={item.qty} onChange={e => updateLine(idx, 'qty', parseFloat(e.target.value)||0)} />
                  <input type="number" style={{ ...inp, background: 'transparent', border: 'none', padding: '6px 4px', textAlign: 'right' }} min="0" step="0.01" value={item.rate} onChange={e => updateLine(idx, 'rate', parseFloat(e.target.value)||0)} />
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, paddingRight: 8 }}>${item.amount.toLocaleString()}</div>
                  <button onClick={() => setLineItems(prev => prev.filter((_,i) => i !== idx))} disabled={lineItems.length === 1} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9e9d99', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}></button>
                </div>
              ))}
              <div style={{ padding: '8px 12px' }}>
                <button onClick={() => setLineItems(prev => [...prev, { description: '', qty: 1, rate: 0, amount: 0 }])} style={{ fontSize: 12, fontWeight: 600, color: '#d95f2b', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add line</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <div style={{ width: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}><span style={{ color: '#6b6a66' }}>Subtotal</span><span style={{ fontWeight: 600 }}>${subtotal.toLocaleString()}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                <span style={{ fontSize: 13, color: '#6b6a66', flex: 1 }}>Tax %</span>
                <input type="number" style={{ ...inp, width: 72, padding: '4px 8px', textAlign: 'right' }} min="0" max="100" step="0.1" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
                <span style={{ fontSize: 13, fontWeight: 600, width: 80, textAlign: 'right' }}>${taxAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 18, fontWeight: 800, borderTop: '2px solid #0f0f0f', marginTop: 4 }}>
                <span>Total</span><span style={{ color: '#d95f2b' }}>${total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}><label style={lbl}>Notes</label><textarea style={{ ...inp, resize: 'none' }} rows={2} placeholder="Payment due within 30 days..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveInvoice} disabled={saving} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>{saving ? 'Saving...' : 'Save Invoice'}</button>
            <button onClick={() => setShowNew(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {invoices.length === 0 && !showNew ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'white', borderRadius: 16, border: '2px dashed rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>$</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No invoices yet</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 20 }}>Create professional invoices and track what you're owed</div>
          <button onClick={() => setShowNew(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Create First Invoice</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {invoices.map(inv => {
            const sc = STATUS_CONFIG[inv.status]
            const job = jobs.find(j => j.id === inv.job_id)
            return (
              <div key={inv.id} onClick={() => setSelected(inv === selected ? null : inv)} style={{ background: 'white', border: `1.5px solid ${selected?.id === inv.id ? '#0f0f0f' : 'rgba(0,0,0,0.07)'}`, borderRadius: 14, padding: '16px 20px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{inv.invoice_number}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: sc.bg, color: sc.text }}>{sc.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#6b6a66' }}>{inv.client_name}{job ? `  ${job.title}` : ''}</div>
                    <div style={{ fontSize: 11, color: '#9e9d99', marginTop: 2 }}>Issued {format(parseISO(inv.issue_date), 'MMM d')}  Due {format(parseISO(inv.due_date), 'MMM d, yyyy')}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>${inv.total.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: '#9e9d99' }}>{inv.line_items.length} items</div>
                  </div>
                </div>
                {selected?.id === inv.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ background: '#f8f7f4', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                      {inv.line_items.map((l, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: i < inv.line_items.length-1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                          <span>{l.description}</span><span style={{ fontWeight: 600 }}>${l.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, marginTop: 8, paddingTop: 8, borderTop: '2px solid rgba(0,0,0,0.1)' }}>
                        <span>Total</span><span style={{ color: '#d95f2b' }}>${inv.total.toLocaleString()}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      {(['draft','sent','paid','overdue'] as const).filter(s => s !== inv.status).map(s => (
                        <button key={s} onClick={e => { e.stopPropagation(); updateStatus(inv.id, s) }} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: `1px solid ${STATUS_CONFIG[s].dot}30`, background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].text, fontFamily: 'inherit' }}>Mark as {STATUS_CONFIG[s].label}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={e => { e.stopPropagation(); printInvoice(inv) }} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}> Print / PDF</button>
                      <button onClick={e => { e.stopPropagation(); deleteInvoice(inv.id) }} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit' }}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>{toast}</div>}
    </>
  )
}
