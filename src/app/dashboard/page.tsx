import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardClient } from './DashboardClient'
import type { User, Project } from '@/types'

export default async function DashboardPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()

  const [
    delays, rfis, changes, permits, logs, safety
  ] = activeProject ? await Promise.all([
    supabase.from('delay_logs').select('days_lost,caused_by,description,created_at').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
    supabase.from('rfis').select('id,status,response_needed_by,subject').eq('project_id', activeProject.id),
    supabase.from('change_orders').select('id,title,status,cost_impact,created_at').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
    supabase.from('permits').select('permit_number,expiry_date,status').eq('project_id', activeProject.id).eq('status', 'active'),
    supabase.from('job_logs').select('id').eq('project_id', activeProject.id).gte('created_at', weekAgo),
    supabase.from('safety_checklists').select('id,all_clear').eq('project_id', activeProject.id).gte('created_at', weekAgo),
  ]) : Array(6).fill({ data: [] })

  const allDelays      = delays?.data ?? []
  const allRFIs        = rfis?.data ?? []
  const allChanges     = changes?.data ?? []
  const allPermits     = permits?.data ?? []
  const allLogs        = logs?.data ?? []
  const allSafety      = safety?.data ?? []

  const overdueRFIs    = allRFIs.filter((r: any) => r.response_needed_by && new Date(r.response_needed_by) < now && r.status !== 'closed' && r.status !== 'responded')
  const pendingChanges = allChanges.filter((c: any) => c.status === 'pending')
  const expiringPermits = allPermits.filter((p: any) => {
    if (!p.expiry_date) return false
    const days = Math.ceil((new Date(p.expiry_date).getTime() - now.getTime()) / 86400000)
    return days >= 0 && days <= 30
  })

  const stats = {
    delayDays:          allDelays.reduce((s: number, d: any) => s + (d.days_lost || 0), 0),
    gcDelayDays:        allDelays.filter((d: any) => d.caused_by === 'gc').reduce((s: number, d: any) => s + (d.days_lost || 0), 0),
    openRFIs:           allRFIs.filter((r: any) => r.status === 'open').length,
    overdueRFIs:        overdueRFIs.length,
    pendingChanges:     pendingChanges.length,
    pendingChangeValue: pendingChanges.reduce((s: number, c: any) => s + Number(c.cost_impact || 0), 0),
    logsThisWeek:       allLogs.length,
    safetyThisWeek:     allSafety.length,
    expiringPermits,
    recentDelays:       allDelays.slice(0, 5),
    recentChanges:      allChanges.slice(0, 3),
  }

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <DashboardClient
        user={user as any}
        project={activeProject as any}
        projects={(projects ?? []) as any}
        stats={stats}
      />
    </AppShell>
  )
}
