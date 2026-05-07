import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { ClientCommsClient } from './ClientCommsClient'
import type { User, Project } from '@/types'

export default async function ClientCommsPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [logs, jobs] = activeProject ? await Promise.all([
    supabase.from('client_comms').select('*').eq('project_id', activeProject.id).order('comm_date', { ascending: false }),
    supabase.from('jobs').select('id, title, client_name, client_phone').eq('project_id', activeProject.id),
  ]) : [{ data: [] }, { data: [] }]

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <ClientCommsClient
        user={user as any}
        project={activeProject as any}
        initialLogs={(logs.data ?? []) as any}
        jobs={(jobs.data ?? []) as any}
      />
    </AppShell>
  )
}
