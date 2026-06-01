'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, ClipboardList, FileText, Clock, MessageSquare,
  Target, Shield, Download, FolderOpen, Receipt, DollarSign, FileCheck,
  Users, ClipboardCheck, Package, FileWarning,
  Settings, Menu, X, ChevronDown, LogOut, Briefcase,
  AlertTriangle, CheckCircle, TrendingUp, Bell, Search,
  Zap, ChevronRight,
} from 'lucide-react'

interface User    { id: string; full_name: string; email: string; plan: string; company_name?: string }
interface Project { id: string; name: string; status: string }
interface Props   { user: User; projects: Project[]; activeProject: Project | null; children: React.ReactNode }

// ── NAV STRUCTURE ─────────────────────────────────────────────
const PRIMARY = [
  { href: '/dashboard',     label: 'Dashboard',     Icon: LayoutDashboard },
  { href: '/bid',           label: 'BidIQ',         Icon: Target          },
  { href: '/logs',          label: 'Daily Log',     Icon: ClipboardList   },
  { href: '/changes',       label: 'Change Orders', Icon: FileText        },
  { href: '/delay-tracker', label: 'Delay Tracker', Icon: Clock           },
  { href: '/RFI',           label: 'RFI Tracker',   Icon: MessageSquare   },
  { href: '/safety',        label: 'Safety',        Icon: Shield          },
]

const LEGAL = [
  { href: '/reports',       label: 'Audit Export',  Icon: Download        },
  { href: '/documents',     label: 'Documents AI',  Icon: FolderOpen      },
  { href: '/lien-waivers',  label: 'Lien Waivers',  Icon: FileCheck       },
  { href: '/retention',     label: 'Retention',     Icon: DollarSign      },
  { href: '/invoices',      label: 'Invoices',      Icon: Receipt         },
]

const FIELD = [
  { href: '/jobs',          label: 'Jobs',          Icon: Briefcase       },
  { href: '/crew-time',     label: 'Crew Time',     Icon: Users           },
  { href: '/inspections',   label: 'Inspections',   Icon: ClipboardCheck  },
  { href: '/materials',     label: 'Materials',     Icon: Package         },
  { href: '/warranty',      label: 'Warranties',    Icon: FileWarning     },
  { href: '/settings',      label: 'Settings',      Icon: Settings        },
]

const BOTTOM = [
  { href: '/dashboard',     label: 'Home',    Icon: LayoutDashboard },
  { href: '/logs',          label: 'Log',     Icon: ClipboardList   },
  { href: '/changes',       label: 'COs',     Icon: FileText        },
  { href: '/delay-tracker', label: 'Delays',  Icon: Clock           },
  { href: '/bid',           label: 'BidIQ',   Icon: Target          },
]

// ── COLORS ────────────────────────────────────────────────────
const C = {
  bg:       '#07090E',
  surface:  '#0D1117',
  border:   '#1C2333',
  border2:  '#232E42',
  orange:   '#FF6B1F',
  orangeDim:'rgba(255,107,31,0.10)',
  orangeGlow:'rgba(255,107,31,0.15)',
  text:     '#F1EEE5',
  muted:    '#7B8497',
  dim:      '#3D4558',
  green:    '#4FE3B5',
  red:      '#FF5260',
  yellow:   '#F5A623',
  blue:     '#4A9EFF',
}

// ── SUBIQ LOGO ICON ───────────────────────────────────────────
function SubIQLogo({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size}>
      <rect width="32" height="32" rx="7" fill="#FF6B1F"/>
      <path
        d="M16 5 L7 8.5V15.5C7 20.8 10.5 24.5 16 26.5C21.5 24.5 25 20.8 25 15.5V8.5L16 5Z"
        fill="rgba(0,0,0,0.25)"
      />
      <path
        d="M16 6.5 L8.5 9.5V15.8C8.5 20.6 11.8 24 16 25.8C20.2 24 23.5 20.6 23.5 15.8V9.5L16 6.5Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M12 16.5L14.8 19.3L20.5 13"
        fill="none"
        stroke="#FF6B1F"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── PROTECTION SCORE ──────────────────────────────────────────
function ProtectionDot({ score }: { score: 'green' | 'yellow' | 'red' }) {
  const colors = { green: C.green, yellow: C.yellow, red: C.red }
  const labels = { green: 'Protected', yellow: 'Gaps found', red: 'Exposed' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: colors[score],
        boxShadow: `0 0 6px ${colors[score]}`,
      }} />
      <span style={{ fontSize: 10, color: colors[score], fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
        {labels[score]}
      </span>
    </div>
  )
}

// ── ALERT STRIP ───────────────────────────────────────────────
function AlertStrip({ alerts }: { alerts: { type: 'warn' | 'ok' | 'info'; text: string }[] }) {
  if (!alerts.length) return null
  const urgent = alerts.filter(a => a.type === 'warn')
  if (!urgent.length) return null
  return (
    <div style={{
      background: 'rgba(255,82,96,0.07)',
      borderBottom: `1px solid rgba(255,82,96,0.2)`,
      padding: '6px 20px',
      display: 'flex', alignItems: 'center', gap: 10,
      flexShrink: 0,
    }}>
      <AlertTriangle size={11} color={C.red} />
      <span style={{ fontSize: 11, color: C.red, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>
        {urgent[0].text}
        {urgent.length > 1 && <span style={{ marginLeft: 8, color: 'rgba(255,82,96,0.6)' }}>+{urgent.length - 1} more</span>}
      </span>
    </div>
  )
}

// ── NAV ITEM ──────────────────────────────────────────────────
function NavItem({ href, label, Icon, active, badge, onClick }: {
  href: string; label: string; Icon: any; active: boolean; badge?: number; onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '5px 10px', margin: '1px 0', borderRadius: 6,
        textDecoration: 'none', fontSize: 12,
        fontWeight: active ? 600 : 400,
        color: active ? C.orange : C.muted,
        background: active ? C.orangeDim : 'transparent',
        borderLeft: `2px solid ${active ? C.orange : 'transparent'}`,
        transition: 'all 0.1s',
        userSelect: 'none',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
          e.currentTarget.style.color = C.text
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = C.muted
        }
      }}
    >
      <Icon size={13} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {badge ? (
        <span style={{
          background: C.red, color: 'white', fontSize: 9,
          fontWeight: 700, borderRadius: 99, padding: '1px 5px',
          fontFamily: "'JetBrains Mono', monospace",
        }}>{badge}</span>
      ) : null}
    </Link>
  )
}

// ── NAV SECTION ───────────────────────────────────────────────
function NavSection({ label, items, pathname, badges = {}, onClick }: {
  label: string
  items: { href: string; label: string; Icon: any }[]
  pathname: string
  badges?: Record<string, number>
  onClick?: () => void
}) {
  return (
    <div style={{ marginBottom: 16, padding: '0 8px' }}>
      <div style={{
        padding: '0 4px 5px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, fontWeight: 500, color: C.dim,
        textTransform: 'uppercase', letterSpacing: '0.14em',
      }}>
        {label}
      </div>
      {items.map(({ href, label: name, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <NavItem
            key={href} href={href} label={name} Icon={Icon}
            active={active} badge={badges[href]} onClick={onClick}
          />
        )
      })}
    </div>
  )
}

// ── BID STATUS PILL ───────────────────────────────────────────
function BidStatusPill({ status, project }: { status: string; project: string }) {
  const cfg: Record<string, { color: string; bg: string; label: string }> = {
    won:       { color: C.green,  bg: 'rgba(79,227,181,0.1)',  label: 'WON'       },
    lost:      { color: C.red,    bg: 'rgba(255,82,96,0.1)',   label: 'LOST'      },
    submitted: { color: C.yellow, bg: 'rgba(245,166,35,0.1)',  label: 'SUBMITTED' },
    reviewing: { color: C.blue,   bg: 'rgba(74,158,255,0.1)',  label: 'REVIEWING' },
    draft:     { color: C.muted,  bg: 'rgba(123,132,151,0.1)', label: 'DRAFT'     },
  }
  const c = cfg[status] || cfg.draft
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        background: c.bg, border: `1px solid ${c.color}22`,
        borderRadius: 4, padding: '2px 7px',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, boxShadow: `0 0 4px ${c.color}` }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: c.color, letterSpacing: '0.1em' }}>
          {c.label}
        </span>
      </div>
      <span style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
        {project}
      </span>
    </div>
  )
}

// ── QUICK ACTIONS ─────────────────────────────────────────────
function QuickActions() {
  const [open, setOpen] = useState(false)
  const actions = [
    { href: '/logs?new=1',          label: 'Log Today',         Icon: ClipboardList, color: C.green  },
    { href: '/delay-tracker?new=1', label: 'Log Delay',         Icon: Clock,         color: C.yellow },
    { href: '/changes?new=1',       label: 'New Change Order',  Icon: FileText,      color: C.orange },
    { href: '/RFI?new=1',           label: 'Submit RFI',        Icon: MessageSquare, color: C.blue   },
  ]
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 7,
          background: open ? C.orangeGlow : C.orangeDim,
          border: `1px solid ${open ? C.orange : 'rgba(255,107,31,0.3)'}`,
          color: C.orange, cursor: 'pointer', fontSize: 11,
          fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = C.orangeGlow
          e.currentTarget.style.borderColor = C.orange
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.background = C.orangeDim
            e.currentTarget.style.borderColor = 'rgba(255,107,31,0.3)'
          }
        }}
      >
        <Zap size={12} />
        Quick Log
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6,
            width: 200, background: C.surface,
            border: `1px solid ${C.border2}`, borderRadius: 10,
            boxShadow: '0 16px 48px rgba(0,0,0,0.7)', zIndex: 99, overflow: 'hidden',
          }}>
            {actions.map(({ href, label, Icon, color }) => (
              <Link
                key={href} href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', fontSize: 12, color: C.text,
                  textDecoration: 'none', transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = C.border)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Icon size={13} color={color} />
                {label}
                <ChevronRight size={10} color={C.muted} style={{ marginLeft: 'auto' }} />
              </Link>
            ))}
          </div>
        </>
      )}
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
          width: 30, height: 30, borderRadius: '50%',
          background: `linear-gradient(135deg, #FF6B1F, #FF9A5C)`,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#0A0E14',
          boxShadow: open ? `0 0 0 2px ${C.orange}` : 'none',
          transition: 'box-shadow 0.15s',
        }}
      >
        {initial}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 8,
            width: 220, background: C.surface,
            border: `1px solid ${C.border2}`, borderRadius: 12,
            boxShadow: '0 16px 48px rgba(0,0,0,0.7)', zIndex: 99, overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.full_name || 'Account'}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, color: C.orange, marginTop: 5,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                background: C.orangeDim, borderRadius: 3, padding: '2px 6px', display: 'inline-block',
              }}>
                {user?.plan === 'trial' ? '14-day trial' : (user?.plan || 'Free')}
              </div>
            </div>
            {[
              { href: '/settings', Icon: Settings, label: 'Settings' },
              { href: '/reports',  Icon: Download, label: 'Audit Export' },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', fontSize: 12, color: '#B6BCCB', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = C.border)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <item.Icon size={13} style={{ color: C.muted }} />{item.label}
              </Link>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}` }}>
              <button
                onClick={() => { setOpen(false); onSignOut() }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', fontSize: 12, color: C.red, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
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
function SidebarInner({ projects, activeProject, user, onSignOut, onClose, navRef }: {
  projects: Project[]; activeProject: Project | null; user: User
  onSignOut: () => void; onClose?: () => void
  navRef?: React.RefObject<HTMLElement>
}) {
  const pathname = usePathname()
  const [showProjects, setShowProjects] = useState(false)
  const internalNavRef = useRef<HTMLElement>(null)
  const ref = navRef || internalNavRef

  useEffect(() => {
    const nav = ref.current
    if (!nav) return
    const saved = sessionStorage.getItem('nav-scroll')
    if (saved) nav.scrollTop = parseInt(saved)
  }, [])

  const saveScroll = () => {
    if (ref.current) sessionStorage.setItem('nav-scroll', String(ref.current.scrollTop))
  }

  // Demo badges — in production wire these to real Supabase counts
  const badges: Record<string, number> = {
    '/RFI':           2,
    '/changes':       1,
    '/lien-waivers':  1,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, overflow: 'hidden' }}>

      {/* Logo */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <Link
          href="/dashboard"
          onClick={() => { saveScroll(); onClose?.() }}
          style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}
        >
          <SubIQLogo size={26} />
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.5px',
          }}>
            Sub<span style={{ color: C.orange }}>IQ</span>
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dim, padding: 4, display: 'flex' }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* Project switcher */}
      {projects.length > 0 && (
        <div style={{ padding: '8px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, position: 'relative' }}>
          <button
            onClick={() => setShowProjects(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 9px', borderRadius: 7,
              border: `1px solid ${showProjects ? C.border2 : C.border}`,
              background: showProjects ? C.surface : C.bg,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 11,
              transition: 'all 0.15s',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0, boxShadow: `0 0 5px ${C.green}` }} />
            <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: C.text }}>
              {activeProject?.name || 'No project'}
            </span>
            <ChevronDown size={10} color={C.muted} style={{ transition: 'transform 0.2s', transform: showProjects ? 'rotate(180deg)' : 'none' }} />
          </button>
          {showProjects && (
            <div style={{
              position: 'absolute', top: '100%', left: 8, right: 8,
              background: C.surface, border: `1px solid ${C.border2}`,
              borderRadius: 9, zIndex: 50, overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)', marginTop: 3,
            }}>
              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => setShowProjects(false)}
                  style={{
                    padding: '8px 12px', fontSize: 12,
                    fontWeight: p.id === activeProject?.id ? 700 : 400,
                    color: p.id === activeProject?.id ? C.text : C.muted,
                    cursor: 'pointer',
                    background: p.id === activeProject?.id ? C.border : 'transparent',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => { if (p.id !== activeProject?.id) e.currentTarget.style.background = C.border }}
                  onMouseLeave={e => { if (p.id !== activeProject?.id) e.currentTarget.style.background = 'transparent' }}
                >
                  {p.id === activeProject?.id && <CheckCircle size={10} color={C.green} />}
                  {p.name}
                </div>
              ))}
              <Link
                href="/dashboard"
                onClick={() => setShowProjects(false)}
                style={{ display: 'block', padding: '8px 12px', fontSize: 12, color: C.orange, fontWeight: 600, textDecoration: 'none', borderTop: `1px solid ${C.border}` }}
                onMouseEnter={e => (e.currentTarget.style.background = C.orangeDim)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                + New project
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Protection score strip */}
      <div style={{
        padding: '7px 16px', borderBottom: `1px solid ${C.border}`,
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <ProtectionDot score="green" />
        <span style={{ fontSize: 9, color: C.dim, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
          CASE FILE CURRENT
        </span>
      </div>

      {/* Nav */}
      <nav
        ref={ref as React.RefObject<HTMLElement>}
        onScroll={saveScroll}
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          overflowAnchor: 'none', padding: '10px 0 16px',
          scrollbarWidth: 'none',
        }}
      >
        <NavSection label="Daily Work"   items={PRIMARY} pathname={pathname} badges={badges} onClick={saveScroll} />
        <NavSection label="Legal Shield" items={LEGAL}   pathname={pathname} badges={badges} onClick={saveScroll} />
        <NavSection label="Field Ops"    items={FIELD}   pathname={pathname} onClick={saveScroll} />
      </nav>

      {/* User footer */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: `linear-gradient(135deg, #FF6B1F, #FF9A5C)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#0A0E14', flexShrink: 0,
          }}>
            {(user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.company_name || user?.full_name || 'Account'}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {user?.plan === 'trial' ? '14-day trial' : (user?.plan || 'Free')}
            </div>
          </div>
          <button
            onClick={onSignOut}
            title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.dim, padding: 4, display: 'flex', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = C.red)}
            onMouseLeave={e => (e.currentTarget.style.color = C.dim)}
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

  // Demo alerts — wire to real Supabase data in production
  const alerts = [
    { type: 'warn' as const, text: 'Lien waiver due in 3 days — Hardrock Tower Phase 2' },
  ]

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

        .sq-sidebar {
          width: 232px;
          flex-shrink: 0;
          height: 100vh;
          overflow: hidden;
          border-right: 1px solid #1C2333;
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
          height: 52px;
          background: #07090E;
          border-bottom: 1px solid #1C2333;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          flex-shrink: 0;
          gap: 12px;
        }

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
          border-top: 1px solid #1C2333;
          padding-bottom: env(safe-area-inset-bottom);
          z-index: 200;
        }

        @media (max-width: 768px) {
          .sq-sidebar   { display: none; }
          .sq-hamburger { display: flex !important; }
          .sq-hide-mob  { display: none !important; }
          .sq-mob-nav   { display: block; }
          .sq-inner     { padding: 16px 16px 90px; }
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

          {/* Alert strip */}
          <AlertStrip alerts={alerts} />

          {/* Topbar */}
          <header className="sq-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="sq-hamburger" onClick={() => setDrawer(true)}>
                <Menu size={19} />
              </button>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                  {activeProject?.name || 'SubIQ'}
                </div>
                {activeProject && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Active project
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Bid status */}
              {activeProject && (
                <div className="sq-hide-mob">
                  <BidStatusPill status="won" project={activeProject.name} />
                </div>
              )}

              {/* Quick log */}
              <div className="sq-hide-mob">
                <QuickActions />
              </div>

              {/* Audit export */}
              <Link href="/reports" style={{ textDecoration: 'none' }} className="sq-hide-mob">
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', fontSize: 11, fontWeight: 600,
                  borderRadius: 7, cursor: 'pointer',
                  border: `1px solid ${C.border2}`,
                  background: 'transparent', color: '#B6BCCB', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.color = C.text }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = '#B6BCCB' }}
                >
                  <Download size={11} />Audit Export
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
          <div
            onClick={() => setDrawer(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, backdropFilter: 'blur(4px)' }}
          />
        )}

        {/* Mobile drawer */}
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 256, zIndex: 400,
          transform: drawer ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          boxShadow: '4px 0 40px rgba(0,0,0,0.7)', overflow: 'hidden',
        }}>
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
                <Link
                  key={href} href={href}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 3, padding: '9px 4px 7px', textDecoration: 'none',
                    color: active ? C.orange : C.dim,
                    fontSize: 9, fontWeight: active ? 700 : 400,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    transition: 'color 0.15s',
                  }}
                >
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