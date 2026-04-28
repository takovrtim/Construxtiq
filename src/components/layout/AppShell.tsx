'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Project } from '@/types'

interface Props {
  user: User
  projects: Project[]
  activeProject: Project | null
  children: React.ReactNode
}

export function AppShell({ user, projects, activeProject, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [showProjectDrop, setShowProjectDrop] = useState(false)
  const [currentProject, setCurrentProject] = useState<Project | null>(activeProject)

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
    { href: '/dashboard', label: 'Dashboard',  icon: iconGrid },
    { href: '/jobs',      label: 'Job Board',  icon: iconBriefcase },
    { href: '/documents', label: 'Documents',  icon: iconDoc },
    { href: '/bids',      label: 'Bids',       icon: iconDollar },
    { href: '/subs',      label: 'Crew & Subs',icon: iconPeople },
    { href: '/email',     label: 'Inbox',      icon: iconEmail },
  ]

  const initials = (user.full_name || user.email || 'CQ').slice(0, 2).toUpperCase()

  return (
    <div className="app-shell">
      {/* TOPBAR */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>
          <div style={{ width: 26, height: 26, background: '#1a1a1a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".6"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".35"/>
            </svg>
          </div>
          <span className="hide-mob">ConstructIQ</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProjectDrop(v => !v)}
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px 4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2d7a4f', flexShrink: 0 }} />
              <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentProject?.name ?? 'Select project'}
              </span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {showProjectDrop && (
              <>
                <div onClick={() => setShowProjectDrop(false)} style={{ position: 'fixed', inset: 0, zIndex: 400 }} />
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 220, zIndex: 500, overflow: 'hidden' }}>
                  {projects.map(p => (
                    <button key={p.id} onClick={() => switchProject(p)} style={{ width: '100%', padding: '9px 14px', textAlign: 'left', border: 'none', background: p.id === currentProject?.id ? '#f8f7f4' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#9e9d99', marginTop: 1 }}>{[p.city, p.state].filter(Boolean).join(', ')}</div>
                    </button>
                  ))}
                  <Link href="/dashboard?new=1" onClick={() => setShowProjectDrop(false)} style={{ display: 'block', padding: '9px 14px', fontSize: 13, color: '#d95f2b', fontWeight: 500, textDecoration: 'none' }}>
                    + New Project
                  </Link>
                </div>
              </>
            )}
          </div>
          <button onClick={signOut} title={`Sign out`} style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1a1a', color: 'white', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>
            {initials}
          </button>
        </div>
      </header>

      {/* SIDEBAR */}
      <nav className="sidebar">
        <div style={{ padding: '12px 10px 6px', fontSize: 10, fontWeight: 600, letterSpacing: '.7px', color: '#9e9d99', textTransform: 'uppercase' }}>
          The Repair Crew
        </div>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
              {item.icon}
              {item.label}
            </Link>
          )
        })}
        <div style={{ marginTop: 'auto', padding: '12px 10px 0', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>
            {iconSettings}
            Settings
          </Link>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="main-content">{children}</main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="bottom-nav">
        {navItems.slice(0, 5).map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={`bni ${active ? 'active' : ''}`}>
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

const iconGrid = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
const iconBriefcase = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="12"/></svg>
const iconDoc = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const iconDollar = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
const iconPeople = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const iconEmail = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const iconSettings = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>