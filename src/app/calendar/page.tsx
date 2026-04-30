import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { CalendarClient } from './CalendarClient'

export default async function CalendarPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const permits = activeProject ? await supabase
    .from('permits')
    .select('*')
    .eq('project_id', activeProject.id)
    .order('expiry_date') : { data: [] }

  return (
    <AppShell user={user as any} projects={(projects ?? []) as any} activeProject={activeProject as any}>
      <CalendarClient
        user={user as any}
        project={activeProject as any}
        permits={(permits.data ?? []) as any}
      />
    </AppShell>
  )
}