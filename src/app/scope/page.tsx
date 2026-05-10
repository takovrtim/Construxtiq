import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { ScopeChangesClient } from './ScopeChangesClient'
import type { User, Project } from '@/types'

export default async function ScopeChangesPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [scopeChanges, jobs] = activeProject ? await Promise.all([
    supabase.from('scope_changes').select('*').eq('project_id', activeProject.id).order('change_date', { ascending: false }),
    supabase.from('jobs').select('id, title').eq('project_id', activeProject.id),
  ]) : [{ data: [] }, { data: [] }]

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <ScopeChangesClient
        user={user as any}
        project={activeProject as any}
        initialChanges={(scopeChanges.data ?? []) as any}
        jobs={(jobs.data ?? []) as any}
      />
    </AppShell>
  )
}
