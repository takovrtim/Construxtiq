import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { InvoicesClient } from './InvoicesClient'
import type { User, Project } from '@/types'

export default async function InvoicesPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [invoices, jobs, changes] = activeProject ? await Promise.all([
    supabase.from('invoices').select('*').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
    supabase.from('jobs').select('id, title, client_name, client_email, client_phone, contract_value').eq('project_id', activeProject.id),
    supabase.from('change_orders').select('id, title, cost_impact, status').eq('project_id', activeProject.id).eq('status', 'approved'),
  ]) : [{ data: [] }, { data: [] }, { data: [] }]

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <InvoicesClient
        user={user as any}
        project={activeProject as any}
        initialInvoices={(invoices.data ?? []) as any}
        jobs={(jobs.data ?? []) as any}
        approvedChanges={(changes.data ?? []) as any}
      />
    </AppShell>
  )
}
