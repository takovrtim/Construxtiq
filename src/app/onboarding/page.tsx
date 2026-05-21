import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import OnboardingFlow from './OnboardingFlow'
import type { User } from '@/types'

export default async function OnboardingPage() {
  const supabase = createServerSupabase()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const { data: user } = await supabase
    .from('users').select('*').eq('id', authUser.id).single()

  if (!user) redirect('/auth/login')
  if (user.onboarded) redirect('/dashboard')

  return <OnboardingFlow user={user as User} />
}
