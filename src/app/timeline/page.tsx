import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { TimelineClient } from './TimelineClient'
import type { User, Project } from '@/types'

export default async function TimelinePage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [jobs, inspections, changes] = activeProject ? await Promise.all([
    supabase.from('jobs').select('*').eq('project_id', activeProject.id).order('created_at'),
    supabase.from('inspections').select('*').eq('project_id', activeProject.id).order('scheduled_date'),
    supabase.from('change_orders').select('*').eq('project_id', activeProject.id).order('created_at'),
  ]) : [{ data: [] }, { data: [] }, { data: [] }]

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <TimelineClient
        project={activeProject as any}
        jobs={(jobs.data ?? []) as any}
        inspections={(inspections.data ?? []) as any}
        changes={(changes.data ?? []) as any}
      />
    </AppShell>
  )
}
