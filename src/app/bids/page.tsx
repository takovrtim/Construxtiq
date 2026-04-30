import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import { BidsClient } from './BidsClient'

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

  const [bids, subs] = await Promise.all([
    activeProject
      ? supabase.from('bid_line_items').select('*').eq('project_id', activeProject.id).order('sort_order')
      : { data: [] },
    activeProject
      ? supabase.from('subcontractors').select('*').eq('project_id', activeProject.id).order('created_at')
      : { data: [] },
  ])

  return (
    <AppShell user={user as any} projects={(projects ?? []) as any} activeProject={activeProject as any}>
      <BidsClient
        user={user as any}
        project={activeProject as any}
        initialBids={(bids.data ?? []) as any}
        initialSubs={(subs.data ?? []) as any}
      />
    </AppShell>
  )
}
