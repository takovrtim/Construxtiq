import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#0a0a0a', color: 'white', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: '#d95f2b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/>
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.5px' }}>ConstructIQ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/auth/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '8px 16px', transition: 'color 0.15s' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ fontSize: 13, fontWeight: 600, background: '#d95f2b', color: 'white', textDecoration: 'none', padding: '9px 20px', borderRadius: 9, transition: 'background 0.15s', letterSpacing: '-0.1px' }}>
            Start free →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: 160, paddingBottom: 100, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(217,95,43,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(217,95,43,0.12)', border: '1px solid rgba(217,95,43,0.25)', borderRadius: 100, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#f4845a', marginBottom: 32, letterSpacing: '0.2px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d95f2b', display: 'inline-block' }} />
          Built for Electrical & Plumbing Contractors
        </div>

        <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1.05, marginBottom: 24, maxWidth: 760, margin: '0 auto 24px' }}>
          Run your crew.<br />
          <span style={{ color: '#d95f2b' }}>Not your paperwork.</span>
        </h1>

        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 40px', fontWeight: 400, letterSpacing: '-0.2px' }}>
          AI reads your permits, tracks every deadline, alerts your crew, and drafts replies — so you can focus on the work.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <Link href="/auth/signup" style={{ fontSize: 15, fontWeight: 700, background: '#d95f2b', color: 'white', textDecoration: 'none', padding: '14px 32px', borderRadius: 12, letterSpacing: '-0.3px', boxShadow: '0 8px 32px rgba(217,95,43,0.35)' }}>
            Start free — 14 days →
          </Link>
          <Link href="/auth/login" style={{ fontSize: 15, fontWeight: 500, background: 'rgba(255,255,255,0.06)', color: 'white', textDecoration: 'none', padding: '14px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', letterSpacing: '-0.2px' }}>
            Sign in
          </Link>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '-0.1px' }}>No credit card · Cancel anytime · Takes 2 minutes</p>
      </section>

      {/* PRODUCT PREVIEW — MOCKUP */}
      <section style={{ padding: '0 24px 100px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.6)' }}>
          {/* Mock topbar */}
          <div style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 20px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 20, height: 20, background: '#d95f2b', borderRadius: 5 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>ConstructIQ</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, padding: '4px 12px 4px 8px', fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2d7a4f', display: 'inline-block' }} />
                The Repair Crew
              </div>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#d95f2b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>JR</div>
            </div>
          </div>
          {/* Mock body */}
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', minHeight: 380 }}>
            {/* Sidebar */}
            <div style={{ background: '#0d0d0d', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '16px 8px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '.8px', textTransform: 'uppercase', padding: '0 10px', marginBottom: 8 }}>The Repair Crew</div>
              {['Dashboard', 'Job Board', 'Documents', 'Bids', 'Crew & Subs', 'Inbox'].map((item, i) => (
                <div key={item} style={{ padding: '8px 10px', borderRadius: 7, fontSize: 12, color: i === 1 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)', background: i === 1 ? 'rgba(255,255,255,0.07)' : 'transparent', marginBottom: 1, display: 'flex', alignItems: 'center', gap: 8, fontWeight: i === 1 ? 500 : 400 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: i === 1 ? '#d95f2b' : 'rgba(255,255,255,0.15)' }} />
                  {item}
                </div>
              ))}
            </div>
            {/* Content */}
            <div style={{ padding: 24, background: '#0a0a0a' }}>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>Job Board</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>The Repair Crew · Electrical & Plumbing · 3 active jobs</div>
              {/* Kanban columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  { label: 'Waiting on Permit', color: '#EF9F27', jobs: ['Panel Upgrade — Johnson', 'Water Heater — Martinez'] },
                  { label: 'Permit Approved', color: '#639922', jobs: ['Rewire — Thompson'] },
                  { label: 'In Progress', color: '#378ADD', jobs: ['Plumbing — Davis'] },
                  { label: 'Inspection', color: '#7F77DD', jobs: [] },
                ].map(col => (
                  <div key={col.label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: col.color }} />
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.4px' }}>{col.label}</div>
                    </div>
                    {col.jobs.map(job => (
                      <div key={job} style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, padding: '10px 12px', marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: 5 }}>{job}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#d95f2b', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>J</div>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>⚡</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#d95f2b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Sound familiar?</div>
        <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 48, lineHeight: 1.15 }}>
          Every GC has the same problems
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, textAlign: 'left' }}>
          {[
            { emoji: '📋', title: 'Permit delays killing your timeline', desc: 'You\'re waiting weeks for approval but don\'t know exactly what\'s missing. ConstructIQ reads the permit and tells you.' },
            { emoji: '💸', title: 'Subs overbidding and you can\'t tell', desc: 'AI compares every bid against market rate privately. You see the flag. Your sub never does.' },
            { emoji: '📱', title: 'Crew can\'t reach you fast enough', desc: 'Message the whole crew from the job card. One tap. Everyone on the same job sees it.' },
            { emoji: '⏰', title: 'Permits expiring without warning', desc: 'Get a text 30, 14, and 7 days before any permit expires. Never get hit with a stop-work order again.' },
            { emoji: '📄', title: 'Documents scattered everywhere', desc: 'Every permit, license, inspection report, and contract in one place. AI reads them all on upload.' },
            { emoji: '🔧', title: 'No system for tracking active jobs', desc: 'See every job — what\'s waiting on permits, what\'s in progress, what needs inspection — at a glance.' },
          ].map(item => (
            <div key={item.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 22 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{item.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.3px' }}>{item.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '80px 24px', maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#d95f2b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Pricing</div>
        <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 12, lineHeight: 1.15 }}>Simple, honest pricing</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 48 }}>One bad sub bid pays for years of ConstructIQ.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'left' }}>
          {[
            { name: 'Starter', price: '$49', period: '/mo', desc: '1 project · 20 docs/mo · Permit tracking', featured: false },
            { name: 'Pro', price: '$99', period: '/mo', desc: '5 projects · Unlimited · AI replies · SMS alerts', featured: true },
            { name: 'Company', price: '$249', period: '/mo', desc: 'Unlimited · 5 seats · Sub portal · Priority support', featured: false },
          ].map(plan => (
            <div key={plan.name} style={{ background: plan.featured ? 'rgba(217,95,43,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${plan.featured ? 'rgba(217,95,43,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 16, padding: 24, position: 'relative' }}>
              {plan.featured && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#d95f2b', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>MOST POPULAR</div>}
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: '0.3px', textTransform: 'uppercase' }}>{plan.name}</div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-2px', marginBottom: 4 }}>
                {plan.price}<span style={{ fontSize: 15, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>{plan.period}</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 1.6 }}>{plan.desc}</div>
              <Link href="/auth/signup" style={{ display: 'block', textAlign: 'center', fontSize: 13, fontWeight: 600, background: plan.featured ? '#d95f2b' : 'rgba(255,255,255,0.08)', color: 'white', textDecoration: 'none', padding: '11px', borderRadius: 9 }}>
                Start free →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ padding: '80px 24px 120px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: 20, lineHeight: 1.1 }}>
          Ready to stop losing<br />money on permits?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 40 }}>
          Join The Repair Crew and contractors across Las Vegas already using ConstructIQ.
        </p>
        <Link href="/auth/signup" style={{ fontSize: 16, fontWeight: 700, background: '#d95f2b', color: 'white', textDecoration: 'none', padding: '16px 40px', borderRadius: 14, letterSpacing: '-0.3px', boxShadow: '0 8px 40px rgba(217,95,43,0.4)', display: 'inline-block' }}>
          Start your free trial today →
        </Link>
        <div style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>14 days free · No credit card · Cancel anytime</div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          <div style={{ width: 20, height: 20, background: '#d95f2b', borderRadius: 5 }} />
          ConstructIQ © 2025
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
          <Link href="/auth/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign in</Link>
        </div>
      </footer>

    </div>
  )
}