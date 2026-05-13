'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { QuickLog } from '../QuickLog'
import {
  LayoutDashboard, Briefcase, ClipboardList, FileText, Shield,
  Clock, MessageSquare, DollarSign, FileCheck, Receipt, Download,
  Users, ClipboardCheck, FolderOpen, Image, Package, FileWarning,
  Hammer, UserCog, Settings, Menu, X, ChevronDown, LogOut,
} from 'lucide-react'

interface User    { id: string; full_name: string; email: string; plan: string; company_name?: string }
interface Project { id: string; name: string; status: string }
interface Props   { user: User; projects: Project[]; activeProject: Project | null; children: React.ReactNode }

const CORE = [
  { href: '/dashboard', label: 'Dashboard',     Icon: LayoutDashboard },
  { href: '/jobs',      label: 'Jobs',           Icon: Briefcase        },
  { href: '/logs',      label: 'Daily Log',      Icon: ClipboardList    },
  { href: '/changes',   label: 'Changes',        Icon: FileText         },
  { href: '/safety',    label: 'Safety',         Icon: Shield           },
]

const PROTECTION = [
  { href: '/delay-tracker', label: 'Delay Tracker', Icon: Clock         },
  { href: '/rfi',           label: 'RFI Tracker',   Icon: MessageSquare },
  { href: '/retention',     label: 'Retention',     Icon: DollarSign    },
  { href: '/lien-waivers',  label: 'Lien Waivers',  Icon: FileCheck     },
  { href: '/invoices',      label: 'Invoices',      Icon: Receipt       },
  { href: '/reports',       label: 'Audit Export',  Icon: Download      },
]

const FIELD = [
  { href: '/crew-time',   label: 'Crew Time',   Icon: Users          },
  { href: '/inspections', label: 'Inspections', Icon: ClipboardCheck },
  { href: '/documents',   label: 'Documents',   Icon: FolderOpen     },
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

function NavSection({ label, items, pathname, onClick }: {
  label: string
  items: { href: string; label: string; Icon: any }[]
  pathname: string
  onClick?: () => void
}) {
  return (
    <div style={{ marginBottom: 24, padding: '0 12px' }}>
      <div style={{ padding: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      {items.map(({ href, label: name, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link key={href} href={href} onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', margin: '1px 0', borderRadius: 8,
            textDecoration: 'none', fontSize: 13,
            fontWeight: active ? 600 : 400,
            color: active ? '#fff' : '#d1d5db',
            background: active ? '#ea580c' : 'transparent',
            transition: 'background 0.1s, color 0.1s',
          }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#111827'; e.currentTarget.style.color = '#fff' } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d1d5db' } }}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {name}
          </Link>
        )
      })}
    </div>
  )
}

function UserMenuDropdown({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const initial = (user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: 34, height: 34, borderRadius: '50%', background: '#ea580c', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
        {initial}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 220, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 99, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'Account'}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#ea580c', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {user?.plan === 'trial' ? '14-day trial' : (user?.plan || 'Free')}
              </div>
            </div>
            {[
              { href: '/settings', Icon: Settings, label: 'Settings' },
              { href: '/reports',  Icon: Download, label: 'Audit Export' },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: '#374151', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <item.Icon size={15} style={{ color: '#6b7280' }} />
                {item.label}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid #f3f4f6' }}>
              <button onClick={() => { setOpen(false); onSignOut() }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SidebarInner({ projects, activeProject, user, onSignOut, onClose }: {
  projects: Project[]; activeProject: Project | null; user: User
  onSignOut: () => void; onClose?: () => void
}) {
  const pathname = usePathname()
  const [showProjects, setShowProjects] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000' }}>
      {/* Logo */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #1f2937', flexShrink: 0 }}>
        <Link href="/dashboard" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: '#ea580c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>SubIQ</span>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, display: 'flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Project switcher */}
      {projects.length > 0 && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #111827', flexShrink: 0, position: 'relative' }}>
          <button onClick={() => setShowProjects(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: '1px solid #1f2937', background: '#111', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>
              {activeProject?.name || 'No project'}
            </span>
            <ChevronDown size={12} color="#6b7280" />
          </button>
          {showProjects && (
            <div style={{ position: 'absolute', top: '100%', left: 12, right: 12, background: '#111', border: '1px solid #1f2937', borderRadius: 10, zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', marginTop: 4 }}>
              {projects.map(p => (
                <div key={p.id} onClick={() => setShowProjects(false)} style={{ padding: '9px 12px', fontSize: 12, fontWeight: p.id === activeProject?.id ? 700 : 400, color: p.id === activeProject?.id ? '#fff' : '#9ca3af', cursor: 'pointer', background: p.id === activeProject?.id ? '#1f2937' : 'transparent' }}>
                  {p.name}
                </div>
              ))}
              <Link href="/dashboard" onClick={() => setShowProjects(false)} style={{ display: 'block', padding: '9px 12px', fontSize: 12, color: '#ea580c', fontWeight: 600, textDecoration: 'none', borderTop: '1px solid #1f2937' }}>
                + New project
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Scrollable nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 0', scrollbarWidth: 'none' }}>
        <style>{`.sidebar-nav::-webkit-scrollbar{display:none}`}</style>
        <NavSection label="Core"          items={CORE}       pathname={pathname} onClick={onClose} />
        <NavSection label="Protection"    items={PROTECTION} pathname={pathname} onClick={onClose} />
        <NavSection label="Field & Admin" items={FIELD}      pathname={pathname} onClick={onClose} />
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1f2937', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
            {(user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.company_name || user?.full_name || 'Account'}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>
              {user?.plan === 'trial' ? '14-day trial' : (user?.plan || 'Electrician')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
        .app-shell-root { display: flex; height: 100vh; overflow: hidden; background: #f3f4f6; }
        .sidebar-wrap   { width: 256px; flex-shrink: 0; }
        .main-wrap      { flex: 1; display: flex; flex-direction: column; min-width: 0; height: 100vh; overflow: hidden; }
        .topbar-dark    { height: 64px; background: #000; border-bottom: 1px solid #1f2937; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; flex-shrink: 0; gap: 12px; }
        .content-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; }
        .content-inner  { max-width: 1200px; margin: 0 auto; padding: 28px 28px 100px; }
        .hamburger-btn  { display: none; background: none; border: none; cursor: pointer; color: #fff; padding: 4px; align-items: center; }
        .hide-mob       { display: flex; }
        .mob-bottom-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: #000; border-top: 1px solid #1f2937; padding-bottom: env(safe-area-inset-bottom); z-index: 200; }
        @media (max-width: 768px) {
          .sidebar-wrap   { display: none; }
          .hamburger-btn  { display: flex !important; }
          .hide-mob       { display: none !important; }
          .mob-bottom-nav { display: block; }
          .content-inner  { padding: 16px 16px 100px; }
        }
      `}</style>

      <div className="app-shell-root">

        {/* Desktop sidebar */}
        <aside className="sidebar-wrap">
          <SidebarInner projects={projects} activeProject={activeProject} user={user} onSignOut={signOut} />
        </aside>

        {/* Main */}
        <div className="main-wrap">
          <header className="topbar-dark">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="hamburger-btn" onClick={() => setDrawer(true)}>
                <Menu size={20} />
              </button>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                {activeProject?.name || 'SubIQ'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link href="/reports" style={{ textDecoration: 'none' }} className="hide-mob">
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid #374151', background: 'transparent', color: '#d1d5db', fontFamily: 'inherit' }}>
                  <Download size={13} />
                  Export Report
                </button>
              </Link>
              <UserMenuDropdown user={user} onSignOut={signOut} />
            </div>
          </header>

          <div className="content-scroll">
            <div className="content-inner">
              {children}
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {drawer && <div onClick={() => setDrawer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, backdropFilter: 'blur(2px)' }} />}

        {/* Mobile drawer */}
        <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, zIndex: 400, transform: drawer ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease', boxShadow: '4px 0 32px rgba(0,0,0,0.5)' }}>
          <SidebarInner projects={projects} activeProject={activeProject} user={user} onSignOut={signOut} onClose={() => setDrawer(false)} />
        </div>

        {/* Mobile bottom nav */}
        <nav className="mob-bottom-nav">
          <div style={{ display: 'flex' }}>
            {BOTTOM.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '10px 4px 8px', textDecoration: 'none', color: active ? '#ea580c' : '#6b7280', fontSize: 10, fontWeight: active ? 700 : 400 }}>
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
