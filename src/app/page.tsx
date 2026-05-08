import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", background: '#080808', color: 'white', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', background: 'rgba(8,8,8,0.8)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#d95f2b', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.5px' }}>ConstructIQ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/auth/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '7px 16px', borderRadius: 8, transition: 'color 0.15s' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ fontSize: 13, fontWeight: 700, background: 'white', color: '#080808', textDecoration: 'none', padding: '8px 18px', borderRadius: 8, letterSpacing: '-0.2px' }}>Get started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: 180, paddingBottom: 120, textAlign: 'center', position: 'relative' }}>
        {/* Subtle radial glow */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 800, height: 600, background: 'radial-gradient(ellipse at 50% 30%, rgba(217,95,43,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 40, letterSpacing: '0.1px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2d7a4f', display: 'inline-block' }} />
            For electrical & plumbing contractors
          </div>

          <h1 style={{ fontSize: 'clamp(44px, 7vw, 80px)', fontWeight: 800, letterSpacing: '-3px', lineHeight: 1.02, marginBottom: 28, maxWidth: 800, margin: '0 auto 28px' }}>
            Run your jobs.<br />
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>Not your paperwork.</span>
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 48px', fontWeight: 400, letterSpacing: '-0.2px' }}>
            ConstructIQ handles permits, crew, change orders, and invoices — so you can stay on the job.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            <Link href="/auth/signup" style={{ fontSize: 15, fontWeight: 700, background: '#d95f2b', color: 'white', textDecoration: 'none', padding: '14px 32px', borderRadius: 12, letterSpacing: '-0.3px', boxShadow: '0 0 40px rgba(217,95,43,0.3)' }}>
              Start free — 14 days
            </Link>
            <Link href="/auth/login" style={{ fontSize: 15, fontWeight: 500, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', padding: '14px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', letterSpacing: '-0.2px' }}>
              Sign in →
            </Link>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '-0.1px' }}>No credit card · 2 minutes to set up</p>
        </div>
      </section>

      {/* APP PREVIEW */}
      <section style={{ padding: '0 24px 120px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 60px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)' }}>
          {/* Topbar */}
          <div style={{ background: '#0d0d0d', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 20px', height: 46, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 18, height: 18, background: '#d95f2b', borderRadius: 5 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>ConstructIQ</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 100, padding: '4px 12px 4px 8px', fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2d7a4f', display: 'inline-block' }} />
                Smith Residence
              </div>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#d95f2b', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>JR</div>
            </div>
          </div>
          {/* Body */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', minHeight: 360 }}>
            {/* Sidebar */}
            <div style={{ background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '12px 6px' }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.15)', letterSpacing: '1px', textTransform: 'uppercase', padding: '0 10px', marginBottom: 10 }}>Operations</div>
              {[['Dashboard', false], ['Job Board', true], ['Timeline', false]].map(([item, active]) => (
                <div key={item as string} style={{ padding: '7px 10px', borderRadius: 7, fontSize: 11, color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', background: active ? 'rgba(255,255,255,0.07)' : 'transparent', marginBottom: 1, fontWeight: active ? 600 : 400 }}>
                  {item as string}
                </div>
              ))}
              <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.15)', letterSpacing: '1px', textTransform: 'uppercase', padding: '12px 10px 6px', marginTop: 4 }}>Field</div>
              {[['Safety', false], ['Crew Time', false], ['Materials', false]].map(([item]) => (
                <div key={item as string} style={{ padding: '7px 10px', borderRadius: 7, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>{item as string}</div>
              ))}
              <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.15)', letterSpacing: '1px', textTransform: 'uppercase', padding: '12px 10px 6px' }}>Money</div>
              {[['Invoices', false], ['Change Orders', false]].map(([item]) => (
                <div key={item as string} style={{ padding: '7px 10px', borderRadius: 7, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>{item as string}</div>
              ))}
            </div>
            {/* Main */}
            <div style={{ padding: '20px 24px', background: '#0c0c0c' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ background: '#0f0f0f', borderRadius: 14, padding: '18px 22px', marginBottom: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Thursday, May 8</div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Good morning, John 👋</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                    {[['Active Jobs', '3'], ['Crew Today', '4'], ['Alerts', '2'], ['Revenue', '$42k']].map(([l,v]) => (
                      <div key={l as string} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: '10px 12px' }}>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{l as string}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: (l as string) === 'Alerts' ? '#f4845a' : 'white' }}>{v as string}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: 'rgba(184,50,50,0.08)', border: '1px solid rgba(184,50,50,0.15)', borderRadius: 11, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>📋</span>
                    <div><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Permit expires in 3 days</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>PLM-2024-891 · Renew now</div></div>
                  </div>
                  <div style={{ background: 'rgba(176,110,26,0.08)', border: '1px solid rgba(176,110,26,0.15)', borderRadius: 11, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>🦺</span>
                    <div><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>No safety check today</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Complete before crew starts</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES — Apple-style clean grid */}
      <section style={{ padding: '80px 24px 100px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>Everything you need</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.1 }}>
            Built around how<br />contractors actually work.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { icon: '📸', title: 'Photo Documentation', body: 'Before, during, after. Every stage documented and tied to the job. Your proof if anything goes wrong.' },
            { icon: '🔄', title: 'Owner Approvals', body: 'Send a link. Owner taps approve or reject from their phone. No more "I never said that."' },
            { icon: '⏱️', title: 'Crew Time Tracking', body: 'Clock in/out per job. Overtime alerts. Auto labor cost calculation. Know exactly what each job costs.' },
            { icon: '📋', title: 'Permit Alerts', body: 'Automatic email at 14, 7, and 1 day before any permit expires. Never get a stop-work order again.' },
            { icon: '🦺', title: 'Daily Safety Log', body: '17-item checklist before every job. Timestamped. Creates a legal record that protects you.' },
            { icon: '💵', title: 'Invoice Builder', body: 'Professional invoices in seconds. Import approved change orders automatically. Track what you\'re owed.' },
          ].map((f, i) => (
            <div key={f.title} style={{ padding: '32px 28px', background: '#0e0e0e', borderRight: (i+1)%3 !== 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 10, color: 'white' }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PAIN POINTS — minimal */}
      <section style={{ padding: '60px 24px 100px', maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>Sound familiar?</div>
        <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 56, lineHeight: 1.15 }}>Every GC has the same problems.</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, textAlign: 'left', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
          {[
            ['Permit expired and you didn\'t know', 'ConstructIQ emails you 14 days before expiry.'],
            ['Owner changed their mind — again — with no paper trail', 'Every change order gets owner sign-off via a shareable link.'],
            ['Sub overbid and you couldn\'t tell', 'AI compares bids against market rate. You see the flag privately.'],
            ['Crew showed up but nobody logged their hours', 'One tap clock in/out. Overtime alerts. Auto labor cost.'],
            ['Inspection failed because something was missed', '17-item safety checklist before every job. Nothing gets skipped.'],
          ].map(([problem, solution], i) => (
            <div key={problem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '20px 24px', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none', gap: 24, background: i % 2 === 0 ? '#0c0c0c' : '#0a0a0a' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>❌ {problem}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>✓ {solution}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING — clean */}
      <section style={{ padding: '60px 24px 100px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>Pricing</div>
        <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 12, lineHeight: 1.1 }}>Simple pricing.</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.3)', marginBottom: 52 }}>One missed permit costs more than a year of ConstructIQ.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, textAlign: 'left' }}>
          {[
            { name: 'Starter', price: '$49', desc: '1 project · 20 docs/mo · Permit tracking', featured: false },
            { name: 'Pro', price: '$99', desc: '5 projects · Unlimited · AI replies · SMS alerts', featured: true },
            { name: 'Company', price: '$249', desc: 'Unlimited · 5 seats · Sub portal · Priority support', featured: false },
          ].map(plan => (
            <div key={plan.name} style={{ background: plan.featured ? 'rgba(255,255,255,0.05)' : '#0e0e0e', border: `1px solid ${plan.featured ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, padding: '24px 20px', position: 'relative' }}>
              {plan.featured && (
                <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#d95f2b', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>MOST POPULAR</div>
              )}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 10, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{plan.name}</div>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-2px', marginBottom: 6 }}>
                {plan.price}<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>/mo</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 22, lineHeight: 1.6 }}>{plan.desc}</div>
              <Link href="/auth/signup" style={{ display: 'block', textAlign: 'center', fontSize: 13, fontWeight: 700, background: plan.featured ? '#d95f2b' : 'rgba(255,255,255,0.07)', color: 'white', textDecoration: 'none', padding: '11px', borderRadius: 9 }}>
                Start free →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '60px 24px 120px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse at 50% 100%, rgba(217,95,43,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 800, letterSpacing: '-2.5px', marginBottom: 20, lineHeight: 1.05 }}>
            Stop running your business<br />from a notes app.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginBottom: 44, maxWidth: 420, margin: '0 auto 44px' }}>
            ConstructIQ is built for how you actually work. On a job site. On your phone. Under pressure.
          </p>
          <Link href="/auth/signup" style={{ fontSize: 15, fontWeight: 700, background: '#d95f2b', color: 'white', textDecoration: 'none', padding: '15px 36px', borderRadius: 12, letterSpacing: '-0.3px', boxShadow: '0 0 60px rgba(217,95,43,0.25)', display: 'inline-block' }}>
            Start free today →
          </Link>
          <div style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>14 days free · No credit card · Cancel anytime</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, background: '#d95f2b', borderRadius: 5 }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>ConstructIQ © 2025</span>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>
          <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
          <Link href="/auth/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign in</Link>
        </div>
      </footer>

    </div>
  )
}
