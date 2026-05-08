import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", background: '#080808', color: 'white', minHeight: '100vh', overflowX: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-text-size-adjust: 100%; }

        .hero-h1 { font-size: clamp(36px, 8vw, 80px); font-weight: 800; letter-spacing: -2px; line-height: 1.04; margin-bottom: 24px; }
        .hero-sub { font-size: clamp(15px, 2.5vw, 18px); color: rgba(255,255,255,0.4); line-height: 1.7; max-width: 460px; margin: 0 auto 44px; }
        .section-h2 { font-size: clamp(26px, 5vw, 48px); font-weight: 800; letter-spacing: -1.5px; line-height: 1.1; }
        .section-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.3); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 14px; }

        .feature-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: rgba(255,255,255,0.05); border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
        .feature-cell { padding: 32px 28px; background: #0e0e0e; }

        .price-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
        .pain-grid { display: grid; grid-template-columns: 1fr 1fr; }

        .app-preview { display: grid; grid-template-columns: 160px 1fr; }
        .app-sidebar { display: block; }

        .cta-buttons { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

        @media (max-width: 680px) {
          .feature-grid { grid-template-columns: 1fr; }
          .feature-cell { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
          .price-grid { grid-template-columns: 1fr; }
          .pain-grid { grid-template-columns: 1fr; }
          .pain-row { flex-direction: column; gap: 6px !important; }
          .app-preview { grid-template-columns: 1fr; }
          .app-sidebar { display: none; }
          .nav-desktop { display: none !important; }
          .hero-h1 { letter-spacing: -1px; }
          .cta-buttons a { width: 100%; text-align: center; }
          .hide-mobile { display: none !important; }
          footer { padding: 24px 20px !important; }
        }
        @media (min-width: 681px) and (max-width: 900px) {
          .feature-grid { grid-template-columns: repeat(2,1fr); }
          .price-grid { grid-template-columns: 1fr; gap: 10px; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 26, height: 26, background: '#d95f2b', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.5px' }}>ConstructIQ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/auth/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '7px 14px' }} className="nav-desktop">Sign in</Link>
          <Link href="/auth/signup" style={{ fontSize: 13, fontWeight: 700, background: 'white', color: '#080808', textDecoration: 'none', padding: '8px 16px', borderRadius: 8, letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>Get started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: 140, paddingBottom: 80, textAlign: 'center', position: 'relative', padding: '140px 20px 80px' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 700, height: 500, background: 'radial-gradient(ellipse at 50% 30%, rgba(217,95,43,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '5px 13px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 32, letterSpacing: '0.1px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2d7a4f', display: 'inline-block', flexShrink: 0 }} />
            For electrical & plumbing contractors
          </div>
          <h1 className="hero-h1">
            Run your jobs.<br />
            <span style={{ color: 'rgba(255,255,255,0.22)' }}>Not your paperwork.</span>
          </h1>
          <p className="hero-sub">
            ConstructIQ handles permits, crew, change orders, and invoices — so you can stay on the job.
          </p>
          <div className="cta-buttons" style={{ marginBottom: 20, padding: '0 16px' }}>
            <Link href="/auth/signup" style={{ fontSize: 15, fontWeight: 700, background: '#d95f2b', color: 'white', textDecoration: 'none', padding: '14px 28px', borderRadius: 12, letterSpacing: '-0.3px', boxShadow: '0 0 40px rgba(217,95,43,0.28)', display: 'inline-block' }}>
              Start free — 14 days
            </Link>
            <Link href="/auth/login" style={{ fontSize: 15, fontWeight: 500, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', textDecoration: 'none', padding: '14px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', letterSpacing: '-0.2px', display: 'inline-block' }}>
              Sign in →
            </Link>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>No credit card · 2 minutes to set up</p>
        </div>
      </section>

      {/* APP PREVIEW */}
      <section style={{ padding: '0 16px 100px', maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 48px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04)' }}>
          {/* Topbar */}
          <div style={{ background: '#0d0d0d', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 18px', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 16, height: 16, background: '#d95f2b', borderRadius: 4 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>ConstructIQ</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 100, padding: '3px 10px 3px 7px', fontSize: 10, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2d7a4f', display: 'inline-block' }} />Smith Residence
              </div>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#d95f2b', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>JR</div>
            </div>
          </div>
          {/* Body */}
          <div className="app-preview" style={{ minHeight: 320 }}>
            <div className="app-sidebar" style={{ background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '10px 5px' }}>
              {[['Operations',['Dashboard','Job Board','Timeline']],['Field',['Safety','Crew Time','Materials']],['Money',['Invoices','Change Orders']]].map(([group, items]: any) => (
                <div key={group}>
                  <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.15)', letterSpacing: '1px', textTransform: 'uppercase', padding: '8px 10px 4px' }}>{group}</div>
                  {items.map((item: string, i: number) => (
                    <div key={item} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 10, color: group === 'Operations' && i === 1 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)', background: group === 'Operations' && i === 1 ? 'rgba(255,255,255,0.07)' : 'transparent', marginBottom: 1, fontWeight: group === 'Operations' && i === 1 ? 600 : 400 }}>{item}</div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ padding: '18px 20px', background: '#0c0c0c' }}>
              <div style={{ background: '#0f0f0f', borderRadius: 12, padding: '16px 18px', marginBottom: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Thursday, May 8</div>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Good morning, John 👋</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {[['Active Jobs','3'],['Crew Today','4'],['Alerts','2'],['Revenue','$42k']].map(([l,v]: any) => (
                    <div key={l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{l}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: l === 'Alerts' ? '#f4845a' : 'white' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'rgba(184,50,50,0.08)', border: '1px solid rgba(184,50,50,0.14)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>📋</span>
                  <div><div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>Permit expires in 3 days</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>PLM-2024-891</div></div>
                </div>
                <div style={{ background: 'rgba(176,110,26,0.08)', border: '1px solid rgba(176,110,26,0.14)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>🦺</span>
                  <div><div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>No safety check today</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>Do it before crew starts</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '60px 16px 90px', maxWidth: 980, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="section-label">Everything you need</div>
          <h2 className="section-h2">Built around how<br />contractors actually work.</h2>
        </div>
        <div className="feature-grid">
          {[
            { icon: '📸', title: 'Photo Documentation', body: 'Before, during, after. Every stage tied to the job. Your proof when anything goes wrong.' },
            { icon: '🔄', title: 'Owner Approvals', body: 'Send a link. Owner approves or rejects from their phone. No more he-said-she-said.' },
            { icon: '⏱️', title: 'Crew Time Tracking', body: 'Clock in/out per job. Overtime alerts. Auto labor cost calc. Know what every job costs.' },
            { icon: '📋', title: 'Permit Alerts', body: 'Email at 14, 7, and 1 day before any permit expires. Never get a stop-work order again.' },
            { icon: '🦺', title: 'Daily Safety Log', body: '17-item checklist before every job. Timestamped. Legal record that protects you in court.' },
            { icon: '💵', title: 'Invoice Builder', body: 'Professional invoices in seconds. Approved change orders import automatically.' },
          ].map((f, i) => (
            <div key={f.title} className="feature-cell" style={{ borderRight: (i+1)%3 !== 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ fontSize: 26, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 8, color: 'white' }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.33)', lineHeight: 1.7 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PAIN POINTS */}
      <section style={{ padding: '40px 16px 90px', maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
        <div className="section-label">Sound familiar?</div>
        <h2 className="section-h2" style={{ marginBottom: 48 }}>Every GC has the<br />same problems.</h2>
        <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', textAlign: 'left' }}>
          {[
            ['Permit expired — you had no idea', 'Email alert 14 days before it expires.'],
            ['Owner changed scope, no paper trail', 'Every change gets owner sign-off via link.'],
            ['Sub overbid and you couldn\'t tell', 'AI compares bids to market rate privately.'],
            ['Crew showed up, nobody logged hours', 'One-tap clock in/out with auto labor cost.'],
            ['Inspection failed — something was missed', '17-item safety checklist before every job.'],
          ].map(([problem, solution], i) => (
            <div key={problem} className="pain-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '18px 22px', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none', gap: 16, background: i % 2 === 0 ? '#0c0c0c' : '#0a0a0a' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>✗ {problem}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>✓ {solution}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '40px 16px 90px', maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
        <div className="section-label">Pricing</div>
        <h2 className="section-h2" style={{ marginBottom: 10 }}>Simple pricing.</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.28)', marginBottom: 44 }}>One missed permit costs more than a year of ConstructIQ.</p>
        <div className="price-grid">
          {[
            { name: 'Starter', price: '$49', desc: '1 project · 20 docs/mo · Permit tracking', featured: false },
            { name: 'Pro', price: '$99', desc: '5 projects · Unlimited · AI replies · SMS alerts', featured: true },
            { name: 'Company', price: '$249', desc: 'Unlimited · 5 seats · Sub portal · Priority support', featured: false },
          ].map(plan => (
            <div key={plan.name} style={{ background: plan.featured ? 'rgba(255,255,255,0.05)' : '#0e0e0e', border: `1px solid ${plan.featured ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16, padding: '24px 20px', position: 'relative' }}>
              {plan.featured && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#d95f2b', color: 'white', fontSize: 9, fontWeight: 700, padding: '3px 12px', borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>MOST POPULAR</div>}
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'left' }}>{plan.name}</div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-2px', marginBottom: 6, textAlign: 'left' }}>
                {plan.price}<span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>/mo</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginBottom: 20, lineHeight: 1.6, textAlign: 'left' }}>{plan.desc}</div>
              <Link href="/auth/signup" style={{ display: 'block', textAlign: 'center', fontSize: 13, fontWeight: 700, background: plan.featured ? '#d95f2b' : 'rgba(255,255,255,0.07)', color: 'white', textDecoration: 'none', padding: '11px', borderRadius: 9 }}>
                Start free →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '40px 16px 110px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 600, height: 400, background: 'radial-gradient(ellipse at 50% 100%, rgba(217,95,43,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="section-h2" style={{ marginBottom: 18 }}>
            Stop running your business<br />from a notes app.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.3)', marginBottom: 40, maxWidth: 380, margin: '0 auto 40px', lineHeight: 1.6 }}>
            ConstructIQ is built for the job site. On your phone. Under pressure.
          </p>
          <Link href="/auth/signup" style={{ fontSize: 15, fontWeight: 700, background: '#d95f2b', color: 'white', textDecoration: 'none', padding: '15px 32px', borderRadius: 12, letterSpacing: '-0.3px', boxShadow: '0 0 50px rgba(217,95,43,0.22)', display: 'inline-block' }}>
            Start free today →
          </Link>
          <div style={{ marginTop: 18, fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>14 days free · No credit card · Cancel anytime</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, background: '#d95f2b', borderRadius: 5, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>ConstructIQ © 2025</span>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          <Link href="/auth/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ color: 'inherit', textDecoration: 'none' }}>Get started</Link>
        </div>
      </footer>

    </div>
  )
}
