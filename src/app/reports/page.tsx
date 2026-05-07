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

  const [jobs, permits, inspections, changes, crewTime, materials, invoices, logs, safety] = activeProject
    ? await Promise.all([
        supabase.from('jobs').select('*').eq('project_id', activeProject.id),
        supabase.from('permits').select('*').eq('project_id', activeProject.id),
        supabase.from('inspections').select('*').eq('project_id', activeProject.id),
        supabase.from('change_orders').select('*').eq('project_id', activeProject.id),
        supabase.from('crew_time').select('*').eq('project_id', activeProject.id),
        supabase.from('materials').select('*').eq('project_id', activeProject.id),
        supabase.from('invoices').select('*').eq('project_id', activeProject.id),
        supabase.from('job_logs').select('*').eq('project_id', activeProject.id),
        supabase.from('safety_checklists').select('*').eq('project_id', activeProject.id),
      ])
    : Array(9).fill({ data: [] })

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <ReportsClient
        user={user as any}
        project={activeProject as any}
        jobs={(jobs?.data ?? []) as any}
        permits={(permits?.data ?? []) as any}
        inspections={(inspections?.data ?? []) as any}
        changes={(changes?.data ?? []) as any}
        crewTime={(crewTime?.data ?? []) as any}
        materials={(materials?.data ?? []) as any}
        invoices={(invoices?.data ?? []) as any}
        logs={(logs?.data ?? []) as any}
        safety={(safety?.data ?? []) as any}
      />
    </AppShell>
  )
}
