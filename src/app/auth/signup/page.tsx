'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    // The public.users row is auto-created by the on_auth_user_created trigger.
    // full_name is read from raw_user_meta_data; plan + subscription_status come from column defaults.
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    })
    if (err) { setError(err.message); setLoading(false); return }
    if (data.user) {
      router.push('/onboarding')
    } else {
      setLoading(false)
    }
  }

  // ... rest of file (JSX) is unchanged