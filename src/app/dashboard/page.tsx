import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardClient } from './DashboardClient'
import type { User, Project } from '@/types'

export default async function DashboardPage() {
  const supabase = createServerSupabase()

  // Only fetch auth + user + projects — nothing else
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])

  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <DashboardClient
        user={user as User}
        project={activeProject as Project | null}
        isNewUser={!projects || projects.length === 0}
      />
    </AppShell>
  )
}
