import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { JobsClient } from './JobsClient'
import type { User, Project } from '@/types'

export default async function JobsPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [jobs, inspections, permits] = activeProject ? await Promise.all([
    supabase.from('jobs').select('*').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
    supabase.from('inspections').select('*').eq('project_id', activeProject.id),
    supabase.from('permits').select('id,permit_number,status,expiry_date').eq('project_id', activeProject.id),
  ]) : [{ data: [] }, { data: [] }, { data: [] }]

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <JobsClient
        user={user as any}
        project={activeProject as any}
        initialJobs={(jobs.data ?? []) as any}
        inspections={(inspections.data ?? []) as any}
        permits={(permits.data ?? []) as any}
      />
    </AppShell>
  )
}
