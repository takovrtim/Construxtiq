'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import type { User, Project, EmailThread, Subcontractor } from '@/types'

interface Props {
  user: User
  project: Project | null
  initialThreads: EmailThread[]
  subs: Pick<Subcontractor, 'id' | 'company_name' | 'trade' | 'email'>[]
}

export function EmailClient({ user, project, initialThreads, subs }: Props) {
  const [threads, setThreads]     = useState<EmailThread[]>(initialThreads)
  const [selected, setSelected]   = useState<EmailThread | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [drafting, setDrafting]   = useState(false)
  const [sending, setSending]     = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [toast, setToast]         = useState('')

  // Compose form
  const [composeBody, setComposeBody]   = useState('')
  const [composeSending, setComposeSending] = useState(false)
  const [selectedSubId, setSelectedSubId]   = useState('')

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3200) }

  async function openThread(thread: EmailThread) {
    setSelected(thread)
    setReplyBody('')
    // Mark as read
    if (!thread.read_at) {
      await supabase.from('email_threads').update({ read_at: new Date().toISOString() }).eq('id', thread.id)
      setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, read_at: new Date().toISOString() } : t))
    }
  }

  async function aiDraftReply() {
    if (!selected || !project) return
    setDrafting(true); setReplyBody('')

    // Find sub for this thread
    const sub = subs.find(s => s.id === selected.sub_id)
    if (sub) {
      const res = await fetch('/api/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sub_id: sub.id, project_id: project.id, action: 'draft' }),
      })
      const json = await res.json()
      if (json.success) setReplyBody(json.draft)
      else showMsg('Draft failed')
    } else {
      // Generic reply
      setReplyBody(`Dear ${selected.from_name},\n\nThank you for your email regarding ${project.name}.\n\nWe will review and follow up shortly.\n\nBest regards,\n${user.company_name || user.full_name || 'Project Management'}`)
    }
    setDrafting(false)
  }

  async function sendReply() {
    if (!selected || !replyBody.trim()) return
    setSending(true)

    const { data, error } = await supabase.from('email_threads').insert({
      project_id: selected.project_id,
      user_id: user.id,
      sub_id: selected.sub_id,
      subject: `Re: ${selected.subject}`,
      from_name: user.company_name || user.full_name || 'Project Management',
      from_email: user.email,
      body: replyBody,
      direction: 'outbound',
      sent_at: new Date().toISOString(),
    }).select().single()

    if (!error && data) {
      setThreads(prev => [data as EmailThread, ...prev])
      setReplyBody('')
      showMsg('Reply logged')
    }
    setSending(false)
  }

  async function sendComposed(e: React.FormEvent) {
    e.preventDefault()
    if (!project) return
    setComposeSending(true)

    const sub = subs.find(s => s.id === selectedSubId)
    const { data, error } = await supabase.from('email_threads').insert({
      project_id: project.id,
      user_id: user.id,
      sub_id: sub?.id ?? null,
      subject: sub ? `Message to ${sub.company_name}` : `Message re: ${project.name}`,
      from_name: user.company_name || user.full_name || 'Project Management',
      from_email: user.email,
      body: composeBody,
      direction: 'outbound',
      sent_at: new Date().toISOString(),
    }).select().single()

    if (!error && data) {
      setThreads(prev => [data as EmailThread, ...prev])
      setShowCompose(false)
      setComposeBody(''); setSelectedSubId('')
      showMsg('Email logged')
    }
    setComposeSending(false)
  }

  const unreadCount = threads.filter(t => !t.read_at && t.direction === 'inbound').length

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>No project selected</div>
      <a href="/dashboard?new=1" style={{ color: 'var(--orange)', textDecoration: 'none', fontSize: 13 }}>Create a project →</a>
    </div>
  )

  return (
    <>
      <div className="ptitle">Email</div>
      <p className="psub">Project inbox · AI drafts replies based on your permit requirements and scope</p>

      <div className="g2">
        {/* LEFT: Inbox list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Inbox</span>
              {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
            </div>
            <button className="btn btn-sm btn-p" onClick={() => setShowCompose(v => !v)}>+ Compose</button>
          </div>

          {/* Compose form */}
          {showCompose && (
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              <form onSubmit={sendComposed} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div>
                  <label className="input-label">Subcontractor</label>
                  <select className="input" value={selectedSubId} onChange={e => setSelectedSubId(e.target.value)}>
                    <option value="">— Select sub —</option>
                    {subs.map(s => <option key={s.id} value={s.id}>{s.company_name} ({s.trade})</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Message</label>
                  <textarea className="input" rows={4} style={{ resize: 'vertical' }} placeholder="Type your message…" value={composeBody} onChange={e => setComposeBody(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button type="submit" className="btn btn-sm btn-p" disabled={composeSending}>{composeSending ? 'Logging…' : 'Log Email'}</button>
                  <button type="button" className="btn btn-sm" onClick={() => setShowCompose(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Thread list */}
          {threads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-3)', fontSize: 13 }}>
              No emails yet — compose one or sync your inbox
            </div>
          ) : (
            threads.map(t => {
              const isUnread = !t.read_at && t.direction === 'inbound'
              const initial = (t.from_name || '?').slice(0, 2).toUpperCase()
              const avatarBg = t.direction === 'inbound' ? 'var(--blue-l)' : 'var(--green-l)'
              const avatarColor = t.direction === 'inbound' ? 'var(--blue-d)' : 'var(--green-d)'
              return (
                <div key={t.id} onClick={() => openThread(t)} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selected?.id === t.id ? 'var(--bg)' : isUnread ? `${avatarBg}40` : 'transparent' }}>
                  <div style={{ width: 33, height: 33, borderRadius: '50%', background: avatarBg, color: avatarColor, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isUnread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                    <div className="tsm tm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{t.from_name} · {t.body.slice(0, 60)}…</div>
                  </div>
                  <div className="tsm tf" style={{ whiteSpace: 'nowrap', paddingLeft: 8 }}>{format(parseISO(t.created_at), 'MMM d')}</div>
                </div>
              )
            })
          )}
        </div>

        {/* RIGHT: Thread reader + reply */}
        <div>
          {!selected ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✉️</div>
              <div style={{ fontSize: 13 }}>Select an email to read</div>
            </div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{selected.subject}</div>
                  <div className="tsm tm">{selected.from_name} · {format(parseISO(selected.created_at), 'MMM d, h:mm a')}</div>
                  <span className={`pill ${selected.direction === 'outbound' ? 'p-blue' : 'p-gray'}`} style={{ marginTop: 6, display: 'inline-flex' }}>{selected.direction}</span>
                </div>

                {/* AI context flag */}
                {(() => {
                  const sub = subs.find(s => s.id === selected.sub_id)
                  if (!sub) return null
                  return (
                    <div className="alert alert-b" style={{ marginBottom: 12 }}>
                      ℹ️ AI: This email is from {sub.company_name} ({sub.trade}). Check Subcontractors tab for their bid analysis and internal flags.
                    </div>
                  )
                })()}

                <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)', whiteSpace: 'pre-wrap', background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 13 }}>
                  {selected.body}
                </div>
              </div>

              {/* Reply area */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Reply</div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button className="btn btn-sm" onClick={aiDraftReply} disabled={drafting}>{drafting ? 'Drafting…' : 'AI Draft'}</button>
                    {replyBody && <button className="btn btn-sm btn-p" onClick={sendReply} disabled={sending}>{sending ? 'Logging…' : 'Log Reply →'}</button>}
                  </div>
                </div>
                <div className="compose-wrap">
                  <div className="compose-body">
                    <textarea rows={7} value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder={drafting ? 'AI is writing…' : "Click 'AI Draft' or write your reply"} />
                  </div>
                  <div className="compose-footer">
                    <button className="btn btn-sm" onClick={() => setReplyBody('')}>Clear</button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}
    </>
  )
}
