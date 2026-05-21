'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const { data, error: err } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName.trim() } } })
    if (err) { setError(err.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('users').upsert({ id: data.user.id, email, full_name: fullName.trim(), plan: 'trial', onboarded: false })
      router.push('/onboarding')
    }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', fontSize: 15, border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 10, background: 'rgba(255,255,255,0.04)', color: 'white', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginBottom: 44 }}>
        <div style={{ width: 30, height: 30, background: '#d95f2b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', color: 'white' }}>SubIQ</span>
      </Link>

      <div style={{ width: '100%', maxWidth: 380, background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: 'white', marginBottom: 5 }}>Create your account</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>14 days free · No credit card required</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(184,50,50,0.12)', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>{error}</div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Full Name', type: 'text', value: fullName, set: setFullName, placeholder: 'John Rodriguez', auto: true },
            { label: 'Email', type: 'email', value: email, set: setEmail, placeholder: 'you@company.com', auto: false },
            { label: 'Password', type: 'password', value: password, set: setPassword, placeholder: 'Min. 8 characters', auto: false },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
              <input type={f.type} required autoFocus={f.auto} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={inp} />
            </div>
          ))}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 11, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', background: loading ? 'rgba(217,95,43,0.4)' : '#d95f2b', color: 'white', fontFamily: 'inherit', marginTop: 4, letterSpacing: '-0.2px' }}>
            {loading ? 'Creating account...' : 'Create account’'}
          </button>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', textAlign: 'center', lineHeight: 1.6 }}>
            By signing up you agree to our <Link href="/terms" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Terms</Link> and <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Privacy Policy</Link>
          </p>
        </form>
      </div>

      <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
        Already have an account?{' '}
        <Link href="/auth/login" style={{ color: '#d95f2b', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
      </p>
    </div>
  )
}
