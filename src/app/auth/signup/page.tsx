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

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: 14,
    border: '1.5px solid #232E42', borderRadius: 10,
    background: '#0F1521', color: '#F1EEE5',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07090E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Space Grotesk', -apple-system, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>

      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginBottom: 40 }}>
        <svg viewBox="0 0 24 24" width={28} height={28}>
          <path d="M12 2 3 5v6.5C3 16.5 6.5 20 12 22c5.5-2 9-5.5 9-10.5V5l-9-3Z" fill="#FF6B1F" stroke="#FF6B1F" strokeWidth="1.2"/>
          <path d="m8 12 3 3 5-6" fill="none" stroke="#07090E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: '#F1EEE5' }}>
          Sub<span style={{ color: '#FF6B1F' }}>IQ</span>
        </span>
      </Link>

      <div style={{ width: '100%', maxWidth: 400, background: '#131A26', border: '1px solid #232E42', borderRadius: 20, padding: '36px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#F1EEE5', marginBottom: 6 }}>Start building your case file</h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#545B6C', textTransform: 'uppercase', letterSpacing: '0.08em' }}>14-day free trial. No credit card.</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,82,96,0.1)', border: '1px solid rgba(255,82,96,0.2)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#FF5260', marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: '#545B6C', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Full Name</label>
            <input
              type="text" required autoFocus
              value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="John Krieger"
              style={inp}
            />
          </div>
          <div>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: '#545B6C', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Email</label>
            <input
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={inp}
            />
          </div>
          <div>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: '#545B6C', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Password</label>
            <input
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={inp}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 11, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', background: loading ? '#1A2333' : '#FF6B1F', color: loading ? '#545B6C' : '#0A0E14', fontFamily: 'inherit', marginTop: 6, letterSpacing: '-0.2px', transition: 'all 0.15s' }}
          >
            {loading ? 'Creating account...' : 'Get started free'}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: '14px', background: 'rgba(79,227,181,0.06)', border: '1px solid rgba(79,227,181,0.15)', borderRadius: 10 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#4FE3B5', lineHeight: 1.6 }}>
            The GC changed the scope. SubIQ makes sure you have proof.
          </div>
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 13, color: '#545B6C' }}>
        Already have an account?{' '}
        <Link href="/auth/login" style={{ color: '#FF6B1F', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
      </p>
    </div>
  )
}
