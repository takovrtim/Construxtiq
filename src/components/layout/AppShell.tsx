'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface User { id: string; full_name: string; email: string; plan: string; company_name?: string }
interface Project { id: string; name: string; status: string }
interface Props { user: User; projects: Project[]; activeProject: Project | null; children: React.ReactNode }

// ── CORE 5 — always visible, always fast ──────────────────
const CORE_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠', desc: 'Morning briefing' },
  { href: '/jobs',      label: 'Job Board',  icon: '🔧', desc: 'Active jobs'      },
  { href: '/logs',      label: 'Daily Log',  icon: '📝', desc: 'Log today'        },
  { href: '/changes',   label: 'Changes',    icon: '🔄', desc: 'GC approvals'     },
  { href: '/safety',    label: 'Safety',     icon: '🦺', desc: 'Pre-job check'    },
]

// ── POWER TOOLS — one tap away ────────────────────────────
const POWER_NAV = [
  { href: '/delay-tracker',  label: 'Delay Tracker',    icon: '📅' },
  { href: '/rfi',            label: 'RFI Tracker',      icon: '📋' },
  { href: '/retention',      label: 'Retention',        icon: '💰' },
  { href: '/lien-waivers',   label: 'Lien Waivers',     icon: '📄' },
  { href: '/invoices',       label: 'Invoices',         icon: '💵' },
]

// ── BACK OFFICE ───────────────────────────────────────────
const BACK_OFFICE = [
  { href: '/crew-time',    label: 'Crew Time',      icon: '⏱️' },
  { href: '/inspections',  label: 'Inspections',    icon: '🔍' },
  { href: '/documents',    label: 'Documents',      icon: '🗂️' },
  { href: '/photos',       label: 'Photos',         icon: '📸' },
  { href: '/materials',    label: 'Materials',      icon: '📦' },
  { href: '/warranties',   label: 'Warranties',     icon: '🛡️' },
  { href: '/bids',         label: 'Bids',           icon: '📐' },
  { href: '/subs',         label: 'Subs & Crew',    icon: '👷' },
  { href: '/reports',      label: 'Reports',        icon: '📊' },
  { href: '/settings',     label: 'Settings',       icon: '⚙️' },
]

// ── MOBILE BOTTOM NAV ─────────────────────────────────────
const BOTTOM_NAV = [
  { href: '/dashboard',    label: 'Home',    icon: '🏠' },
  { href: '/jobs',         label: 'Jobs',    icon: '🔧' },
  { href: '/safety',       label: 'Safety',  icon: '🦺' },
  { href: '/changes',      label: 'Changes', icon: '🔄' },
  { href: '/delay-tracker',label: 'Delays',  icon: '📅' },
]

export function AppShell({ user, projects, activeProject, children }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [showProjectDrop, setShowProjectDrop] = useState(false)
  const [showMore, setShowMore]             = useState(false)
  const [signingOut, setSigningOut]         = useState(false)

  async function signOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body { height: 100%; overflow: hidden; }
        .app-root { display: flex; height: 100vh; overflow: hidden; background: var(--cream); }

        /* ── SIDEBAR ── */
        .sidebar {
          width: 228px; flex-shrink: 0;
          background: var(--white);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          height: 100vh; overflow: hidden;
        }
        .sidebar-nav {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          scrollbar-width: none; padding-bottom: 8px;
        }
        .sidebar-nav::-webkit-scrollbar { display: none; }
        .sidebar-footer {
          flex-shrink: 0;
          border-top: 1px solid var(--border);
          background: var(--white);
        }

        /* ── MAIN ── */
        .main-area { flex: 1; min-width: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        .topbar {
          flex-shrink: 0;
          z-index: 100;
          background: rgba(248,247,244,0.95);
          border-bottom: 1px solid var(--border);
          height: 54px; display: flex; align-items: center;
          justify-content: space-between; padding: 0 20px; gap: 12px;
        }
        .page-content { flex: 1; overflow-y: auto; padding: 24px 28px 100px; }
        .page-content-inner { max-width: 1200px; width: 100%; margin: 0 auto; }

        /* ── NAV ITEMS ── */
        .nav-core {
          display: flex; align-items: center; gap: 10;
          padding: 10px 14px; border-radius: 10px;
          text-decoration: none; margin: 1px 8px;
          transition: background 0.1s; color: var(--text-primary);
          font-size: 13px; font-weight: 500;
        }
        .nav-core.active {
          background: #0f0f0f; color: white; font-weight: 700;
        }
        .nav-core:not(.active):hover { background: var(--surface-2); }
        .nav-core .nav-icon { font-size: 17px; width: 22px; text-align: center; flex-shrink: 0; }

        .nav-power {
          display: flex; align-items: center; gap: 8;
          padding: 7px 14px; border-radius: 8px;
          text-decoration: none; margin: 1px 8px;
          transition: background 0.1s; color: var(--text-secondary);
          font-size: 12px; font-weight: 500;
        }
        .nav-power.active { background: var(--surface-2); color: var(--text-primary); font-weight: 700; }
        .nav-power:not(.active):hover { background: var(--surface-2); color: var(--text-primary); }
        .nav-power .nav-icon { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }

        .section-label {
          font-size: 10px; font-weight: 700; color: var(--text-tertiary);
          text-transform: uppercase; letter-spacing: 0.8px;
          padding: 10px 22px 4px;
        }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .page-content { padding: 16px 16px 90px; }
          .page-content-inner { max-width: 100%; }
          .topbar { padding: 0 16px; }
          .bottom-nav { display: flex !important; }
          .topbar-project { max-width: 160px; }
        }

        /* ── BOTTOM NAV ── */
        .bottom-nav {
          display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
          background: var(--surface); border-top: 1px solid var(--border);
          padding-bottom: env(safe-area-inset-bottom);
        }
        .bottom-nav-inner { display: flex; }
        .bni {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 3; padding: 10px 4px 8px;
          text-decoration: none; color: var(--text-tertiary); font-size: 10px; font-weight: 500;
          transition: color 0.1s;
        }
        .bni.active { color: #d95f2b; font-weight: 700; }
        .bni-icon { font-size: 20px; line-height: 1; }

        /* ── DRAWER OVERLAY ── */
        .drawer-overlay {
          display: none; position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
        }
        .drawer-overlay.open { display: block; }
        .drawer {
          position: fixed; left: 0; top: 0; bottom: 0; width: 280px; z-index: 400;
          background: var(--white); overflow-y: auto; transform: translateX(-100%);
          transition: transform 0.25s ease; box-shadow: 4px 0 32px rgba(0,0,0,0.12);
        }
        .drawer.open { transform: translateX(0); }
      `}</style>

      <div className="app-root">

        {/* ── DESKTOP SIDEBAR ─────────────────────────────── */}
        <aside className="sidebar">
          {/* Logo */}
          <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 28, height: 28, background: '#d95f2b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.5px', color: '#0a0a0a' }}>ConstructIQ</span>
          </div>

          {/* Project switcher */}
          {projects.length > 0 && (
            <div style={{ margin: '8px 8px 4px', position: 'relative' }}>
              <button onClick={() => setShowProjectDrop(v => !v)} style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2d7a4f', flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{activeProject?.name || 'No project'}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>▾</span>
              </button>
              {showProjectDrop && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, marginTop: 4, overflow: 'hidden' }}>
                  {projects.map(p => (
                    <div key={p.id} onClick={() => setShowProjectDrop(false)} style={{ padding: '10px 14px', fontSize: 12, fontWeight: p.id === activeProject?.id ? 700 : 400, color: 'var(--text-primary)', cursor: 'pointer', background: p.id === activeProject?.id ? 'var(--surface-2)' : 'transparent' }}>
                      {p.name}
                    </div>
                  ))}
                  <Link href="/dashboard" onClick={() => setShowProjectDrop(false)} style={{ display: 'block', padding: '10px 14px', fontSize: 12, color: '#d95f2b', fontWeight: 600, textDecoration: 'none', borderTop: '1px solid var(--border)' }}>+ New project</Link>
                </div>
              )}
            </div>
          )}

          {/* ── SCROLLABLE NAV ── */}
          <div className="sidebar-nav">
            <div style={{ marginTop: 8 }}>
              <div className="section-label">Core</div>
              {CORE_NAV.map(item => (
                <Link key={item.href} href={item.href} className={`nav-core ${isActive(item.href) ? 'active' : ''}`}>
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="section-label">Protection</div>
              {POWER_NAV.map(item => (
                <Link key={item.href} href={item.href} className={`nav-power ${isActive(item.href) ? 'active' : ''}`}>
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="section-label">Field & Admin</div>
              {BACK_OFFICE.map(item => (
                <Link key={item.href} href={item.href} className={`nav-power ${isActive(item.href) ? 'active' : ''}`}>
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── PINNED FOOTER ── */}
          <div className="sidebar-footer" style={{ padding: '10px 8px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#d95f2b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'Account'}</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.plan === 'trial' ? '14-day trial' : user?.plan}</div>
              </div>
              <button onClick={signOut} disabled={signingOut} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-tertiary)', padding: 4 }}>↗</button>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────── */}
        <div className="main-area">

          {/* Topbar */}
          <header className="topbar">
            {/* Mobile hamburger */}
            <button onClick={() => setSidebarOpen(true)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4, color: 'var(--text-primary)' }} className="hamburger">☰</button>

            {/* Project name - mobile */}
            <div className="topbar-project" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                {activeProject?.name || 'ConstructIQ'}
              </div>
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Alert badge */}
              <Link href="/safety" style={{ textDecoration: 'none', position: 'relative' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔔</div>
              </Link>
              {/* User avatar */}
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#d95f2b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer' }} onClick={signOut}>
                {user?.full_name?.[0] || 'U'}
              </div>
            </div>
          </header>

          <style>{`
            @media (max-width: 768px) {
              .hamburger { display: flex !important; }
              .topbar-project { display: block; }
            }
          `}</style>

          {/* Page content */}
          <main className="page-content">
            <div className="page-content-inner">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* ── MOBILE DRAWER ────────────────────────────────── */}
      <div className={`drawer-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className={`drawer ${sidebarOpen ? 'open' : ''}`}>
        <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 26, height: 26, background: '#d95f2b', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.5px' }}>ConstructIQ</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-tertiary)' }}>✕</button>
        </div>

        <div style={{ padding: '8px 0 16px', overflow: 'auto' }}>
          <div className="section-label">Core</div>
          {CORE_NAV.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={`nav-core ${isActive(item.href) ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="section-label" style={{ marginTop: 12 }}>Protection</div>
          {POWER_NAV.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={`nav-power ${isActive(item.href) ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="section-label" style={{ marginTop: 12 }}>Field & Admin</div>
          {BACK_OFFICE.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={`nav-power ${isActive(item.href) ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          <div style={{ padding: '16px 14px 0', borderTop: '1px solid var(--border)', marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#d95f2b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>
                {user?.full_name?.[0] || 'U'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{user?.full_name || 'Account'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{user?.plan === 'trial' ? '14-day trial' : user?.plan}</div>
              </div>
            </div>
            <button onClick={signOut} style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface-2)', fontFamily: 'inherit', color: 'var(--text-secondary)' }}>Sign out</button>
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ────────────────────────────── */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {BOTTOM_NAV.map(item => (
            <Link key={item.href} href={item.href} className={`bni ${isActive(item.href) ? 'active' : ''}`}>
              <span className="bni-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
