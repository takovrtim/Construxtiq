'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays, isToday, isPast } from 'date-fns'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'permit_expiry' | 'inspection_overdue' | 'change_pending' | 'safety_missing' | 'material_flagged' | 'invoice_overdue' | 'warranty_expiry'
  title: string
  body: string
  href: string
  severity: 'danger' | 'warning' | 'info'
  created_at: string
  read: boolean
}

interface Props {
  projectId: string | null
  userId: string
}

const SEVERITY_CONFIG = {
  danger:  { color: '#b83232', bg: 'rgba(184,50,50,0.1)',  icon: '🔴' },
  warning: { color: '#b06e1a', bg: 'rgba(176,110,26,0.1)', icon: '⚠️' },
  info:    { color: '#1f5fa6', bg: 'rgba(31,95,166,0.1)',  icon: '💬' },
}

export function NotificationBell({ projectId, userId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen]                   = useState(false)
  const [loading, setLoading]             = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (projectId) loadNotifications()
  }, [projectId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadNotifications() {
    if (!projectId) return
    setLoading(true)
    const today = new Date()

    const generated: Notification[] = []

    // Fetch data to generate notifications
    const [{ data: permits }, { data: inspections }, { data: changes }, { data: safety }, { data: materials }, { data: invoices }, { data: warranties }] = await Promise.all([
      supabase.from('permits').select('id, permit_number, permit_type, expiry_date, status').eq('project_id', projectId).eq('status', 'active'),
      supabase.from('inspections').select('id, title, scheduled_date, status').eq('project_id', projectId).eq('status', 'scheduled'),
      supabase.from('change_orders').select('id, title, status').eq('project_id', projectId).eq('status', 'pending'),
      supabase.from('safety_checklists').select('id, job_date').eq('project_id', projectId).gte('job_date', today.toISOString().split('T')[0]),
      supabase.from('materials').select('id, name, status, flagged').eq('project_id', projectId).eq('flagged', true).neq('status', 'installed'),
      supabase.from('invoices').select('id, invoice_number, due_date, status, total').eq('project_id', projectId).eq('status', 'sent'),
      supabase.from('warranties').select('id, item_name, expiry_date').eq('project_id', projectId),
    ])

    // Permit expiry alerts
    permits?.forEach(p => {
      if (!p.expiry_date) return
      const days = differenceInDays(parseISO(p.expiry_date), today)
      if (days <= 14 && days >= 0) {
        generated.push({
          id: `permit-${p.id}`,
          type: 'permit_expiry',
          title: `Permit expires in ${days} day${days !== 1 ? 's' : ''}`,
          body: `${p.permit_number} · ${p.permit_type} · ${format(parseISO(p.expiry_date), 'MMM d, yyyy')}`,
          href: '/documents',
          severity: days <= 7 ? 'danger' : 'warning',
          created_at: new Date().toISOString(),
          read: false,
        })
      }
    })

    // Overdue inspections
    inspections?.forEach(i => {
      if (!i.scheduled_date) return
      if (isPast(parseISO(i.scheduled_date)) && !isToday(parseISO(i.scheduled_date))) {
        generated.push({
          id: `inspection-${i.id}`,
          type: 'inspection_overdue',
          title: 'Overdue inspection',
          body: `${i.title} was due ${format(parseISO(i.scheduled_date), 'MMM d')}`,
          href: '/inspections',
          severity: 'danger',
          created_at: new Date().toISOString(),
          read: false,
        })
      }
    })

    // Pending change orders
    if (changes && changes.length > 0) {
      generated.push({
        id: 'changes-pending',
        type: 'change_pending',
        title: `${changes.length} change order${changes.length !== 1 ? 's' : ''} pending`,
        body: 'Need owner approval before proceeding',
        href: '/changes',
        severity: 'warning',
        created_at: new Date().toISOString(),
        read: false,
      })
    }

    // Safety checklist missing today
    const todayStr = today.toISOString().split('T')[0]
    if (!safety?.find(s => s.job_date === todayStr)) {
      generated.push({
        id: 'safety-missing',
        type: 'safety_missing',
        title: 'No safety checklist today',
        body: 'Complete before crew starts work',
        href: '/safety',
        severity: 'warning',
        created_at: new Date().toISOString(),
        read: false,
      })
    }

    // Flagged materials
    if (materials && materials.length > 0) {
      generated.push({
        id: 'materials-flagged',
        type: 'material_flagged',
        title: `${materials.length} material${materials.length !== 1 ? 's' : ''} flagged`,
        body: 'Missing or delayed supplies need attention',
        href: '/materials',
        severity: 'warning',
        created_at: new Date().toISOString(),
        read: false,
      })
    }

    // Overdue invoices
    invoices?.forEach(inv => {
      if (!inv.due_date) return
      if (isPast(parseISO(inv.due_date))) {
        generated.push({
          id: `invoice-${inv.id}`,
          type: 'invoice_overdue',
          title: `Invoice overdue`,
          body: `${inv.invoice_number} · $${Number(inv.total).toLocaleString()} past due`,
          href: '/invoices',
          severity: 'danger',
          created_at: new Date().toISOString(),
          read: false,
        })
      }
    })

    // Warranty expiry (90 days)
    warranties?.forEach(w => {
      if (!w.expiry_date) return
      const days = differenceInDays(parseISO(w.expiry_date), today)
      if (days >= 0 && days <= 90) {
        generated.push({
          id: `warranty-${w.id}`,
          type: 'warranty_expiry',
          title: `Warranty expiring in ${days} days`,
          body: `${w.item_name} · ${format(parseISO(w.expiry_date), 'MMM d, yyyy')}`,
          href: '/warranty',
          severity: days <= 30 ? 'warning' : 'info',
          created_at: new Date().toISOString(),
          read: false,
        })
      }
    })

    // Sort by severity
    const order = { danger: 0, warning: 1, info: 2 }
    generated.sort((a, b) => order[a.severity] - order[b.severity])

    setNotifications(generated)
    setLoading(false)
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(v => !v); if (!open) loadNotifications() }}
        style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', color: 'var(--text-secondary)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread > 0 && (
          <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#b83232', color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface)' }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 400 }} />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 360, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.15)', zIndex: 500, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</div>
                {unread > 0 && <div style={{ fontSize: 11, color: '#9e9d99' }}>{unread} unread</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {unread > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: 11, fontWeight: 600, color: '#d95f2b', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>Mark all read</button>
                )}
                <button onClick={() => { setOpen(false); loadNotifications() }} style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9d99', fontSize: 14 }}>↻</button>
              </div>
            </div>

            {/* Notifications list */}
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9e9d99', fontSize: 13 }}>Loading...</div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>All clear</div>
                  <div style={{ fontSize: 12, color: '#9e9d99' }}>No urgent alerts right now</div>
                </div>
              ) : (
                notifications.map(n => {
                  const cfg = SEVERITY_CONFIG[n.severity]
                  return (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => { markRead(n.id); setOpen(false) }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 18px', textDecoration: 'none', borderBottom: '1px solid var(--border)', background: n.read ? 'transparent' : cfg.bg, transition: 'background 0.1s' }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, border: `1px solid ${cfg.color}20` }}>
                        {cfg.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: 11, color: '#9e9d99', lineHeight: 1.4 }}>{n.body}</div>
                      </div>
                      {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 4 }} />}
                    </Link>
                  )
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
                <Link href="/dashboard" onClick={() => setOpen(false)} style={{ fontSize: 12, fontWeight: 600, color: '#d95f2b', textDecoration: 'none' }}>View Dashboard →</Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
