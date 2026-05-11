'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface User    { id: string; full_name: string; email: string; plan: string; company_name?: string }
interface Project { id: string; name: string; status: string }
interface Props   { user: User; projects: Project[]; activeProject: Project | null; children: React.ReactNode }

const CORE = [
  { href: '/dashboard',    label: 'Dashboard',    icon: '🏠' },
  { href: '/jobs',         label: 'Job Board',    icon: '🔧' },
  { href: '/logs',         label: 'Daily Log',    icon: '📝' },
  { href: '/changes',      label: 'Change Orders',icon: '🔄' },
  { href: '/safety',       label: 'Safety',       icon: '🦺' },
]

const PROTECTION = [
  { href: '/delay-tracker',label: 'Delay Tracker',icon: '📅' },
  { href: '/rfi',          label: 'RFI Tracker',  icon: '📋' },
  { href: '/retention',    label: 'Retention',    icon: '💰' },
  { href: '/lien-waivers', label: 'Lien Waivers', icon: '📄' },
  { href: '/invoices',     label: 'Invoices',     icon: '💵' },
  { href: '/reports',      label: 'Audit Export', icon: '⚖️' },
]

const FIELD = [
  { href: '/crew-time',    label: 'Crew Time',    icon: '⏱️' },
  { href: '/inspections',  label: 'Inspections',  icon: '🔍' },
  { href: '/documents',    label: 'Documents',    icon: '🗂️' },
  { href: '/photos',       label: 'Photos',       icon: '📸' },
  { href: '/materials',    label: 'Materials',    icon: '📦' },
  { href: '/warranty',     label: 'Warranties',   icon: '🛡️' },
  { href: '/bids',         label: 'Bids',         icon: '📐' },
  { href: '/subs',         label: 'Subs & Crew',  icon: '👷' },
  { href: '/settings',     label: 'Settings',     icon: '⚙️' },
]

const BOTTOM = [
  { href: '/dashboard',    label: 'Home',    icon: '🏠' },
  { href: '/jobs',         label: 'Jobs',    icon: '🔧' },
  { href: '/safety',       label: 'Safety',  icon: '🦺' },
  { href: '/changes',      label: 'Changes', icon: '🔄' },
  { href: '/reports',      label: 'Audit',   icon: '⚖️' },
]

function NavItems({ items, className, onClick }: { items: typeof CORE; className: string; onClick?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      {items.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link key={item.href} href={item.href} className={`${className} ${active ? 'active' : ''}`} onClick={onClick}>
            <span className="ni">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </>
  )
}

function SidebarContent({ projects, activeProject, user, onSignOut, onClose }: {
  projects: Project[]; activeProject: Project | null; user: User
  onSignOut: () => void; onClose?: () => void
}) {
  const [showProjects, setShowProjects] = useState(false)

  return (
    <>
      {/* Logo */}
      <Link href="/dashboard" className="nav-logo" onClick={onClose}>
        <div className="nav-logo-mark">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
            <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/>
            <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
            <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/>
          </svg>
        </div>
        <span className="nav-logo-text">ConstructIQ</span>
      </Link>

      {/* Project switcher */}
      {projects.length > 0 && (
        <div style={{ margin: '6px 6px 4px', position: 'relative' }}>
          <button onClick={() => setShowProjects(v => !v)} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
            <div className="dot dot-green" />
            <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{activeProject?.name || 'No project'}</span>
            <span style={{ color: 'var(--text-3)', fontSize: 9 }}>▾</span>
          </button>
          {showProjects && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow)', zIndex: 50, marginTop: 4, overflow: 'hidden' }}>
              {projects.map(p => (
                <div key={p.id} onClick={() => setShowProjects(false)} style={{ padding: '9px 12px', fontSize: 12, fontWeight: p.id === activeProject?.id ? 700 : 400, color: 'var(--text)', cursor: 'pointer', background: p.id === activeProject?.id ? 'var(--surface-2)' : 'transparent' }}>
                  {p.name}
                </div>
              ))}
              <Link href="/dashboard" onClick={() => setShowProjects(false)} style={{ display: 'block', padding: '9px 12px', fontSize: 12, color: 'var(--orange)', fontWeight: 600, textDecoration: 'none', borderTop: '1px solid var(--border)' }}>
                + New project
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Scrollable nav */}
      <div className="sidebar-scroll">
        <div className="nav-section-label">Core</div>
        <NavItems items={CORE} className="nav-core" onClick={onClose} />

        <div className="nav-section-label" style={{ marginTop: 8 }}>Protection</div>
        <NavItems items={PROTECTION} className="nav-item" onClick={onClose} />

        <div className="nav-section-label" style={{ marginTop: 8 }}>Field & Admin</div>
        <NavItems items={FIELD} className="nav-item" onClick={onClose} />
      </div>

      {/* Pinned footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
            {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'Account'}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{user?.plan === 'trial' ? '14-day trial' : (user?.plan || 'Free')}</div>
          </div>
          <button onClick={onSignOut} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-3)', padding: 4, borderRadius: 6, transition: 'background 0.1s' }}>
            ↗
          </button>
        </div>
      </div>
    </>
  )
}

function UserMenu({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const initial = user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'
  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer', userSelect: 'none' }}
      >
        {initial}
      </div>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 99, overflow: 'hidden' }}>
            {/* User info */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'Account'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--orange)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {user?.plan === 'trial' ? '14-day trial' : (user?.plan || 'Free')}
              </div>
            </div>
            {/* Menu items */}
            {[
              { href: '/settings', icon: '⚙️', label: 'Settings' },
              { href: '/reports',  icon: '⚖️', label: 'Audit Export' },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => { setOpen(false); onSignOut() }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 15 }}>↗</span>
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function AppShell({ user, projects, activeProject, children }: Props) {
  const router        = useRouter()
  const pathname      = usePathname()
  const [drawer, setDrawer]     = useState(false)
  const [signingOut, setSignOut] = useState(false)

  async function signOut() {
    setSignOut(true)
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="app-shell">

      {/* Desktop sidebar */}
      <aside className="sidebar">
        <SidebarContent projects={projects} activeProject={activeProject} user={user} onSignOut={signOut} />
      </aside>

      {/* Main */}
      <div className="main-area">

        {/* Topbar */}
        <header className="topbar">
          <div className="flex items-center gap-12">
            {/* Mobile hamburger */}
            <button onClick={() => setDrawer(true)} className="hamburger" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4, color: 'var(--text)' }}>
              ☰
            </button>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
              {activeProject?.name || 'ConstructIQ'}
            </div>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/reports" style={{ textDecoration: 'none' }}>
              <button className="btn btn-sm btn-outline hide-mobile" style={{ fontSize: 11, gap: 5 }}>
                <span>⚖️</span> Audit Export
              </button>
            </Link>
            <UserMenu user={user} onSignOut={signOut} />
          </div>
        </header>

        <style>{`
          @media (max-width: 768px) {
            .hamburger { display: flex !important; }
          }
        `}</style>

        {/* Page content */}
        <div className="page-scroll">
          <div className="page-inner">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      <div className={`drawer-overlay ${drawer ? 'open' : ''}`} onClick={() => setDrawer(false)} />

      {/* Mobile drawer */}
      <div className={`drawer ${drawer ? 'open' : ''}`}>
        <SidebarContent projects={projects} activeProject={activeProject} user={user} onSignOut={signOut} onClose={() => setDrawer(false)} />
      </div>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {BOTTOM.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} className={`bni ${active ? 'active' : ''}`}>
                <span className="bni-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
