import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  // Already logged in → go straight to dashboard
  if (user) redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' }}>
          <div style={{ width: 26, height: 26, background: '#1a1a1a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".6"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".35"/>
            </svg>
          </div>
          ConstructIQ
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/auth/login" style={{ fontSize: 13, color: '#6b6a66', textDecoration: 'none', padding: '6px 12px' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ fontSize: 13, fontWeight: 500, background: '#d95f2b', color: 'white', textDecoration: 'none', padding: '6px 16px', borderRadius: 8 }}>Start free trial →</Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#edf5f0', color: '#1a4d31', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, marginBottom: 24, letterSpacing: '0.3px' }}>
          General Contractor OS
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 600, letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 20, color: '#111110' }}>
          Stop losing money on<br />permits and bad bids
        </h1>
        <p style={{ fontSize: 16, color: '#6b6a66', lineHeight: 1.7, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
          Upload a permit or sub bid — AI reads it in seconds, extracts every field, flags pricing issues privately, and drafts your reply. Built for General Contractors.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/signup" style={{ fontSize: 14, fontWeight: 600, background: '#1a1a1a', color: 'white', textDecoration: 'none', padding: '11px 28px', borderRadius: 10 }}>
            Start 14-day free trial →
          </Link>
          <Link href="/auth/login" style={{ fontSize: 14, fontWeight: 500, background: 'white', color: '#1a1a1a', textDecoration: 'none', padding: '11px 24px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.14)' }}>
            Sign in
          </Link>
        </div>
        <p style={{ marginTop: 16, fontSize: 12, color: '#9e9d99' }}>No credit card required · Cancel anytime</p>
      </div>

      {/* FEATURES */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {[
          { icon: '📄', title: 'AI Document Parsing', desc: 'Upload any permit, blueprint, or contract. AI extracts every field — permit number, expiry, valuation, conditions — in under 10 seconds.' },
          { icon: '💰', title: 'Private Bid Analysis', desc: 'AI compares bids against market rates and flags overpriced subs. Your internal notes never reach the subcontractor.' },
          { icon: '✉️', title: 'AI Reply Composer', desc: "Click 'AI Draft' and get a professional reply citing exact permit requirements and scope gaps. Send in one click." },
          { icon: '🔔', title: 'Permit Expiry Alerts', desc: 'Get texts and emails at 30, 14, and 7 days before a permit expires. Never get hit with a stop-work order.' },
          { icon: '🎓', title: 'Training Hub', desc: 'AI converts your blueprints into crew training modules. New hire gets a link instead of a 3-hour meeting.' },
          { icon: '📱', title: 'Works on Job Site', desc: 'Mobile-first design. Upload a photo, review a permit, send a reply — all from your phone on the job site.' },
        ].map(f => (
          <div key={f.title} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '20px 18px' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: '#6b6a66', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* PRICING TEASER */}
      <div style={{ background: '#1a1a1a', color: 'white', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 12 }}>Simple pricing</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 32 }}>
            A GC paying $145K for a bad roofing bid will pay $99/mo to catch it before signing.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { name: 'Starter', price: '$49', desc: '1 project · 20 docs/mo' },
              { name: 'Pro', price: '$99', desc: '5 projects · Unlimited docs', featured: true },
              { name: 'Company', price: '$249', desc: 'Unlimited · 5 team seats' },
            ].map(p => (
              <div key={p.name} style={{ background: p.featured ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${p.featured ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '16px 12px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>{p.name}</div>
                <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>{p.price}<span style={{ fontSize: 12, fontWeight: 400, opacity: 0.5 }}>/mo</span></div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{p.desc}</div>
              </div>
            ))}
          </div>
          <Link href="/auth/signup" style={{ display: 'inline-block', background: '#d95f2b', color: 'white', textDecoration: 'none', padding: '11px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
            Start free — 14 days no card →
          </Link>
        </div>
      </div>
    </div>
  )
}
