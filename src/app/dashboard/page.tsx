import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardClient } from './DashboardClient'
import type { User, Project } from '@/types'

export default async function DashboardPage() {
  const supabase = createServerSupabase()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])

  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  // Fetch dashboard data for active project
  const projectId = activeProject?.id
  const [permits, bids, documents, subs] = await Promise.all([
    projectId
      ? supabase.from('permits').select('*').eq('project_id', projectId).order('expiry_date')
      : Promise.resolve({ data: [] }),
    projectId
      ? supabase.from('bid_line_items').select('*').eq('project_id', projectId).order('sort_order')
      : Promise.resolve({ data: [] }),
    projectId
      ? supabase.from('documents').select('id, name, status, doc_type, created_at').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10)
      : Promise.resolve({ data: [] }),
    projectId
      ? supabase.from('subcontractors').select('*').eq('project_id', projectId)
      : Promise.resolve({ data: [] }),
  ])

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <DashboardClient
        user={user as User}
        project={activeProject as Project | null}
        permits={permits.data ?? []}
        bids={bids.data ?? []}
        documents={documents.data ?? []}
        subs={subs.data ?? []}
        isNewUser={!projects || projects.length === 0}
      />
    </AppShell>
  )
}
