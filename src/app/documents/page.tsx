import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'
import type { User, Project } from '@/types'

export default async function DocumentsPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')
  const [{ data: user }, { data: projects }] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
  ])
  if (!user) redirect('/auth/login')
  const activeProject = projects?.[0] ?? null
  return (
    <AppShell user={user as User} projects={(projects ?? []) as Project[]} activeProject={activeProject as Project | null}>
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Documents</div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>Coming soon</div>
      </div>
    </AppShell>
  )
}