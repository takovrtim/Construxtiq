import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { SubsClient } from './SubsClient'
import type { User, Project, Subcontractor, EmailThread } from '@/types'

export default async function SubsPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [subs, emails] = await (activeProject ? Promise.all([
    supabase.from('subcontractors').select('*').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
    supabase.from('email_threads').select('*').eq('project_id', activeProject.id).order('created_at', { ascending: false }).limit(50),
  ]) : [{ data: [] }, { data: [] }])

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <SubsClient
        user={user as User}
        project={activeProject as Project | null}
        initialSubs={(subs.data ?? []) as Subcontractor[]}
        initialEmails={(emails.data ?? []) as EmailThread[]}
      />
    </AppShell>
  )
}
