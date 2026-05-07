import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { WarrantyClient } from './WarrantyClient'
import type { User, Project } from '@/types'

export default async function WarrantyPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [warranties, jobs] = activeProject ? await Promise.all([
    supabase.from('warranties').select('*').eq('project_id', activeProject.id).order('expiry_date'),
    supabase.from('jobs').select('id, title').eq('project_id', activeProject.id),
  ]) : [{ data: [] }, { data: [] }]

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <WarrantyClient
        user={user as any}
        project={activeProject as any}
        initialWarranties={(warranties.data ?? []) as any}
        jobs={(jobs.data ?? []) as any}
      />
    </AppShell>
  )
}
