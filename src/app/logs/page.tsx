import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { LogsClient } from './LogsClient'
import type { User, Project } from '@/types'

export default async function LogsPage() {
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
    supabase.from('job_logs').select('*').eq('project_id', activeProject.id).order('log_date', { ascending: false }),
    supabase.from('jobs').select('id, title, status, client_name').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
  ]) : [{ data: [] }, { data: [] }]

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <LogsClient
        user={user as any}
        project={activeProject as any}
        initialLogs={(logs.data ?? []) as any}
        jobs={(jobs.data ?? []) as any}
      />
    </AppShell>
  )
}
