import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { JobsClient } from './JobsClient'

export default async function JobsPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  return (
    <AppShell user={user as any} projects={(projects ?? []) as any} activeProject={projects?.[0] as any ?? null}>
      <JobsClient user={user as any} projects={(projects ?? []) as any} />
    </AppShell>
  )
}