import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { ChangesClient } from './ChangesClient'
import type { User, Project } from '@/types'

export default async function ChangesPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [changes, jobs] = activeProject ? await Promise.all([
    supabase.from('change_orders').select('*').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
    supabase.from('jobs').select('id, title').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
  ]) : [{ data: [] }, { data: [] }]

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <ChangesClient
        user={user as any}
        project={activeProject as any}
        initialChanges={(changes.data ?? []) as any}
        jobs={(jobs.data ?? []) as any}
      />
    </AppShell>
  )
}
