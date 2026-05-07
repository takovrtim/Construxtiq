import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { CrewTimeClient } from './CrewTimeClient'
import type { User, Project } from '@/types'

export default async function CrewTimePage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [entries, jobs, subs] = activeProject ? await Promise.all([
    supabase.from('crew_time').select('*').eq('project_id', activeProject.id).order('work_date', { ascending: false }),
    supabase.from('jobs').select('id, title, status').eq('project_id', activeProject.id),
    supabase.from('subcontractors').select('id, company_name, contact_name, trade').eq('project_id', activeProject.id),
  ]) : [{ data: [] }, { data: [] }, { data: [] }]

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <CrewTimeClient
        user={user as any}
        project={activeProject as any}
        initialEntries={(entries.data ?? []) as any}
        jobs={(jobs.data ?? []) as any}
        subs={(subs.data ?? []) as any}
      />
    </AppShell>
  )
}
