import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { BidsClient } from './BidsClient'
import type { User, Project, BidLineItem, Subcontractor } from '@/types'

export default async function BidsPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')

  const activeProject = projects?.[0] ?? null

  const [bids, subs] = await (activeProject ? Promise.all([
    supabase.from('bid_line_items').select('*').eq('project_id', activeProject.id).order('sort_order'),
    supabase.from('subcontractors').select('id, company_name, trade').eq('project_id', activeProject.id),
  ]) : [{ data: [] }, { data: [] }])

  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <BidsClient
        user={user as User}
        project={activeProject as Project | null}
        initialBids={(bids.data ?? []) as BidLineItem[]}
        subs={(subs.data ?? []) as Pick<Subcontractor, 'id' | 'company_name' | 'trade'>[]}
      />
    </AppShell>
  )
}
