'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface Drawing {
  id: string; project_id: string; drawing_number: string; title: string
  discipline: string; revision: string; revision_date: string
  received_date: string; issued_by: string
  status: 'current' | 'superseded' | 'for_review' | 'approved' | 'void'
  file_path: string | null; ai_analysis: any; ai_notes: string | null
  changes_from_previous: string | null; scope_impacts: string[]
  rfi_required: boolean; created_at: string
}
interface Props { user: any; project: any; initialDrawings: Drawing[] }

const DISCIPLINES = [
  { id:'E', label:'Electrical', color:'#ea580c' },
  { id:'P', label:'Plumbing',   color:'#3b82f6' },
  { id:'M', label:'Mechanical', color:'#8b5cf6' },
  { id:'S', label:'Structural', color:'#22c55e' },
  { id:'A', label:'Architectural', color:'#f59e0b' },
  { id:'FP',label:'Fire Protection', color:'#ef4444' },
  { id:'C', label:'Civil',      color:'#6b7280' },
]

const STATUS_CFG: Record<string, { label:string; color:string; bg:string }> = {
  current:    { label:'Current',    color:'#22c55e', bg:'#f0fdf4' },
  for_review: { label:'For Review', color:'#f59e0b', bg:'#fffbeb' },
  approved:   { label:'Approved',   color:'#3b82f6', bg:'#eff6ff' },
  superseded: { label:'Superseded', color:'#9ca3af', bg:'#f9fafb' },
  void:       { label:'Void',       color:'#ef4444', bg:'#fef2f2' },
}

export function DrawingLogClient({ user, project, initialDrawings }: Props) {
  const [drawings, setDrawings]     = useState<Drawing[]>(initialDrawings)
  const [showForm, setShowForm]     = useState(false)
  const [selected, setSelected]     = useState<Drawing | null>(null)
  const [analyzing, setAnalyzing]   = useState<string | null>(null)
  const [filterDisc, setFilterDisc] = useState('all')
  const [toast, setToast]           = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    drawing_number:'', title:'', discipline:'E', revision:'A',
    revision_date: new Date().toISOString().split('T')[0],
    received_date: new Date().toISOString().split('T')[0],
    issued_by:'', status:'current' as const,
    changes_from_previous:'', rfi_required:false,
  })

  function msg(t:string){ setToast(t); setTimeout(()=>setToast(''),4000) }

  const inp:React.CSSProperties = { width:'100%', padding:'9px 12px', fontSize:13, border:'1.5px solid #e5e7eb', borderRadius:9, fontFamily:'inherit', outline:'none', background:'#f9fafb', color:'#111827', boxSizing:'border-box' as const }
  const lbl:React.CSSProperties = { fontSize:11, fontWeight:700, color:'#6b7280', display:'block', marginBottom:5, textTransform:'uppercase' as const, letterSpacing:'0.4px' }

  async function saveDrawing() {
    if (!project || !form.drawing_number.trim() || !form.title.trim()) { msg('Drawing number and title required'); return }
    const { data:{ user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data, error } = await supabase.from('drawing_logs').insert({
      project_id: project.id, user_id: authUser.id,
      drawing_number: form.drawing_number.trim(), title: form.title.trim(),
      discipline: form.discipline, revision: form.revision.trim(),
      revision_date: form.revision_date, received_date: form.received_date,
      issued_by: form.issued_by.trim(), status: form.status,
      changes_from_previous: form.changes_from_previous.trim() || null,
      rfi_required: form.rfi_required, scope_impacts: [],
    }).select().single()

    if (error) { msg('Failed to save'); return }
    setDrawings(prev => [data as Drawing, ...prev])
    setShowForm(false)
    setForm({ drawing_number:'', title:'', discipline:'E', revision:'A', revision_date:new Date().toISOString().split('T')[0], received_date:new Date().toISOString().split('T')[0], issued_by:'', status:'current', changes_from_previous:'', rfi_required:false })
    msg('✓ Drawing logged')
  }

  async function uploadAndAnalyze(drawing: Drawing, file: File) {
    if (!project) return
    setAnalyzing(drawing.id)
    msg('Uploading and analyzing with AI...')
    try {
      const filePath = `${project.id}/drawings/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g,'_')}`
      const { error: upErr } = await supabase.storage.from('documents').upload(filePath, file)
      if (upErr) throw new Error(upErr.message)
      await supabase.from('drawing_logs').update({ file_path: filePath }).eq('id', drawing.id)

      // Insert into documents table so parse-document can process it
      const { data: docRecord } = await supabase.from('documents').insert({
        project_id: project.id, user_id: user.id,
        name: file.name, file_path: filePath,
        file_type: file.type, file_size: file.size,
        doc_type: 'blueprint', status: 'processing',
      }).select().single()

      if (docRecord) {
        const res = await fetch('/api/parse-document', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ document_id: docRecord.id, project_id: project.id }),
        })
        const json = await res.json()
        if (json.success && docRecord) {
          const { data: parsed } = await supabase.from('documents').select('extracted_data, ai_notes').eq('id', docRecord.id).single()
          if (parsed) {
            await supabase.from('drawing_logs').update({
              ai_analysis: parsed.extracted_data,
              ai_notes: parsed.ai_notes,
            }).eq('id', drawing.id)
            setDrawings(prev => prev.map(d => d.id === drawing.id ? { ...d, ai_analysis: parsed.extracted_data, ai_notes: parsed.ai_notes } : d))
            if (selected?.id === drawing.id) setSelected(prev => prev ? { ...prev, ai_analysis: parsed.extracted_data, ai_notes: parsed.ai_notes } : null)
          }
        }
        msg('✓ AI blueprint analysis complete')
      }
    } catch (err:any) { msg(`Error: ${err.message}`) }
    setAnalyzing(null)
  }

  async function deleteDrawing(id:string) {
    if (!confirm('Delete this drawing log?')) return
    await supabase.from('drawing_logs').delete().eq('id', id)
    setDrawings(prev => prev.filter(d => d.id !== id))
    if (selected?.id === id) setSelected(null)
    msg('Deleted')
  }

  const filtered = filterDisc === 'all' ? drawings : drawings.filter(d => d.discipline === filterDisc)
  const rfisNeeded = drawings.filter(d => d.rfi_required).length
  const ed = selected?.ai_analysis

  if (!project) return (
    <div style={{ textAlign:'center', padding:80 }}>
      <div style={{ fontSize:48, marginBottom:12 }}>📐</div>
      <div style={{ fontSize:18, fontWeight:700 }}>Create a project first</div>
    </div>
  )

  return (
    <>
      {/* HEADER */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, gap:12, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px' }}>Drawing Log</div>
          <div style={{ fontSize:13, color:'#6b7280', marginTop:2 }}>Track every drawing revision — AI reads blueprints and flags scope changes</div>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', fontSize:13, fontWeight:700, borderRadius:10, cursor:'pointer', border:'none', background:'#ea580c', color:'white', fontFamily:'inherit' }}>
          + Log Drawing
        </button>
      </div>

      {/* STATS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'Total', value:drawings.length, icon:'📐' },
          { label:'Current', value:drawings.filter(d=>d.status==='current').length, icon:'✅' },
          { label:'Superseded', value:drawings.filter(d=>d.status==='superseded').length, icon:'📁' },
          { label:'RFIs Needed', value:rfisNeeded, icon:'⚠️', alert: rfisNeeded > 0 },
        ].map(s => (
          <div key={s.label} style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:'13px 16px' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color: (s as any).alert ? '#ef4444' : '#111827', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:16 }}>{s.icon}</span>{s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ADD FORM */}
      {showForm && (
        <div style={{ background:'white', border:'1.5px solid #e5e7eb', borderRadius:16, padding:24, marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>Log New Drawing</div>
            <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:20, lineHeight:1 }}>×</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:14 }}>
            <div><label style={lbl}>Drawing Number *</label><input style={inp} placeholder="E-101, P-201..." value={form.drawing_number} onChange={e=>setForm(f=>({...f,drawing_number:e.target.value}))} /></div>
            <div><label style={lbl}>Title *</label><input style={inp} placeholder="First Floor Electrical Plan" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} /></div>
            <div><label style={lbl}>Discipline</label>
              <select style={{...inp}} value={form.discipline} onChange={e=>setForm(f=>({...f,discipline:e.target.value}))}>
                {DISCIPLINES.map(d=><option key={d.id} value={d.id}>{d.id} — {d.label}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Revision</label><input style={inp} placeholder="A, B, 0, 1..." value={form.revision} onChange={e=>setForm(f=>({...f,revision:e.target.value}))} /></div>
            <div><label style={lbl}>Revision Date</label><input type="date" style={inp} value={form.revision_date} onChange={e=>setForm(f=>({...f,revision_date:e.target.value}))} /></div>
            <div><label style={lbl}>Received Date</label><input type="date" style={inp} value={form.received_date} onChange={e=>setForm(f=>({...f,received_date:e.target.value}))} /></div>
            <div><label style={lbl}>Issued By</label><input style={inp} placeholder="Turner / Smith Architects" value={form.issued_by} onChange={e=>setForm(f=>({...f,issued_by:e.target.value}))} /></div>
            <div><label style={lbl}>Status</label>
              <select style={{...inp}} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value as any}))}>
                {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>Changes from Previous Revision</label>
            <textarea style={{...inp,resize:'none'}} rows={2} placeholder="Panel location moved to column B-4. Added 20A circuit to break room..." value={form.changes_from_previous} onChange={e=>setForm(f=>({...f,changes_from_previous:e.target.value}))} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <input type="checkbox" id="rfi_req" checked={form.rfi_required} onChange={e=>setForm(f=>({...f,rfi_required:e.target.checked}))} style={{ width:16, height:16, accentColor:'#ea580c' }} />
            <label htmlFor="rfi_req" style={{ fontSize:13, color:'#374151', cursor:'pointer' }}>This revision requires an RFI before work can proceed</label>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={saveDrawing} style={{ padding:'10px 24px', fontSize:13, fontWeight:700, borderRadius:10, cursor:'pointer', border:'none', background:'#0a0a0a', color:'white', fontFamily:'inherit' }}>Save Drawing</button>
            <button onClick={()=>setShowForm(false)} style={{ padding:'10px 20px', fontSize:13, borderRadius:10, cursor:'pointer', border:'1px solid #e5e7eb', background:'white', color:'#6b7280', fontFamily:'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap:16, alignItems:'start' }}>

        {/* LEFT — LIST */}
        <div>
          {/* Discipline filter */}
          {drawings.length > 0 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
              <button onClick={()=>setFilterDisc('all')} style={{ padding:'4px 12px', fontSize:11, fontWeight:filterDisc==='all'?700:400, borderRadius:20, border:`1px solid ${filterDisc==='all'?'#111827':'#e5e7eb'}`, background:filterDisc==='all'?'#111827':'white', color:filterDisc==='all'?'white':'#6b7280', cursor:'pointer', fontFamily:'inherit' }}>
                All ({drawings.length})
              </button>
              {DISCIPLINES.map(d => {
                const count = drawings.filter(x=>x.discipline===d.id).length
                if (!count) return null
                const active = filterDisc === d.id
                return (
                  <button key={d.id} onClick={()=>setFilterDisc(d.id)} style={{ padding:'4px 12px', fontSize:11, fontWeight:active?700:400, borderRadius:20, border:`1px solid ${active?d.color:'#e5e7eb'}`, background:active?d.color:'white', color:active?'white':'#6b7280', cursor:'pointer', fontFamily:'inherit' }}>
                    {d.id} — {d.label} ({count})
                  </button>
                )
              })}
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', background:'white', borderRadius:14, border:'2px dashed #e5e7eb' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📐</div>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>No drawings logged yet</div>
              <div style={{ fontSize:13, color:'#6b7280', marginBottom:20, maxWidth:320, margin:'0 auto 20px' }}>
                Log every drawing you receive. When the GC issues a revision, log it here. Upload the PDF and AI reads it automatically.
              </div>
              <button onClick={()=>setShowForm(true)} style={{ padding:'10px 20px', fontSize:13, fontWeight:700, borderRadius:9, cursor:'pointer', border:'none', background:'#ea580c', color:'white', fontFamily:'inherit' }}>+ Log First Drawing</button>
            </div>
          ) : (
            <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:14, overflow:'hidden' }}>
              {/* Table header */}
              <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 80px 70px 100px 80px', padding:'10px 16px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                {['DWG #','Title','Disc','Rev','Received','Status'].map(h => (
                  <div key={h} style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</div>
                ))}
              </div>
              {filtered.map(d => {
                const st = STATUS_CFG[d.status]
                const disc = DISCIPLINES.find(x=>x.id===d.discipline)
                const isSel = selected?.id === d.id
                const isAnalyzing = analyzing === d.id
                return (
                  <div key={d.id} onClick={()=>setSelected(isSel?null:d)} style={{ display:'grid', gridTemplateColumns:'80px 1fr 80px 70px 100px 80px', padding:'12px 16px', borderBottom:'1px solid #f9fafb', cursor:'pointer', background: isSel ? '#fff7ed' : 'white', transition:'background 0.1s' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#111827', fontFamily:'monospace' }}>{d.drawing_number}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.title}</div>
                      {d.rfi_required && <div style={{ fontSize:10, fontWeight:700, color:'#ef4444', marginTop:2 }}>⚠️ RFI Required</div>}
                    </div>
                    <div>
                      <span style={{ fontSize:11, fontWeight:700, color: disc?.color || '#6b7280', background:`${disc?.color}15`, padding:'2px 8px', borderRadius:20 }}>{d.discipline}</span>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Rev {d.revision}</div>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{d.received_date ? format(parseISO(d.received_date),'MMM d, yyyy') : '—'}</div>
                    <div>
                      <span style={{ fontSize:10, fontWeight:700, color:st.color, background:st.bg, padding:'2px 8px', borderRadius:20 }}>{st.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT — DETAIL PANEL */}
        {selected && (
          <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', position:'sticky', top:20, maxHeight:'calc(100vh - 100px)', display:'flex', flexDirection:'column' }}>
            {/* Panel header */}
            <div style={{ padding:'14px 18px', borderBottom:'1px solid #f3f4f6', background:'#f9fafb', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#111827', marginBottom:2 }}>{selected.drawing_number} — Rev {selected.revision}</div>
                  <div style={{ fontSize:12, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selected.title}</div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={()=>deleteDrawing(selected.id)} style={{ padding:'5px 10px', fontSize:11, fontWeight:600, borderRadius:7, cursor:'pointer', border:'1px solid #fecaca', background:'#fef2f2', color:'#ef4444', fontFamily:'inherit' }}>Delete</button>
                  <button onClick={()=>setSelected(null)} style={{ width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:7, cursor:'pointer', border:'1px solid #e5e7eb', background:'white', color:'#6b7280', fontSize:16, lineHeight:1 }}>×</button>
                </div>
              </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'16px 18px' }}>

              {/* Drawing info */}
              <div style={{ background:'#f9fafb', borderRadius:10, padding:'4px 12px', marginBottom:14 }}>
                {[
                  { label:'Discipline', value: DISCIPLINES.find(x=>x.id===selected.discipline)?.label || selected.discipline },
                  { label:'Status', value: STATUS_CFG[selected.status]?.label },
                  { label:'Issued By', value: selected.issued_by || '—' },
                  { label:'Revision Date', value: selected.revision_date ? format(parseISO(selected.revision_date),'MMM d, yyyy') : '—' },
                  { label:'Received', value: selected.received_date ? format(parseISO(selected.received_date),'MMM d, yyyy') : '—' },
                ].map(f => (
                  <div key={f.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f3f4f6', fontSize:12 }}>
                    <span style={{ color:'#6b7280' }}>{f.label}</span>
                    <span style={{ fontWeight:600, color:'#111827' }}>{f.value}</span>
                  </div>
                ))}
              </div>

              {/* Changes from previous */}
              {selected.changes_from_previous && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Changes from Previous Rev</div>
                  <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:9, padding:'10px 13px', fontSize:13, color:'#92400e', lineHeight:1.5 }}>
                    {selected.changes_from_previous}
                  </div>
                </div>
              )}

              {/* RFI flag */}
              {selected.rfi_required && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderLeft:'3px solid #ef4444', borderRadius:9, padding:'10px 13px', fontSize:12, fontWeight:600, color:'#991b1b', marginBottom:14 }}>
                  ⚠️ An RFI is required before work proceeds on this drawing
                </div>
              )}

              {/* Upload + AI analysis */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>AI Blueprint Analysis</div>

                {!selected.ai_notes && !analyzing && (
                  <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'14px 16px', textAlign:'center' }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#1e40af', marginBottom:8 }}>Upload the drawing file for AI analysis</div>
                    <div style={{ fontSize:12, color:'#3b82f6', marginBottom:12 }}>AI will read the blueprint and find scope gaps, code issues, and RFI candidates</div>
                    <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style={{ display:'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndAnalyze(selected, f); e.target.value='' }} />
                    <button onClick={()=>fileRef.current?.click()} style={{ padding:'8px 18px', fontSize:12, fontWeight:700, borderRadius:8, cursor:'pointer', border:'none', background:'#1e40af', color:'white', fontFamily:'inherit' }}>
                      Upload Drawing (PDF or Image)
                    </button>
                  </div>
                )}

                {analyzing === selected.id && (
                  <div style={{ background:'#eff6ff', borderRadius:10, padding:'14px 16px', textAlign:'center' }}>
                    <div style={{ width:24, height:24, border:'2px solid #3b82f6', borderTopColor:'transparent', borderRadius:'50%', margin:'0 auto 10px', animation:'spin 0.7s linear infinite' }} />
                    <div style={{ fontSize:13, fontWeight:600, color:'#1e40af' }}>AI reading blueprint...</div>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </div>
                )}

                {selected.ai_notes && (
                  <>
                    {/* AI Summary */}
                    <div style={{ background:'#0a0a0a', borderRadius:10, padding:'13px 15px', marginBottom:10 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>✨ AI Summary</div>
                      <div style={{ fontSize:13, color:'rgba(255,255,255,0.85)', lineHeight:1.6 }}>{selected.ai_notes}</div>
                    </div>

                    {/* Re-analyze button */}
                    <div style={{ marginBottom:10 }}>
                      <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style={{ display:'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndAnalyze(selected, f); e.target.value='' }} />
                      <button onClick={()=>fileRef.current?.click()} style={{ fontSize:11, fontWeight:600, color:'#6b7280', background:'none', border:'1px solid #e5e7eb', borderRadius:7, padding:'5px 12px', cursor:'pointer', fontFamily:'inherit' }}>↑ Upload new revision</button>
                    </div>

                    {/* Extracted analysis */}
                    {ed && (
                      <>
                        {ed.rfi_candidates?.length > 0 && (
                          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'12px 14px', marginBottom:10 }}>
                            <div style={{ fontSize:11, fontWeight:700, color:'#1e40af', marginBottom:8 }}>📋 RFI Candidates ({ed.rfi_candidates.length})</div>
                            {ed.rfi_candidates.map((r:string, i:number) => <div key={i} style={{ fontSize:12, color:'#1e40af', marginBottom:4, lineHeight:1.4 }}>• {r}</div>)}
                          </div>
                        )}
                        {ed.scope_gaps?.length > 0 && (
                          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'12px 14px', marginBottom:10 }}>
                            <div style={{ fontSize:11, fontWeight:700, color:'#92400e', marginBottom:8 }}>⚠️ Scope Gaps</div>
                            {ed.scope_gaps.map((g:string, i:number) => <div key={i} style={{ fontSize:12, color:'#92400e', marginBottom:4 }}>• {g}</div>)}
                          </div>
                        )}
                        {ed.code_issues?.length > 0 && (
                          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 14px', marginBottom:10 }}>
                            <div style={{ fontSize:11, fontWeight:700, color:'#991b1b', marginBottom:8 }}>🚨 Code Issues</div>
                            {ed.code_issues.map((c:string, i:number) => <div key={i} style={{ fontSize:12, color:'#991b1b', marginBottom:4 }}>• {c}</div>)}
                          </div>
                        )}
                        {ed.safety_flags?.length > 0 && (
                          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 14px', marginBottom:10 }}>
                            <div style={{ fontSize:11, fontWeight:700, color:'#991b1b', marginBottom:8 }}>🚨 Safety Flags</div>
                            {ed.safety_flags.map((f:string, i:number) => <div key={i} style={{ fontSize:12, color:'#991b1b', marginBottom:4 }}>• {f}</div>)}
                          </div>
                        )}
                        {ed.cost_saving_opportunities?.length > 0 && (
                          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'12px 14px' }}>
                            <div style={{ fontSize:11, fontWeight:700, color:'#166534', marginBottom:8 }}>💰 Cost Savings</div>
                            {ed.cost_saving_opportunities.map((c:string, i:number) => <div key={i} style={{ fontSize:12, color:'#166534', marginBottom:4 }}>• {c}</div>)}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, background:'#111827', color:'white', padding:'12px 20px', borderRadius:12, fontSize:13, fontWeight:500, boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>{toast}</div>}
    </>
  )
}
