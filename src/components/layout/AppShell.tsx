'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '@/components/ThemeProvider'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import type { User, Project } from '@/types'

interface Props {
  user: User
  projects: Project[]
  activeProject: Project | null
  children: React.ReactNode
}

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { href: '/dashboard',  label: 'Dashboard'      },
      { href: '/jobs',       label: 'Job Board'      },
      { href: '/timeline',   label: 'Timeline'       },
      { href: '/calendar',   label: 'Calendar'       },
    ],
  },
  {
    label: 'Field',
    items: [
      { href: '/inspections', label: 'Inspections'   },
      { href: '/safety',      label: 'Safety'        },
      { href: '/logs',        label: 'Daily Log'     },
      { href: '/crew-time',   label: 'Crew Time'     },
      { href: '/materials',   label: 'Materials'     },
      { href: '/photos',      label: 'Photos'        },
    ],
  },
  {
    label: 'Money',
    items: [
      { href: '/job-costing', label: 'Job Costing'   },
      { href: '/changes',     label: 'Change Orders' },
      { href: '/invoices',    label: 'Invoices'      },
      { href: '/bids',        label: 'Bids'          },
    ],
  },
  {
    label: 'People & Docs',
    items: [
      { href: '/client-comms', label: 'Client Comms' },
      { href: '/documents',    label: 'Documents'    },
      { href: '/subs',         label: 'Crew & Subs'  },
      { href: '/warranty',     label: 'Warranties'   },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/reports', label: 'Reports' },
    ],
  },
]

const BOTTOM_NAV = [
  { href: '/dashboard', label: 'Home'    },
  { href: '/jobs',      label: 'Jobs'    },
  { href: '/logs',      label: 'Log'     },
  { href: '/changes',   label: 'Changes' },
  { href: '/invoices',  label: 'Invoice' },
]

export function AppShell({ user, projects, activeProject, children }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const [showProjectDrop, setShowProjectDrop] = useState(false)
  const [showUserDrop, setShowUserDrop]       = useState(false)
  const [currentProject, setCurrentProject]   = useState<Project | null>(activeProject)
  const [sidebarOpen, setSidebarOpen]         = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function switchProject(p: Project) {
    setCurrentProject(p)
    setShowProjectDrop(false)
    router.refresh()
  }

  const firstName = (user.full_name || user.email || '').split(/[\s@]/)[0] || 'there'
  const initials  = (user.full_name || user.email || 'U').slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-2)', fontFamily: 'var(--font-sans, -apple-system, sans-serif)' }}>

      {/* ── SIDEBAR ── */}
      <>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 89, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} />
        )}

        <aside style={{
          width: 220,
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? 0 : undefined,
          bottom: 0,
          zIndex: 90,
          overflowY: 'auto',
          transition: 'transform 0.25s ease',
        }} className="sidebar">
          <style>{`
            .sidebar { }
            @media (max-width: 768px) {
              .sidebar { transform: translateX(${sidebarOpen ? '0' : '-100%'}); left: 0; }
              .main-area { margin-left: 0 !important; }
            }

            .nav-group-label {
              font-size: 9px;
              font-weight: 700;
              color: var(--text-tertiary);
              text-transform: uppercase;
              letter-spacing: 0.8px;
              padding: 14px 14px 4px;
            }
            .nav-item {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 7px 12px;
              border-radius: 8px;
              margin: 1px 6px;
              font-size: 13px;
              font-weight: 400;
              color: var(--text-secondary);
              text-decoration: none;
              transition: all 0.1s;
            }
            .nav-item:hover { background: var(--surface-2); color: var(--text-primary); }
            .nav-item.active { background: var(--surface-2); color: var(--text-primary); font-weight: 600; }
            .nav-item.active::before { content: ''; width: 3px; height: 16px; background: #d95f2b; border-radius: 2px; margin-left: -4px; margin-right: 1px; }

            .bni {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 3px;
              padding: 8px 4px;
              border-radius: 10px;
              font-size: 10px;
              font-weight: 500;
              color: var(--text-tertiary);
              text-decoration: none;
              flex: 1;
              transition: all 0.1s;
            }
            .bni.active { color: #d95f2b; }
            .bni:hover { color: var(--text-primary); }
          `}</style>

          {/* Logo */}
          <div style={{ padding: '16px 14px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div style={{ width: 26, height: 26, background: '#d95f2b', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>ConstructIQ</span>
            </Link>
          </div>

          {/* Project switcher */}
          <div style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0, position: 'relative' }}>
            <button
              onClick={() => setShowProjectDrop(v => !v)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 5, background: '#d95f2b', fontSize: 9, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {currentProject?.name?.slice(0,1) || 'P'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentProject?.name || 'Select project'}
                </div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {showProjectDrop && (
              <>
                <div onClick={() => setShowProjectDrop(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                <div style={{ position: 'absolute', top: '100%', left: 8, right: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 99, overflow: 'hidden', marginTop: 4 }}>
                  {projects.map(p => (
                    <button key={p.id} onClick={() => switchProject(p)} style={{ width: '100%', padding: '10px 14px', border: 'none', background: p.id === currentProject?.id ? 'var(--surface-2)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: 'var(--text-primary)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: '#d95f2b', fontSize: 8, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{p.name.slice(0,1)}</div>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      {p.id === currentProject?.id && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="M5 13l4 4L19 7" stroke="#d95f2b" strokeWidth="2.5" strokeLinecap="round"/></svg>}
                    </button>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <Link href="/onboarding" onClick={() => setShowProjectDrop(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', fontSize: 12, color: '#d95f2b', fontWeight: 600, textDecoration: 'none' }}>
                      + New project
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Nav groups */}
          <nav style={{ flex: 1, paddingBottom: 80, overflowY: 'auto' }}>
            {NAV_GROUPS.map(group => (
              <div key={group.label}>
                <div className="nav-group-label">{group.label}</div>
                {group.items.map(item => {
                  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  return (
                    <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Settings at bottom */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '8px 6px', flexShrink: 0 }}>
            <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>
              ⚙️ Settings
            </Link>
          </div>
        </aside>
      </>

      {/* ── MAIN ── */}
      <div className="main-area" style={{ flex: 1, marginLeft: 220, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Topbar */}
        <header style={{ height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 80, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mobile menu button */}
            <button onClick={() => setSidebarOpen(v => !v)} style={{ display: 'none', width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }} className="mobile-menu-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <style>{`
              @media (max-width: 768px) {
                .mobile-menu-btn { display: flex !important; }
              }
            `}</style>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {currentProject?.name || 'ConstructIQ'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThemeToggle />
            <NotificationBell projectId={currentProject?.id || null} userId={user.id} />

            {/* User avatar */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowUserDrop(v => !v)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#0f0f0f', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {initials}
              </button>
              {showUserDrop && (
                <>
                  <div onClick={() => setShowUserDrop(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 99, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{firstName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{user.email}</div>
                    </div>
                    <Link href="/settings" onClick={() => setShowUserDrop(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: 'var(--text-primary)', textDecoration: 'none' }}>
                      ⚙️ Settings
                    </Link>
                    <Link href="/settings?tab=billing" onClick={() => setShowUserDrop(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: 'var(--text-primary)', textDecoration: 'none' }}>
                      💳 Billing
                    </Link>
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      <button onClick={signOut} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: '#b83232', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                        🚪 Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '24px 20px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }} className="main-content">
          {children}
        </main>

        {/* Bottom nav (mobile) */}
        <nav style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 80, background: 'var(--surface)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }} className="bottom-nav">
          <style>{`
            @media (max-width: 768px) {
              .bottom-nav { display: flex !important; }
              .main-area { margin-left: 0 !important; }
            }
          `}</style>
          <div style={{ display: 'flex', width: '100%', padding: '4px 8px' }}>
            {BOTTOM_NAV.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} className={`bni ${active ? 'active' : ''}`}>
                  <div style={{ fontSize: 18 }}>
                    {item.href === '/dashboard' ? '🏠' :
                     item.href === '/jobs'      ? '🔧' :
                     item.href === '/logs'      ? '📝' :
                     item.href === '/changes'   ? '🔄' : '💵'}
                  </div>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
