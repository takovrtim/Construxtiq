import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { RFIClient } from './RFIClient'
import type { User, Project } from '@/types'

export default async function RFIPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')
  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')
  const activeProject = projects?.[0] ?? null
  const [rfis, jobs] = activeProject ? await Promise.all([
    supabase.from('rfis').select('*').eq('project_id', activeProject.id).order('submitted_date', { ascending: false }),
    supabase.from('jobs').select('id,title').eq('project_id', activeProject.id),
  ]) : [{ data: [] }, { data: [] }]
  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <RFIClient user={user as any} project={activeProject as any} initialRFIs={(rfis.data ?? []) as any} jobs={(jobs.data ?? []) as any} />
    </AppShell>
  )
}
