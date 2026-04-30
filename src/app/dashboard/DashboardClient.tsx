'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format, differenceInDays, parseISO } from 'date-fns'
import type { User, Project, Permit, BidLineItem, Subcontractor } from '@/types'

interface Props {
  user: User
  project: Project | null
  isNewUser: boolean
}

function Skeleton({ w = '100%', h = 16, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return <div style={{ width: w, height: h, background: 'rgba(0,0,0,0.06)', borderRadius: r, animation: 'pulse 1.5s infinite' }} />
}

function ProjectCalculator() {
  const [jobType, setJobType] = useState<'electrical' | 'plumbing'>('electrical')
  const [hours, setHours] = useState('')
  const [laborRate, setLaborRate] = useState('85')
  const [materials, setMaterials] = useState('')
  const [overhead, setOverhead] = useState('15')
  const [margin, setMargin] = useState('25')
  const [sqft, setSqft] = useState('')

  const laborCost    = (parseFloat(hours) || 0) * (parseFloat(laborRate) || 0)
  const materialCost = parseFloat(materials) || 0
  const overheadCost = (laborCost + materialCost) * ((parseFloat(overhead) || 0) / 100)
  const subtotal     = laborCost + materialCost + overheadCost
  const profit       = subtotal * ((parseFloat(margin) || 0) / 100)
  const total        = subtotal + profit
  const perSqft      = sqft ? total / parseFloat(sqft) : 0
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

  return (
    <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Labor Hours', value: hours, set: setHours, placeholder: '40' },
          { label: 'Rate ($/hr)', value: laborRate, set: setLaborRate, placeholder: '85' },
          { label: 'Materials ($)', value: materials, set: setMaterials, placeholder: '2500' },
          { label: 'Square Footage', value: sqft, set: setSqft, placeholder: '1200' },
          { label: 'Overhead %', value: overhead, set: setOverhead, placeholder: '15' },
          { label: 'Profit Margin %', value: margin, set: setMargin, placeholder: '25' },
        ].map(f => (
          <div key={f.label}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9e9d99', display: 'block', marginBottom: 5, letterSpacing: '0.2px', textTransform: 'uppercase' }}>{f.label}</label>
            <input type="number" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={{ width: '100%', padding: '9px 11px', fontSize: 13, fontWeight: 500, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#0f0f0f' }} />
          </div>
        ))}
      </div>
      <div style={{ background: '#0f0f0f', borderRadius: 12, padding: 18, color: 'white' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
          {[
            { label: 'Labor', value: fmt(laborCost) },
            { label: 'Materials', value: fmt(materialCost) },
            { label: 'Overhead', value: fmt(overheadCost) },
            { label: 'Profit', value: fmt(profit), accent: true },
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
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1.5px', color: '#d95f2b' }}>{fmt(total)}</div>
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

export function DashboardClient({ user, project, isNewUser }: Props) {
  const router = useRouter()
  const [permits, setPermits]     = useState<Permit[]>([])
  const [bids, setBids]           = useState<BidLineItem[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [subs, setSubs]           = useState<Subcontractor[]>([])
  const [loading, setLoading]     = useState(true)
  const [projName, setProjName]   = useState('')
  const [creating, setCreating]   = useState(false)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = (user.full_name || user.email || '').split(/[\s@]/)[0] || 'there'

  useEffect(() => {
    if (!project) { setLoading(false); return }
    fetchData()
  }, [project])

  async function fetchData() {
    setLoading(true)
    const pid = project!.id
    const [p, b, d, s] = await Promise.all([
      supabase.from('permits').select('*').eq('project_id', pid).order('expiry_date'),
      supabase.from('bid_line_items').select('*').eq('project_id', pid).order('sort_order'),
      supabase.from('documents').select('id, name, status, doc_type, created_at').eq('project_id', pid).order('created_at', { ascending: false }).limit(6),
      supabase.from('subcontractors').select('*').eq('project_id', pid),
    ])
    setPermits(p.data ?? [])
    setBids(b.data ?? [])
    setDocuments(d.data ?? [])
    setSubs(s.data ?? [])
    setLoading(false)
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!projName.trim()) return
    setCreating(true)
    const { data, error } = await supabase.from('projects').insert({
      user_id: user.id, name: projName.trim(),
      city: 'Las Vegas', state: 'NV', jurisdiction: 'Clark County, NV',
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
    if (days < 0)    alerts.push({ level: 'critical', text: `Permit ${p.permit_number} expired ${Math.abs(days)}d ago`, href: '/documents' })
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
            <input style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 10, fontFamily: 'inherit', outline: 'none' }} placeholder="e.g. The Repair Crew" value={projName} onChange={e => setProjName(e.target.value)} required autoFocus />
          </div>
          <button type="submit" disabled={creating} style={{ padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
            {creating ? 'Creating…' : 'Create Project →'}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 2 }}>
          {greeting}, {firstName} ☀️
        </div>
        <div style={{ fontSize: 13, color: '#9e9d99' }}>
          {project.name} · {[project.city, project.state].filter(Boolean).join(', ')} · {format(today, 'EEEE, MMMM d')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {loading ? Array.from({length:4}).map((_,i) => (
          <div key={i} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '16px 18px' }}>
            <Skeleton w="60%" h={10} r={4} />
            <div style={{ marginTop: 10 }}><Skeleton w="40%" h={28} r={6} /></div>
            <div style={{ marginTop: 6 }}><Skeleton w="80%" h={10} r={4} /></div>
          </div>
        )) : [
          { label: 'Documents', value: documents.length, sub: `${documents.filter(d=>d.status==='extracted'||d.status==='saved').length} extracted`, accent: '' },
          { label: 'Active Permits', value: permits.filter(p=>p.status==='active').length, sub: `${permits.filter(p=>p.status==='expiring_soon').length} expiring soon`, accent: permits.some(p=>p.status==='expiring_soon') ? '#b06e1a' : '' },
          { label: 'Total Bid', value: totalBid > 0 ? `$${(totalBid/1000).toFixed(0)}K` : '—', sub: `$${(awarded/1000).toFixed(0)}K awarded`, accent: '' },
          { label: 'Subcontractors', value: subs.length, sub: `${subs.filter(s=>s.status==='awarded').length} awarded`, accent: '' },
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
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>Priority Actions</div>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#9e9d99', letterSpacing: '0.4px', textTransform: 'uppercase' }}>AI-identified</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <Skeleton key={i} h={40} r={8} />)}
            </div>
          ) : alerts.slice(0, 5).map((a, i) => {
            const s = alertStyle[a.level]
            return (
              <Link key={i} href={a.href} style={{ textDecoration: 'none', display: 'block', marginBottom: 8 }}>
                <div style={{ background: s.bg, color: s.text, borderLeft: `3px solid ${s.border}`, borderRadius: '0 8px 8px 0', padding: '10px 13px', fontSize: 12, lineHeight: 1.55 }}>
                  {s.icon} {a.text}
                </div>
              </Link>
            )
          })}
        </div>

        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>Recent Documents</div>
            <Link href="/documents" style={{ fontSize: 12, color: '#9e9d99', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Skeleton w={34} h={34} r={9} />
                  <div style={{ flex: 1 }}><Skeleton h={12} r={4} /><div style={{ marginTop: 5 }}><Skeleton w="60%" h={10} r={4} /></div></div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📄</div>
              <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 12 }}>No documents yet</div>
              <Link href="/documents" style={{ fontSize: 13, fontWeight: 600, color: '#d95f2b', textDecoration: 'none', background: '#fdf0e8', padding: '8px 16px', borderRadius: 8 }}>Upload first permit →</Link>
            </div>
          ) : documents.map(doc => {
            const icons: Record<string,string> = { permit:'📋', blueprint:'🏗️', contract:'📝', sub_bid:'💰', inspection:'🔍', other:'📄' }
            const sc: Record<string,{bg:string;text:string}> = { extracted:{bg:'#edf5f0',text:'#1a4d31'}, saved:{bg:'#edf5f0',text:'#1a4d31'}, processing:{bg:'#fdf4e3',text:'#6b4010'}, uploading:{bg:'#fdf4e3',text:'#6b4010'}, needs_review:{bg:'#fdf0f0',text:'#6e1a1a'} }
            const c = sc[doc.status] || {bg:'#f1ede6',text:'#6b6a66'}
            return (
              <div key={doc.id} style={{ display:'flex', alignItems:'center', gap:11, padding:'9px 0', borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ width:34, height:34, borderRadius:9, background:'#f8f7f4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{icons[doc.doc_type]||'📄'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.name}</div>
                  <div style={{ fontSize:11, color:'#9e9d99', marginTop:1 }}>{format(parseISO(doc.created_at), 'MMM d, h:mm a')}</div>
                </div>
                <span style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:20, background:c.bg, color:c.text, whiteSpace:'nowrap' }}>
                  {doc.status==='processing'||doc.status==='uploading' ? '⏳ Reading' : doc.status.replace('_',' ')}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <ProjectCalculator />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:16 }}>
        {[
          { href:'/jobs',      icon:'🔧', label:'Job Board',     desc:'Track active jobs' },
          { href:'/documents', icon:'📋', label:'Upload Permit', desc:'AI reads instantly' },
          { href:'/subs',      icon:'👥', label:'Crew & Subs',   desc:'Message the team' },
          { href:'/bids',      icon:'💰', label:'Bids',          desc:'Track project costs' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration:'none', background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#f8f7f4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#0f0f0f', letterSpacing:'-0.2px' }}>{item.label}</div>
              <div style={{ fontSize:11, color:'#9e9d99', marginTop:1 }}>{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
