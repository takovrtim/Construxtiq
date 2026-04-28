import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { TrainingClient } from './TrainingClient'
import type { User, Project, TrainingModule, Document } from '@/types'

export default async function TrainingPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [modules, blueprints] = await (activeProject ? Promise.all([
    supabase.from('training_modules').select('*').eq('project_id', activeProject.id).order('module_number'),
    supabase.from('documents').select('id, name, doc_type, created_at').eq('project_id', activeProject.id).in('doc_type', ['blueprint', 'permit']).order('created_at', { ascending: false }),
  ]) : [{ data: [] }, { data: [] }])

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <TrainingClient
        user={user as User}
        project={activeProject as Project | null}
        initialModules={(modules.data ?? []) as TrainingModule[]}
        blueprints={(blueprints.data ?? []) as Pick<Document, 'id' | 'name' | 'doc_type' | 'created_at'>[]}
      />
    </AppShell>
  )
}
