import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { MaterialsClient } from './MaterialsClient'
import type { User, Project } from '@/types'

export default async function MaterialsPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [materials, jobs] = activeProject ? await Promise.all([
    supabase.from('materials').select('*').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
    supabase.from('jobs').select('id, title').eq('project_id', activeProject.id),
  ]) : [{ data: [] }, { data: [] }]

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <MaterialsClient
        user={user as any}
        project={activeProject as any}
        initialMaterials={(materials.data ?? []) as any}
        jobs={(jobs.data ?? []) as any}
      />
    </AppShell>
  )
}
