'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, Briefcase, ClipboardList, FileText, Shield,
  Clock, MessageSquare, DollarSign, FileCheck, Receipt, Download,
  Users, ClipboardCheck, FolderOpen, Image, Package, FileWarning,
  Hammer, UserCog, Settings, Menu, X, ChevronDown, LogOut, PenLine,
} from 'lucide-react'

interface User    { id: string; full_name: string; email: string; plan: string; company_name?: string }
interface Project { id: string; name: string; status: string }
interface Props   { user: User; projects: Project[]; activeProject: Project | null; children: React.ReactNode }

const CORE = [
  { href: '/dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
  { href: '/jobs',      label: 'Jobs',        Icon: Briefcase       },
  { href: '/logs',      label: 'Daily Log',   Icon: ClipboardList   },
  { href: '/changes',   label: 'Changes',     Icon: FileText        },
  { href: '/safety',    label: 'Safety',      Icon: Shield          },
]

const PROTECTION = [
  { href: '/delay-tracker', label: 'Delay Tracker', Icon: Clock         },
  { href: '/RFI',           label: 'RFI Tracker',   Icon: MessageSquare },
  { href: '/retention',     label: 'Retention',     Icon: DollarSign    },
  { href: '/lien-waivers',  label: 'Lien Waivers',  Icon: FileCheck     },
  { href: '/invoices',      label: 'Invoices',       Icon: Receipt       },
  { href: '/reports',       label: 'Audit Export',  Icon: Download      },
]

const FIELD = [
  { href: '/crew-time',   label: 'Crew Time',   Icon: Users          },
  { href: '/inspections', label: 'Inspections', Icon: ClipboardCheck },
  { href: '/documents',   label: 'Documents',   Icon: FolderOpen     },
  { href: '/drawing-log', label: 'Drawing Log',  Icon: PenLine        },
  { href: '/photos',      label: 'Photos',      Icon: Image          },
  { href: '/materials',   label: 'Materials',   Icon: Package        },
  { href: '/warranty',    label: 'Warranties',  Icon: FileWarning    },
  { href: '/bids',        label: 'Bids',        Icon: Hammer         },
  { href: '/subs',        label: 'Subs & Crew', Icon: UserCog        },
  { href: '/settings',    label: 'Settings',    Icon: Settings       },
]

const BOTTOM = [
  { href: '/dashboard', label: 'Home',    Icon: LayoutDashboard },
  { href: '/jobs',      label: 'Jobs',    Icon: Briefcase       },
  { href: '/safety',    label: 'Safety',  Icon: Shield          },
  { href: '/changes',   label: 'Changes', Icon: FileText        },
  { href: '/reports',   label: 'Audit',   Icon: Download        },
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
        padding: '7px 10px', margin: '1px 0', borderRadius: 8,
        textDecoration: 'none', fontSize: 12, fontWeight: active ? 600 : 400,
        color: active ? '#FF6B1F' : '#7B8497',
        background: active ? 'rgba(255,107,31,0.1)' : 'transparent',
        borderLeft: active ? '2px solid #FF6B1F' : '2px solid transparent',
        transition: 'all 0.1s',
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
      <Icon size={14} style={{ flexShrink: 0 }} />
      {label}
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
    <div style={{ marginBottom: 20, padding: '0 10px' }}>
      <div style={{
        padding: '0 2px 6px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, fontWeight: 600, color: '#545B6C',
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
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#FF6B1F', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#0A0E14', flexShrink: 0,
        }}
      >
        {initial}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 8,
            width: 220, background: '#131A26', border: '1px solid #232E42',
            borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            zIndex: 99, overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #232E42', background: '#1A2333' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F1EEE5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.full_name || 'Account'}
              </div>
              <div style={{ fontSize: 11, color: '#7B8497', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: '#FF6B1F', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {user?.plan === 'trial' ? '14-day trial' : (user?.plan || 'Free')}
              </div>
            </div>
            {[
              { href: '/settings', Icon: Settings, label: 'Settings' },
              { href: '/reports',  Icon: Download, label: 'Audit Export' },
            ].map(item => (
              <Link
                key={item.href} href={item.href}
                onClick={() => setOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: '#B6BCCB', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1A2333')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <item.Icon size={14} style={{ color: '#7B8497' }} />
                {item.label}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid #232E42' }}>
              <button
                onClick={() => { setOpen(false); onSignOut() }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: '#FF5260', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,82,96,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── SIDEBAR INNER ─────────────────────────────────────────────
function SidebarInner({ projects, activeProject, user, onSignOut, onClose }: {
  projects: Project[]; activeProject: Project | null; user: User
  onSignOut: () => void; onClose?: () => void
}) {
  const pathname = usePathname()
  const [showProjects, setShowProjects] = useState(false)

  return (
    // KEY FIX: This container is flex column with fixed height
    // The nav inside is the ONLY thing that scrolls
    // The header and footer are flex-shrink:0 so they never move
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#07090E', overflow: 'hidden' }}>

      {/* ── LOGO — never scrolls ── */}
      <div style={{
        height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', borderBottom: '1px solid #232E42', flexShrink: 0,
      }}>
        <Link href="/dashboard" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <svg viewBox="0 0 24 24" width={26} height={26}>
            <path d="M12 2 3 5v6.5C3 16.5 6.5 20 12 22c5.5-2 9-5.5 9-10.5V5l-9-3Z" fill="#FF6B1F" stroke="#FF6B1F" strokeWidth="1.2"/>
            <path d="m8 12 3 3 5-6" fill="none" stroke="#0B0F16" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: "'Space Grotesk', -apple-system, sans-serif", fontSize: 17, fontWeight: 700, color: '#F1EEE5', letterSpacing: '-0.5px' }}>
            Sub<span style={{ color: '#FF6B1F' }}>IQ</span>
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7B8497', padding: 4, display: 'flex' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── PROJECT SWITCHER — never scrolls ── */}
      {projects.length > 0 && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid #1A2333', flexShrink: 0, position: 'relative' }}>
          <button
            onClick={() => setShowProjects(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 8, border: '1px solid #232E42',
              background: '#0B0F16', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4FE3B5', flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#F1EEE5' }}>
              {activeProject?.name || 'No project'}
            </span>
            <ChevronDown size={11} color="#545B6C" />
          </button>
          {showProjects && (
            <div style={{ position: 'absolute', top: '100%', left: 10, right: 10, background: '#131A26', border: '1px solid #232E42', borderRadius: 10, zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', marginTop: 4 }}>
              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => setShowProjects(false)}
                  style={{ padding: '9px 12px', fontSize: 12, fontWeight: p.id === activeProject?.id ? 700 : 400, color: p.id === activeProject?.id ? '#F1EEE5' : '#7B8497', cursor: 'pointer', background: p.id === activeProject?.id ? '#1A2333' : 'transparent' }}
                >
                  {p.name}
                </div>
              ))}
              <Link
                href="/dashboard"
                onClick={() => setShowProjects(false)}
                style={{ display: 'block', padding: '9px 12px', fontSize: 12, color: '#FF6B1F', fontWeight: 600, textDecoration: 'none', borderTop: '1px solid #232E42' }}
              >
                + New project
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── NAV — THIS IS THE ONLY THING THAT SCROLLS ──
          overflow-y: auto means only this element scrolls.
          The sidebar wrapper has overflow: hidden.
          Clicking a nav item CANNOT cause the sidebar to jump.
      ── */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '10px 0 20px',
        // Hide scrollbar but allow scroll
        scrollbarWidth: 'none' as const,
        msOverflowStyle: 'none' as const,
        // CRITICAL: disable scroll anchoring so clicking nav items doesn't jump
        overflowAnchor: 'none' as const,
      }}>
        <style>{`
          .sq-nav::-webkit-scrollbar { display: none; }
          .sq-nav * { overflow-anchor: none; }
        `}</style>
        <NavSection label="Core"          items={CORE}       pathname={pathname} onClick={onClose} />
        <NavSection label="Protection"    items={PROTECTION} pathname={pathname} onClick={onClose} />
        <NavSection label="Field & Admin" items={FIELD}      pathname={pathname} onClick={onClose} />
      </nav>

      {/* ── USER FOOTER — never scrolls ── */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #232E42', flexShrink: 0, background: '#07090E' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FF6B1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0A0E14', flexShrink: 0 }}>
            {(user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#F1EEE5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.company_name || user?.full_name || 'Account'}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#545B6C', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {user?.plan === 'trial' ? '14-day trial' : (user?.plan || 'Free')}
            </div>
          </div>
          <button
            onClick={onSignOut}
            title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#545B6C', padding: 4, display: 'flex', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FF5260')}
            onMouseLeave={e => (e.currentTarget.style.color = '#545B6C')}
          >
            <LogOut size={14} />
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

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }

        /* ROOT — full viewport, no page scroll */
        .sq-root {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: #0B0F16;
          font-family: 'Space Grotesk', -apple-system, sans-serif;
        }

        /* SIDEBAR — fixed column, overflow hidden so IT never scrolls */
        .sq-sidebar {
          width: 240px;
          flex-shrink: 0;
          height: 100vh;
          overflow: hidden;  /* ← THE KEY FIX: sidebar cannot scroll */
          display: flex;
          flex-direction: column;
          border-right: 1px solid #1A2333;
        }

        /* MAIN AREA */
        .sq-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100vh;
          overflow: hidden;
        }

        /* TOPBAR */
        .sq-topbar {
          height: 58px;
          background: #07090E;
          border-bottom: 1px solid #232E42;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          flex-shrink: 0;
          gap: 12px;
        }

        /* CONTENT — only scrollable area on the right */
        .sq-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          background: #0B0F16;
          /* No overflow-anchor so it doesn't jump */
          overflow-anchor: none;
          scroll-behavior: auto;
          -webkit-overflow-scrolling: touch;
        }

        .sq-content-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 28px 28px 100px;
        }

        /* HAMBURGER */
        .sq-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: #F1EEE5;
          padding: 4px;
          align-items: center;
        }

        /* MOBILE BOTTOM NAV */
        .sq-mob-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: #07090E;
          border-top: 1px solid #232E42;
          padding-bottom: env(safe-area-inset-bottom);
          z-index: 200;
        }

        @media (max-width: 768px) {
          .sq-sidebar     { display: none; }
          .sq-hamburger   { display: flex !important; }
          .sq-hide-mob    { display: none !important; }
          .sq-mob-nav     { display: block; }
          .sq-content-inner { padding: 16px 16px 100px; }
        }
      `}</style>

      <div className="sq-root">

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="sq-sidebar">
          <SidebarInner
            projects={projects}
            activeProject={activeProject}
            user={user}
            onSignOut={signOut}
          />
        </aside>

        {/* ── MAIN AREA ── */}
        <div className="sq-main">

          {/* Topbar */}
          <header className="sq-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="sq-hamburger" onClick={() => setDrawer(true)}>
                <Menu size={20} />
              </button>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F1EEE5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                  {activeProject?.name || 'SubIQ'}
                </div>
                {activeProject && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#545B6C', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Active Project
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link href="/reports" style={{ textDecoration: 'none' }} className="sq-hide-mob">
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid #232E42', background: 'transparent', color: '#B6BCCB', fontFamily: 'inherit' }}>
                  <Download size={13} />
                  Audit Export
                </button>
              </Link>
              <UserMenu user={user} onSignOut={signOut} />
            </div>
          </header>

          {/* Content — only this scrolls */}
          <div className="sq-content">
            <div className="sq-content-inner">
              {children}
            </div>
          </div>
        </div>

        {/* ── MOBILE OVERLAY ── */}
        {drawer && (
          <div
            onClick={() => setDrawer(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, backdropFilter: 'blur(4px)' }}
          />
        )}

        {/* ── MOBILE DRAWER ── */}
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 260,
          zIndex: 400,
          transform: drawer ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          boxShadow: '4px 0 40px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}>
          <SidebarInner
            projects={projects}
            activeProject={activeProject}
            user={user}
            onSignOut={signOut}
            onClose={() => setDrawer(false)}
          />
        </div>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="sq-mob-nav">
          <div style={{ display: 'flex' }}>
            {BOTTOM.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href} href={href}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 3,
                    padding: '10px 4px 8px', textDecoration: 'none',
                    color: active ? '#FF6B1F' : '#545B6C',
                    fontSize: 10, fontWeight: active ? 700 : 400,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}
                >
                  <Icon size={20} />
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
