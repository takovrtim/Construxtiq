import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { ReportsClient } from './ReportsClient'
import type { User, Project } from '@/types'

export default async function ReportsPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [jobs, permits, bids, subs, documents] = activeProject ? await Promise.all([
    supabase.from('jobs').select('*').eq('project_id', activeProject.id),
    supabase.from('permits').select('*').eq('project_id', activeProject.id).order('expiry_date'),
    supabase.from('bid_line_items').select('*').eq('project_id', activeProject.id),
    supabase.from('subcontractors').select('*').eq('project_id', activeProject.id),
    supabase.from('documents').select('*').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
  ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }]

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <ReportsClient
        user={user as any}
        project={activeProject as any}
        jobs={(jobs.data ?? []) as any}
        permits={(permits.data ?? []) as any}
        bids={(bids.data ?? []) as any}
        subs={(subs.data ?? []) as any}
        documents={(documents.data ?? []) as any}
      />
    </AppShell>
  )
}
