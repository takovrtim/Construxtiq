import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { DocumentsClient } from './DocumentsClient'
import type { User, Project } from '@/types'

export default async function DocumentsPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [documents, permits, subs] = activeProject ? await Promise.all([
    supabase.from('documents').select('*').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
    supabase.from('permits').select('*').eq('project_id', activeProject.id).order('expiry_date'),
    supabase.from('subcontractors').select('id, company_name, trade, email').eq('project_id', activeProject.id),
  ]) : [{ data: [] }, { data: [] }, { data: [] }]

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <DocumentsClient
        user={user as any}
        project={activeProject as any}
        initialDocuments={(documents.data ?? []) as any}
        initialPermits={(permits.data ?? []) as any}
        subs={(subs.data ?? []) as any}
      />
    </AppShell>
  )
}