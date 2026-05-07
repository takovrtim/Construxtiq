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

  const [jobs, permits, inspections, changes, crewTime, materials, safetyChecklists] = activeProject
    ? await Promise.all([
        supabase.from('jobs').select('id,title,status,client_name,contract_value').eq('project_id', activeProject.id),
        supabase.from('permits').select('id,permit_number,permit_type,expiry_date,status').eq('project_id', activeProject.id).eq('status', 'active'),
        supabase.from('inspections').select('id,inspection_type,status,scheduled_date').eq('project_id', activeProject.id),
        supabase.from('change_orders').select('id,title,status,cost_impact').eq('project_id', activeProject.id),
        supabase.from('crew_time').select('id,worker_name,work_date,hours').eq('project_id', activeProject.id),
        supabase.from('materials').select('id,name,status,flagged').eq('project_id', activeProject.id),
        supabase.from('safety_checklists').select('id,job_date,completed_by,all_clear').eq('project_id', activeProject.id).order('created_at', { ascending: false }).limit(30),
      ])
    : Array(7).fill({ data: [] })

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <DashboardClient
        user={user as any}
        project={activeProject as any}
        projects={(projects ?? []) as any}
        jobs={(jobs?.data ?? []) as any}
        permits={(permits?.data ?? []) as any}
        inspections={(inspections?.data ?? []) as any}
        changes={(changes?.data ?? []) as any}
        crewTime={(crewTime?.data ?? []) as any}
        materials={(materials?.data ?? []) as any}
        safetyChecklists={(safetyChecklists?.data ?? []) as any}
      />
    </AppShell>
  )
}
