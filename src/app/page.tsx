import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div style={{ fontFamily: "sans-serif", background: "#fdfcfb", minHeight: "100vh" }}>
      <nav style={{ padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ede9e4" }}>
        <span style={{ fontSize: 16, fontWeight: 800 }}>ConstructIQ</span>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/auth/login" style={{ fontSize: 14, color: "#666", textDecoration: "none" }}>Sign in</Link>
          <Link href="/auth/signup" style={{ fontSize: 14, fontWeight: 700, background: "#E8520A", color: "white", textDecoration: "none", padding: "8px 16px", borderRadius: 8 }}>Get started</Link>
        </div>
      </nav>
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(40px,7vw,80px)", fontWeight: 900, letterSpacing: "-3px", lineHeight: 1, marginBottom: 24 }}>
          Run your jobs.<br /><span style={{ color: "#E8520A" }}>Not your paperwork.</span>
        </h1>
        <p style={{ fontSize: 18, color: "#666", marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
          ConstructIQ is the operating system for electrical and plumbing contractors.
        </p>
        <Link href="/auth/signup" style={{ display: "inline-block", background: "#E8520A", color: "white", textDecoration: "none", padding: "14px 32px", borderRadius: 12, fontSize: 16, fontWeight: 700 }}>
          Start free — 14 days
        </Link>
        <p style={{ fontSize: 12, color: "#bbb", marginTop: 16 }}>No credit card · Cancel anytime</p>
      </main>
    </div>
  )
}
