import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { EmailClient } from './EmailClient'
import type { User, Project, EmailThread, Subcontractor } from '@/types'

export default async function EmailPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [threads, subs] = await (activeProject ? Promise.all([
    supabase.from('email_threads').select('*').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
    supabase.from('subcontractors').select('id, company_name, trade, email').eq('project_id', activeProject.id),
  ]) : [{ data: [] }, { data: [] }])

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <EmailClient
        user={user as User}
        project={activeProject as Project | null}
        initialThreads={(threads.data ?? []) as EmailThread[]}
        subs={(subs.data ?? []) as Pick<Subcontractor, 'id' | 'company_name' | 'trade' | 'email'>[]}
      />
    </AppShell>
  )
}
