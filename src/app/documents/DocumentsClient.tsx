'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Props { user: any; project: any }

const T = {
  bgDeep:'#07090E',bgPage:'#0B0F16',bgCard:'#131A26',bgElev:'#1A2333',bgInput:'#0F1521',
  border:'#232E42',borderSoft:'rgba(255,255,255,0.06)',
  fg:'#F1EEE5',fg2:'#B6BCCB',fg3:'#7B8497',fg4:'#545B6C',
  safety:'#FF6B1F',safetyDim:'rgba(255,107,31,0.1)',
  mint:'#4FE3B5',mintDim:'rgba(79,227,181,0.1)',
  danger:'#FF5260',dangerDim:'rgba(255,82,96,0.1)',
  warn:'#FFB020',warnDim:'rgba(255,176,32,0.1)',
  blueprint:'#6FA8FF',blueprintDim:'rgba(111,168,255,0.1)',
}

const DOC_TYPES = [
  { id:'permit',      label:'Permit',          color:T.warn,      prompt:'Extract: permit number, issue date, expiry date, inspector name and contact, jurisdiction, special conditions, scope of work, valuation. Flag any expiry within 30 days as URGENT.' },
  { id:'blueprint',   label:'Blueprint',        color:T.blueprint, prompt:'Extract: drawing number, revision, discipline, sheet title, date, engineer. List all notes, panel schedules, equipment tags, conduit sizes, circuit numbers. FLAG: conflicts, scope additions, items needing RFIs.' },
  { id:'contract',    label:'Contract',         color:T.safety,    prompt:'Extract: parties, contract value, start/end dates, payment terms, retainage %, notice requirements (days), change order window (days), dispute resolution. FLAG: pay-if-paid clauses, no-damage-for-delay, unfavorable terms.' },
  { id:'lien_waiver', label:'Lien Waiver',      color:T.danger,    prompt:'Extract: waiver type (conditional/unconditional, progress/final), claimant, customer, job location, through date, amount received, amount waived, exceptions. Summarize what rights are being waived.' },
  { id:'license',     label:'License',          color:T.mint,      prompt:'Extract: license number, type, holder name, company, issue date, expiry date, issuing authority, bond amount, restrictions. FLAG: expiry within 60 days.' },
  { id:'insurance',   label:'Insurance Cert',   color:T.mint,      prompt:'Extract: insurer, insured, policy numbers, coverage types, policy limits, effective/expiry dates, additional insured parties. FLAG: any coverage expiring within 60 days.' },
  { id:'submittal',   label:'Submittal',        color:T.blueprint, prompt:'Extract: submittal number, spec section, description, submitted by/to, dates, revision, approval status, engineer comments, required actions.' },
  { id:'other',       label:'Other',            color:T.fg3,       prompt:'Extract all key information: parties, dates, amounts, obligations, deadlines, and action items. Summarize purpose and highlight anything requiring immediate attention.' },
]

interface ScannedDoc {
  id:string; name:string; type:string; size:number
  analysis:string|null; status:'scanning'|'done'|'error'; progress:number
}

function Pill({ color, children }: { color:string; children:React.ReactNode }) {
  return <span style={{ display:'inline-flex',alignItems:'center',height:20,padding:'0 8px',borderRadius:99,background:`${color}20`,color,fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' }}>{children}</span>
}

function AnalysisView({ text, color }: { text:string; color:string }) {
  const lines = text.split('\n').filter(l => l.trim())
  const flags: string[] = []
  const fields: {k:string;v:string}[] = []
  const notes: string[] = []
  lines.forEach(raw => {
    const l = raw.replace(/^[*\-•#]+\s*/,'').trim()
    const lo = l.toLowerCase()
    if (lo.includes('flag') || lo.includes('urgent') || lo.includes('warning') || lo.includes('unfavorable') || lo.includes('risk') || lo.includes('action required') || lo.includes('expires')) {
      flags.push(l)
    } else if (l.includes(':') && l.indexOf(':') < 45 && l.indexOf(':') > 2) {
      const i = l.indexOf(':')
      const k = l.slice(0,i).trim()
      const v = l.slice(i+1).trim()
      if (k.length < 40 && v) fields.push({k,v})
    } else if (l.length > 15) {
      notes.push(l)
    }
  })
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
      {flags.length > 0 && (
        <div style={{ padding:'12px 14px',background:T.dangerDim,border:`1px solid ${T.danger}30`,borderLeft:`3px solid ${T.danger}`,borderRadius:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.danger,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8 }}>Action Required</div>
          {flags.map((f,i)=><div key={i} style={{ fontSize:12,color:T.fg,lineHeight:1.6,marginBottom:i<flags.length-1?4:0 }}>{f}</div>)}
        </div>
      )}
      {fields.length > 0 && (
        <div style={{ background:T.bgElev,borderRadius:10,border:`1px solid ${T.borderSoft}`,overflow:'hidden' }}>
          <div style={{ padding:'8px 14px',borderBottom:`1px solid ${T.borderSoft}`,fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.fg4,textTransform:'uppercase',letterSpacing:'0.1em' }}>Extracted Data</div>
          {fields.slice(0,20).map((f,i)=>(
            <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,padding:'7px 14px',borderBottom:i<Math.min(fields.length,20)-1?`1px solid ${T.borderSoft}`:'none' }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.fg4,textTransform:'uppercase',letterSpacing:'0.08em',flexShrink:0,maxWidth:130,paddingTop:2 }}>{f.k}</span>
              <span style={{ fontSize:12,color,fontWeight:500,textAlign:'right',flex:1 }}>{f.v}</span>
            </div>
          ))}
        </div>
      )}
      {notes.length > 0 && (
        <div style={{ background:T.bgCard,borderRadius:10,border:`1px solid ${T.borderSoft}`,padding:'12px 14px' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.fg4,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8 }}>Summary</div>
          {notes.slice(0,8).map((n,i)=><div key={i} style={{ fontSize:12,color:T.fg2,lineHeight:1.7,marginBottom:3 }}>{n}</div>)}
        </div>
      )}
    </div>
  )
}

export function DocumentsClient({ user, project }: Props) {
  const [docs, setDocs] = useState<ScannedDoc[]>([])
  const [selType, setSelType] = useState('permit')
  const [selDoc, setSelDoc] = useState<ScannedDoc|null>(null)
  const [dragging, setDragging] = useState(false)
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function msg(t:string){ setToast(t); setTimeout(()=>setToast(''),3500) }

  async function processFile(file:File, docType:string) {
    if (!project){ msg('Create a project first'); return }
    if (file.size > 20*1024*1024){ msg('File too large — max 20MB'); return }
    const docId = `doc_${Date.now()}`
    const newDoc:ScannedDoc = { id:docId, name:file.name, type:docType, size:file.size, analysis:null, status:'scanning', progress:0 }
    setDocs(prev=>[newDoc,...prev])
    setSelDoc(newDoc)
    let prog = 0
    const iv = setInterval(()=>{ prog=Math.min(prog+Math.random()*7+2,88); setDocs(prev=>prev.map(d=>d.id===docId?{...d,progress:prog}:d)) },220)
    try {
      const base64 = await new Promise<string>((res,rej)=>{ const r=new FileReader(); r.onload=()=>res((r.result as string).split(',')[1]); r.onerror=rej; r.readAsDataURL(file) })
      const cfg = DOC_TYPES.find(d=>d.id===docType)
      const mediaType = file.type==='application/pdf'?'application/pdf':'image/jpeg'
      const resp = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:1500,
          messages:[{
            role:'user',
            content:[
              { type:'document', source:{ type:'base64', media_type:mediaType, data:base64 } },
              { type:'text', text:`You are SubIQ's AI document scanner for construction subcontractors. Analyze this ${cfg?.label} for project: ${project?.name||'Unknown'}.\n\n${cfg?.prompt}\n\nFormat as key: value pairs first, then a Summary section, then a FLAGS / URGENT section for anything requiring action. Be specific with all dates, dollar amounts, names, and contact details.` }
            ]
          }]
        })
      })
      const data = await resp.json()
      const text = data.content?.[0]?.text || 'Could not extract information.'
      clearInterval(iv)
      const { data:{ user:authUser } } = await supabase.auth.getUser()
      if (authUser) await supabase.from('documents').insert({ user_id:authUser.id, project_id:project.id, name:file.name, document_type:docType, ai_summary:text, file_size:file.size })
      const done:ScannedDoc = {...newDoc, analysis:text, status:'done', progress:100}
      setDocs(prev=>prev.map(d=>d.id===docId?done:d))
      setSelDoc(done)
      msg('Document scanned')
    } catch(e) {
      clearInterval(iv)
      setDocs(prev=>prev.map(d=>d.id===docId?{...d,status:'error',progress:0}:d))
      msg('Scan failed — try again')
    }
  }

  const cfg = DOC_TYPES.find(d=>d.id===selType)

  return (
    <div style={{ fontFamily:"'Space Grotesk',sans-serif",color:T.fg }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');@keyframes spin{to{transform:rotate(360deg)}}@keyframes scanbar{0%{left:-40%}100%{left:140%}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.safety,textTransform:'uppercase',letterSpacing:'0.12em' }}>AI Document Intelligence</div>
          <div style={{ width:5,height:5,borderRadius:'50%',background:T.mint,boxShadow:`0 0 6px ${T.mint}`,animation:'pulse 1.4s ease-in-out infinite' }}/>
        </div>
        <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:'-0.5px',color:T.fg,marginBottom:4 }}>Document Scanner</h1>
        <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.fg4 }}>Permits · Blueprints · Contracts · Lien Waivers · Licenses · Insurance</div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:selDoc?'1fr 360px':'1fr',gap:20,alignItems:'start' }}>
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>

          {/* Type selector */}
          <div style={{ background:T.bgCard,border:`1px solid ${T.borderSoft}`,borderRadius:14,padding:18 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.fg4,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:12 }}>What are you scanning?</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8 }}>
              {DOC_TYPES.map(dt=>(
                <button key={dt.id} onClick={()=>setSelType(dt.id)} style={{ padding:'8px 12px',borderRadius:9,cursor:'pointer',fontFamily:"'Space Grotesk',sans-serif",fontSize:12,fontWeight:500,border:`1.5px solid ${selType===dt.id?dt.color:T.border}`,background:selType===dt.id?`${dt.color}15`:T.bgElev,color:selType===dt.id?dt.color:T.fg3,transition:'all 0.15s',textAlign:'left' }}>
                  {dt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e=>{e.preventDefault();setDragging(true)}}
            onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f)processFile(f,selType)}}
            onClick={()=>fileRef.current?.click()}
            style={{ border:`2px dashed ${dragging?cfg?.color||T.safety:T.border}`,borderRadius:16,padding:'44px 24px',textAlign:'center',cursor:'pointer',transition:'all 0.2s',background:dragging?`${cfg?.color||T.safety}08`:T.bgCard }}
          >
            <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style={{ display:'none' }} onChange={e=>{const f=e.target.files?.[0];if(f)processFile(f,selType);e.target.value=''}} />
            <div style={{ width:52,height:52,borderRadius:13,background:`${cfg?.color||T.safety}20`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={cfg?.color||T.safety} strokeWidth="1.6" strokeLinecap="round"><path d="M7 3h8l5 5v13H7z"/><path d="M14 3v6h6"/><path d="M10 13h7M10 16h5"/></svg>
            </div>
            <div style={{ fontSize:16,fontWeight:700,color:T.fg,marginBottom:6 }}>Drop your {cfg?.label} here</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.fg4,marginBottom:16 }}>PDF, PNG, JPG — up to 20MB</div>
            <div style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'9px 22px',borderRadius:9,background:cfg?.color||T.safety,color:'#0A0E14',fontSize:13,fontWeight:700 }}>Choose file</div>
            <div style={{ marginTop:14,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.fg4 }}>
              AI extracts: {selType==='permit'?'permit #, expiry, inspector, conditions':selType==='blueprint'?'panel schedules, circuits, conflicts, RFI triggers':selType==='contract'?'payment terms, notice windows, unfavorable clauses':selType==='lien_waiver'?'type, amount, rights waived, exceptions':selType==='license'?'number, expiry, bond, restrictions':selType==='insurance'?'coverage limits, expiry, additional insureds':'all key fields, dates, amounts, action items'}
            </div>
          </div>

          {/* Doc list */}
          {docs.length > 0 && (
            <div style={{ background:T.bgCard,border:`1px solid ${T.borderSoft}`,borderRadius:14,overflow:'hidden' }}>
              <div style={{ padding:'12px 18px',borderBottom:`1px solid ${T.borderSoft}`,fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.fg4,textTransform:'uppercase',letterSpacing:'0.12em' }}>
                Scanned — {docs.length}
              </div>
              {docs.map(doc=>{
                const dc=DOC_TYPES.find(d=>d.id===doc.type)
                const isSel=selDoc?.id===doc.id
                return (
                  <div key={doc.id} onClick={()=>setSelDoc(isSel?null:doc)} style={{ padding:'11px 18px',cursor:'pointer',borderBottom:`1px solid ${T.borderSoft}`,background:isSel?`${dc?.color||T.safety}08`:'transparent',transition:'background 0.1s' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:doc.status==='scanning'?7:0 }}>
                      <Pill color={dc?.color||T.fg3}>{dc?.label||doc.type}</Pill>
                      <span style={{ flex:1,fontSize:12,fontWeight:500,color:T.fg,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{doc.name}</span>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:doc.status==='done'?T.mint:doc.status==='error'?T.danger:T.warn,textTransform:'uppercase' }}>
                        {doc.status==='scanning'?`${Math.round(doc.progress)}%`:doc.status==='done'?'Done':'Error'}
                      </span>
                    </div>
                    {doc.status==='scanning' && (
                      <div style={{ height:2,background:'rgba(255,255,255,0.06)',borderRadius:99,overflow:'hidden',position:'relative' }}>
                        <div style={{ position:'absolute',top:0,bottom:0,width:'35%',background:`linear-gradient(90deg,transparent,${T.mint},transparent)`,animation:'scanbar 1.3s ease-in-out infinite' }}/>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Analysis panel */}
        {selDoc && (
          <div style={{ background:T.bgCard,border:`1px solid ${T.borderSoft}`,borderRadius:14,overflow:'hidden',position:'sticky',top:20 }}>
            <div style={{ padding:'13px 18px',borderBottom:`1px solid ${T.borderSoft}`,background:T.bgElev }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4 }}>
                <Pill color={DOC_TYPES.find(d=>d.id===selDoc.type)?.color||T.fg3}>{DOC_TYPES.find(d=>d.id===selDoc.type)?.label}</Pill>
                <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:T.fg4 }}>{(selDoc.size/1024).toFixed(0)}KB</span>
              </div>
              <div style={{ fontSize:13,fontWeight:600,color:T.fg,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{selDoc.name}</div>
            </div>
            <div style={{ padding:'16px 18px',maxHeight:'70vh',overflowY:'auto' }}>
              {selDoc.status==='scanning' && (
                <div style={{ textAlign:'center',padding:'32px 0' }}>
                  <div style={{ display:'flex',justifyContent:'center',marginBottom:14 }}>
                    <svg width="36" height="36" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke={T.bgElev} strokeWidth="3"/>
                      <circle cx="18" cy="18" r="14" fill="none" stroke={T.mint} strokeWidth="3" strokeDasharray="22 66" strokeLinecap="round" style={{ animation:'spin 1s linear infinite',transformOrigin:'center' }}/>
                    </svg>
                  </div>
                  <div style={{ fontSize:13,fontWeight:600,color:T.fg,marginBottom:5 }}>AI reading document...</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.fg4,marginBottom:14 }}>Extracting fields and flagging actions</div>
                  <div style={{ height:3,background:'rgba(255,255,255,0.06)',borderRadius:99,overflow:'hidden' }}>
                    <div style={{ width:`${selDoc.progress}%`,height:'100%',background:T.mint,borderRadius:99,transition:'width 0.3s ease',boxShadow:`0 0 8px ${T.mint}` }}/>
                  </div>
                </div>
              )}
              {selDoc.status==='done' && selDoc.analysis && (
                <AnalysisView text={selDoc.analysis} color={DOC_TYPES.find(d=>d.id===selDoc.type)?.color||T.safety}/>
              )}
              {selDoc.status==='error' && (
                <div style={{ textAlign:'center',padding:'32px 0' }}>
                  <div style={{ fontSize:14,fontWeight:600,color:T.danger,marginBottom:8 }}>Scan failed</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.fg4,marginBottom:16 }}>Try again with a clearer PDF or image.</div>
                  <button onClick={()=>setSelDoc(null)} style={{ padding:'8px 20px',fontSize:12,fontWeight:600,borderRadius:8,cursor:'pointer',border:`1px solid ${T.border}`,background:'transparent',color:T.fg2,fontFamily:'inherit' }}>Dismiss</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position:'fixed',bottom:24,right:24,zIndex:9999,background:T.bgElev,border:`1px solid ${T.border}`,color:T.fg,padding:'12px 20px',borderRadius:12,fontSize:13,fontWeight:500,boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
