'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '@/components/ThemeProvider'
import type { User, Project } from '@/types'

interface Props {
  user: User
  projects: Project[]
  activeProject: Project | null
  children: React.ReactNode
}

const iconGrid      = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
const iconBriefcase = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
const iconCalendar  = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const iconDoc       = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const iconDollar    = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
const iconPeople    = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const iconReport    = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
const iconChange    = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
const iconInspect   = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
const iconLog       = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
const iconInvoice   = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
const iconTimeline  = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><circle cx="7" cy="6" r="2" fill="currentColor"/><circle cx="14" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="18" r="2" fill="currentColor"/></svg>
const iconClock     = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const iconBox       = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
const iconSettings  = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>

export function AppShell({ user, projects, activeProject, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [showProjectDrop, setShowProjectDrop] = useState(false)
  const [showUserDrop, setShowUserDrop]       = useState(false)
  const [currentProject, setCurrentProject]   = useState<Project | null>(activeProject)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function switchProject(p: Project) {
    setCurrentProject(p)
    setShowProjectDrop(false)
    if (typeof window !== 'undefined') localStorage.setItem('active_project_id', p.id)
    router.refresh()
  }

  const navItems = [
    { href: '/dashboard',   label: 'Dashboard',     icon: iconGrid },
    { href: '/jobs',        label: 'Job Board',     icon: iconBriefcase },
    { href: '/timeline',    label: 'Timeline',      icon: iconTimeline },
    { href: '/calendar',    label: 'Calendar',      icon: iconCalendar },
    { href: '/documents',   label: 'Documents',     icon: iconDoc },
    { href: '/inspections', label: 'Inspections',   icon: iconInspect },
    { href: '/logs',        label: 'Daily Log',     icon: iconLog },
    { href: '/crew-time',   label: 'Crew Time',     icon: iconClock },
    { href: '/materials',   label: 'Materials',     icon: iconBox },
    { href: '/changes',     label: 'Change Orders', icon: iconChange },
    { href: '/invoices',    label: 'Invoices',      icon: iconInvoice },
    { href: '/bids',        label: 'Bids',          icon: iconDollar },
    { href: '/subs',        label: 'Crew & Subs',   icon: iconPeople },
    { href: '/reports',     label: 'Reports',       icon: iconReport },
  ]

  const bottomNav = [
    { href: '/dashboard',  label: 'Home',      icon: iconGrid },
    { href: '/jobs',       label: 'Jobs',      icon: iconBriefcase },
    { href: '/materials',  label: 'Materials', icon: iconBox },
    { href: '/changes',    label: 'Changes',   icon: iconChange },
    { href: '/invoices',   label: 'Invoice',   icon: iconInvoice },
  ]

  const initials    = (user.full_name || user.email || 'CQ').slice(0, 2).toUpperCase()
  const displayName = user.full_name || user.email || 'Account'

  return (
    <div className="app-shell">
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>
          <div style={{ width: 26, height: 26, background: '#d95f2b', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/>
            </svg>
          </div>
          <span className="hide-mob" style={{ letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>ConstructIQ</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowProjectDrop(v => !v); setShowUserDrop(false) }} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 12px 5px 9px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, color: 'var(--text-primary)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2d7a4f', flexShrink: 0 }} />
              <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentProject?.name ?? 'Select project'}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {showProjectDrop && (
              <>
                <div onClick={() => setShowProjectDrop(false)} style={{ position: 'fixed', inset: 0, zIndex: 400 }} />
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', minWidth: 230, zIndex: 500, overflow: 'hidden' }}>
                  {projects.length === 0 && <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-tertiary)' }}>No projects yet</div>}
                  {projects.map(p => (
                    <button key={p.id} onClick={() => switchProject(p)} style={{ width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', background: p.id === currentProject?.id ? 'var(--surface-2)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{[p.city, p.state].filter(Boolean).join(', ')}</div>
                    </button>
                  ))}
                  <Link href="/dashboard?new=1" onClick={() => setShowProjectDrop(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', fontSize: 13, color: '#d95f2b', fontWeight: 600, textDecoration: 'none' }}>+ New Project</Link>
                </div>
              </>
            )}
          </div>

          <ThemeToggle />

          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowUserDrop(v => !v); setShowProjectDrop(false) }} title={displayName} style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a1a', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--border)', fontFamily: 'inherit', letterSpacing: '0.3px' }}>
              {initials}
            </button>
            {showUserDrop && (
              <>
                <div onClick={() => setShowUserDrop(false)} style={{ position: 'fixed', inset: 0, zIndex: 400 }} />
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', minWidth: 210, zIndex: 500, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{user.full_name || 'Your Account'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{user.email}</div>
                    <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--action-light)', color: '#d95f2b', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{user.plan || 'Pro'} plan</div>
                  </div>
                  <div style={{ padding: '6px 0' }}>
                    <Link href="/settings" onClick={() => setShowUserDrop(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', fontSize: 13, color: 'var(--text-primary)', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                      Settings
                    </Link>
                    <Link href="/settings?tab=billing" onClick={() => setShowUserDrop(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', fontSize: 13, color: 'var(--text-primary)', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      Billing
                    </Link>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', padding: '6px 0' }}>
                    <button onClick={signOut} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', fontSize: 13, color: '#b83232', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }} onMouseEnter={e => (e.currentTarget.style.background = '#fdf0f0')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="sidebar">
        <div style={{ padding: '8px 18px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.8px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>ConstructIQ</div>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
              {item.icon}{item.label}
            </Link>
          )
        })}
        <div style={{ marginTop: 'auto', padding: '12px 8px 4px', borderTop: '1px solid var(--border)' }}>
          <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>{iconSettings}Settings</Link>
        </div>
      </nav>

      <main className="main-content">{children}</main>

      <nav className="bottom-nav">
        {bottomNav.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={`bni ${active ? 'active' : ''}`}>
              {item.icon}{item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}