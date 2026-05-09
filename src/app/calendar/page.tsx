import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { CalendarClient } from './CalendarClient'
import type { User, Project } from '@/types'

export default async function CalendarPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [permits, inspections, jobs, changes] = activeProject ? await Promise.all([
    supabase.from('permits').select('*').eq('project_id', activeProject.id).order('expiry_date'),
    supabase.from('inspections').select('*').eq('project_id', activeProject.id),
    supabase.from('jobs').select('id,title,start_date,end_date,status').eq('project_id', activeProject.id),
    supabase.from('change_orders').select('id,title,created_at').eq('project_id', activeProject.id),
  ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <CalendarClient
        user={user as any}
        project={activeProject as any}
        permits={(permits.data ?? []) as any}
        inspections={(inspections.data ?? []) as any}
        jobs={(jobs.data ?? []) as any}
        changes={(changes.data ?? []) as any}
      />
    </AppShell>
  )
}
