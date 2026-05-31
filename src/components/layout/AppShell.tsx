'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, ClipboardList, FileText, Clock, MessageSquare,
  Target,
  Shield, Download, FolderOpen, Receipt, DollarSign, FileCheck,
  Users, ClipboardCheck, Image, Package, FileWarning, Hammer,
  UserCog, Settings, Menu, X, ChevronDown, LogOut, PenLine, Briefcase,
} from 'lucide-react'

interface User    { id: string; full_name: string; email: string; plan: string; company_name?: string }
interface Project { id: string; name: string; status: string }
interface Props   { user: User; projects: Project[]; activeProject: Project | null; children: React.ReactNode }

// ── NAV ORDER — by job site priority ─────────────────────────
// ── DAILY WORK — what John uses every single day ─────────────
const PRIMARY = [
  { href: '/dashboard',    label: 'Dashboard',     Icon: LayoutDashboard },
  { href: '/bid',          label: 'BidIQ',         Icon: Target          },
  { href: '/logs',         label: 'Daily Log',     Icon: ClipboardList   },
  { href: '/changes',      label: 'Change Orders', Icon: FileText        },
  { href: '/delay-tracker',label: 'Delay Tracker', Icon: Clock           },
  { href: '/RFI',          label: 'RFI Tracker',   Icon: MessageSquare   },
  { href: '/safety',       label: 'Safety',        Icon: Shield          },
]

// ── LEGAL SHIELD — case file and protection ───────────────────
const LEGAL = [
  { href: '/reports',      label: 'Audit Export',  Icon: Download        },
  { href: '/documents',    label: 'Documents AI',  Icon: FolderOpen      },
  { href: '/lien-waivers', label: 'Lien Waivers',  Icon: FileCheck       },
  { href: '/retention',    label: 'Retention',     Icon: DollarSign      },
  { href: '/invoices',     label: 'Invoices',      Icon: Receipt         },
]

// ── FIELD OPS — site management ──────────────────────────────
const ADMIN = [
  { href: '/jobs',         label: 'Jobs',          Icon: Briefcase       },
  { href: '/crew-time',    label: 'Crew Time',     Icon: Users           },
  { href: '/inspections',  label: 'Inspections',   Icon: ClipboardCheck  },
  { href: '/materials',    label: 'Materials',     Icon: Package         },
  { href: '/warranty',     label: 'Warranties',    Icon: FileWarning     },
  { href: '/settings',     label: 'Settings',      Icon: Settings        },
]

const BOTTOM = [
  { href: '/bids',         label: 'Bids',    Icon: TrendingUp      },
  { href: '/dashboard',    label: 'Home',    Icon: LayoutDashboard },
  { href: '/logs',         label: 'Log',     Icon: ClipboardList   },
  { href: '/changes',      label: 'COs',     Icon: FileText        },
  { href: '/delay-tracker',label: 'Delays',  Icon: Clock           },
]

// ── NAV ITEM ──────────────────────────────────────────────────
function NavItem({ href, label, Icon, active, onClick }: {
  href: string; label: string; Icon: any; active: boolean; onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '6px 10px', margin: '1px 0', borderRadius: 7,
        textDecoration: 'none', fontSize: 12,
        fontWeight: active ? 600 : 400,
        color: active ? '#FF6B1F' : '#7B8497',
        background: active ? 'rgba(255,107,31,0.08)' : 'transparent',
        borderLeft: `2px solid ${active ? '#FF6B1F' : 'transparent'}`,
        transition: 'all 0.12s',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.color = '#F1EEE5'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#7B8497'
        }
      }}
    >
      <Icon size={13} style={{ flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </Link>
  )
}

// ── NAV SECTION ───────────────────────────────────────────────
function NavSection({ label, items, pathname, onClick }: {
  label: string
  items: { href: string; label: string; Icon: any }[]
  pathname: string
  onClick?: () => void
}) {
  return (
    <div style={{ marginBottom: 18, padding: '0 8px' }}>
      <div style={{
        padding: '0 4px 5px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, fontWeight: 500, color: '#545B6C',
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {label}
      </div>
      {items.map(({ href, label: name, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return <NavItem key={href} href={href} label={name} Icon={Icon} active={active} onClick={onClick} />
      })}
    </div>
  )
}

// ── USER MENU ─────────────────────────────────────────────────
function UserMenu({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const initial = (user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: 30, height: 30, borderRadius: '50%', background: '#FF6B1F', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0A0E14' }}
      >
        {initial}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 210, background: '#131A26', border: '1px solid #232E42', borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', zIndex: 99, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #232E42', background: '#1A2333' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F1EEE5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'Account'}</div>
              <div style={{ fontSize: 11, color: '#7B8497', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#FF6B1F', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {user?.plan === 'trial' ? '14-day trial' : (user?.plan || 'Free')}
              </div>
            </div>
            {[{ href: '/settings', Icon: Settings, label: 'Settings' }, { href: '/reports', Icon: Download, label: 'Audit Export' }].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', fontSize: 12, color: '#B6BCCB', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1A2333')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <item.Icon size={13} style={{ color: '#7B8497' }} />{item.label}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid #232E42' }}>
              <button onClick={() => { setOpen(false); onSignOut() }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', fontSize: 12, color: '#FF5260', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,82,96,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={13} />Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── SIDEBAR INNER ─────────────────────────────────────────────
// The nav ref stores scroll position so it never resets on navigation
function SidebarInner({ projects, activeProject, user, onSignOut, onClose, navRef }: {
  projects: Project[]; activeProject: Project | null; user: User
  onSignOut: () => void; onClose?: () => void
  navRef?: React.RefObject<HTMLElement>
}) {
  const pathname = usePathname()
  const [showProjects, setShowProjects] = useState(false)
  const internalNavRef = useRef<HTMLElement>(null)
  const ref = navRef || internalNavRef

  // Save scroll position before navigation, restore after
  useEffect(() => {
    const nav = ref.current
    if (!nav) return
    const saved = sessionStorage.getItem('nav-scroll')
    if (saved) nav.scrollTop = parseInt(saved)
  }, [])

  const saveScroll = () => {
    if (ref.current) sessionStorage.setItem('nav-scroll', String(ref.current.scrollTop))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#07090E', overflow: 'hidden' }}>

      {/* Logo */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid #1A2333', flexShrink: 0 }}>
        <Link href="/dashboard" onClick={() => { saveScroll(); onClose?.() }} style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <svg viewBox="0 0 24 24" width={24} height={24}>
            <path d="M12 2 3 5v6.5C3 16.5 6.5 20 12 22c5.5-2 9-5.5 9-10.5V5l-9-3Z" fill="#FF6B1F" stroke="#FF6B1F" strokeWidth="1.2"/>
            <path d="m8 12 3 3 5-6" fill="none" stroke="#07090E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: '#F1EEE5', letterSpacing: '-0.5px' }}>
            Sub<span style={{ color: '#FF6B1F' }}>IQ</span>
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#545B6C', padding: 4, display: 'flex' }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* Project switcher */}
      {projects.length > 0 && (
        <div style={{ padding: '8px 8px', borderBottom: '1px solid #1A2333', flexShrink: 0, position: 'relative' }}>
          <button onClick={() => setShowProjects(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '6px 9px', borderRadius: 7, border: '1px solid #232E42', background: '#0B0F16', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4FE3B5', flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#F1EEE5' }}>
              {activeProject?.name || 'No project'}
            </span>
            <ChevronDown size={10} color="#545B6C" />
          </button>
          {showProjects && (
            <div style={{ position: 'absolute', top: '100%', left: 8, right: 8, background: '#131A26', border: '1px solid #232E42', borderRadius: 9, zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', marginTop: 3 }}>
              {projects.map(p => (
                <div key={p.id} onClick={() => setShowProjects(false)} style={{ padding: '8px 12px', fontSize: 12, fontWeight: p.id === activeProject?.id ? 700 : 400, color: p.id === activeProject?.id ? '#F1EEE5' : '#7B8497', cursor: 'pointer', background: p.id === activeProject?.id ? '#1A2333' : 'transparent' }}>
                  {p.name}
                </div>
              ))}
              <Link href="/dashboard" onClick={() => setShowProjects(false)} style={{ display: 'block', padding: '8px 12px', fontSize: 12, color: '#FF6B1F', fontWeight: 600, textDecoration: 'none', borderTop: '1px solid #232E42' }}>
                + New project
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Nav — THE ONLY SCROLLING ELEMENT */}
      <nav
        ref={ref as React.RefObject<HTMLElement>}
        onScroll={saveScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          overflowAnchor: 'none',
          padding: '10px 0 16px',
          scrollbarWidth: 'none',
        }}
      >
        <style>{`.sq-nav::-webkit-scrollbar{display:none}`}</style>
        <NavSection label="Daily Work"    items={PRIMARY} pathname={pathname} onClick={saveScroll} />
        <NavSection label="Legal Shield"  items={LEGAL}   pathname={pathname} onClick={saveScroll} />
        <NavSection label="Field Ops"         items={ADMIN}   pathname={pathname} onClick={saveScroll} />
      </nav>

      {/* User footer */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid #1A2333', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#FF6B1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0A0E14', flexShrink: 0 }}>
            {(user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#F1EEE5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.company_name || user?.full_name || 'Account'}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#545B6C', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {user?.plan === 'trial' ? '14-day trial' : (user?.plan || 'Free')}
            </div>
          </div>
          <button onClick={onSignOut} title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#545B6C', padding: 4, display: 'flex', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FF5260')}
            onMouseLeave={e => (e.currentTarget.style.color = '#545B6C')}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── APP SHELL ─────────────────────────────────────────────────
export function AppShell({ user, projects, activeProject, children }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [drawer, setDrawer] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .sq-root {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: #0B0F16;
          font-family: 'Space Grotesk', -apple-system, sans-serif;
          color: #F1EEE5;
        }

        /* Sidebar — overflow:hidden so it CANNOT scroll */
        .sq-sidebar {
          width: 232px;
          flex-shrink: 0;
          height: 100vh;
          overflow: hidden;
          border-right: 1px solid #1A2333;
        }

        .sq-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100vh;
          overflow: hidden;
        }

        .sq-topbar {
          height: 56px;
          background: #07090E;
          border-bottom: 1px solid #1A2333;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          flex-shrink: 0;
          gap: 12px;
        }

        /* Content scroll — independent from sidebar */
        .sq-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          overflow-anchor: none;
          background: #0B0F16;
          -webkit-overflow-scrolling: touch;
        }
        .sq-content::-webkit-scrollbar { width: 4px; }
        .sq-content::-webkit-scrollbar-track { background: transparent; }
        .sq-content::-webkit-scrollbar-thumb { background: #232E42; border-radius: 2px; }

        .sq-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 28px 28px 100px;
        }

        .sq-hamburger {
          display: none;
          background: none; border: none;
          cursor: pointer; color: #F1EEE5;
          padding: 4px; align-items: center;
        }

        .sq-mob-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0;
          background: #07090E;
          border-top: 1px solid #1A2333;
          padding-bottom: env(safe-area-inset-bottom);
          z-index: 200;
        }

        @media (max-width: 768px) {
          .sq-sidebar     { display: none; }
          .sq-hamburger   { display: flex !important; }
          .sq-hide-mob    { display: none !important; }
          .sq-mob-nav     { display: block; }
          .sq-inner       { padding: 16px 16px 90px; }
        }
      `}</style>

      <div className="sq-root">

        {/* Desktop sidebar */}
        <aside className="sq-sidebar">
          <SidebarInner
            projects={projects} activeProject={activeProject}
            user={user} onSignOut={signOut} navRef={navRef}
          />
        </aside>

        {/* Main */}
        <div className="sq-main">
          <header className="sq-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="sq-hamburger" onClick={() => setDrawer(true)}>
                <Menu size={19} />
              </button>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F1EEE5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                  {activeProject?.name || 'SubIQ'}
                </div>
                {activeProject && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#545B6C', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Active project
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link href="/reports" style={{ textDecoration: 'none' }} className="sq-hide-mob">
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 7, cursor: 'pointer', border: '1px solid #232E42', background: 'transparent', color: '#B6BCCB', fontFamily: 'inherit' }}>
                  <Download size={12} />Audit Export
                </button>
              </Link>
              <UserMenu user={user} onSignOut={signOut} />
            </div>
          </header>

          <div className="sq-content">
            <div className="sq-inner">
              {children}
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {drawer && (
          <div onClick={() => setDrawer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, backdropFilter: 'blur(4px)' }} />
        )}

        {/* Mobile drawer */}
        <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 256, zIndex: 400, transform: drawer ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease', boxShadow: '4px 0 40px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
          <SidebarInner
            projects={projects} activeProject={activeProject}
            user={user} onSignOut={signOut} onClose={() => setDrawer(false)}
          />
        </div>

        {/* Mobile bottom nav */}
        <nav className="sq-mob-nav">
          <div style={{ display: 'flex' }}>
            {BOTTOM.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '9px 4px 7px', textDecoration: 'none', color: active ? '#FF6B1F' : '#545B6C', fontSize: 9, fontWeight: active ? 700 : 400, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  <Icon size={18} />
                  {label}
                </Link>
              )
            })}
          </div>
        </nav>

      </div>
    </>
  )
}