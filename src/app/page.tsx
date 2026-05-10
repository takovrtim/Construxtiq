import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", background: '#fdfcfb', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-orange { display: inline-flex; align-items: center; gap: 8px; background: #E8520A; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 15px; font-weight: 700; transition: all 0.15s; border: none; cursor: pointer; font-family: inherit; }
        .btn-orange:hover { background: #c94408; transform: translateY(-1px); }
        .btn-outline { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: #0a0a0a; text-decoration: none; padding: 13px 22px; border-radius: 12px; font-size: 15px; font-weight: 500; border: 1.5px solid #e5e5e5; transition: all 0.15s; }
        .btn-outline:hover { border-color: #0a0a0a; }
        .tag { display: inline-flex; align-items: center; gap: 6px; background: #FFF4EE; border: 1px solid #FFD9C4; border-radius: 100px; padding: 5px 14px; font-size: 12px; font-weight: 700; color: #E8520A; }
        .feature-card { background: #fdfcfb; border: 1.5px solid #ede9e4; border-radius: 18px; padding: 26px; transition: all 0.18s; }
        .feature-card:hover { border-color: #FFD9C4; box-shadow: 0 8px 28px rgba(232,82,10,0.06); transform: translateY(-2px); }
        .feature-dark { background: #0a0a0a; border: 1.5px solid #0a0a0a; border-radius: 18px; padding: 26px; }
        .price-card { border: 1.5px solid #ede9e4; border-radius: 22px; padding: 30px; background: #fdfcfb; transition: all 0.18s; }
        .price-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.07); }
        .price-featured { border: 1.5px solid #E8520A; border-radius: 22px; padding: 30px; background: #fff8f5; box-shadow: 0 0 0 4px #FFF4EE; }
        .testimonial { background: #f6f4f1; border: 1.5px solid #ede9e4; border-radius: 18px; padding: 26px; }
        .section-alt { background: #f6f4f1; border-top: 1px solid #ede9e4; border-bottom: 1px solid #ede9e4; }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .nav-links { display: none !important; }
          .cta-row { flex-direction: column !important; align-items: stretch !important; }
          .cta-row a { justify-content: center; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .price-grid { grid-template-columns: 1fr !important; }
          .pain-grid { grid-template-columns: 1fr !important; }
          .pain-header { display: none !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .stat-border { border-left: none !important; border-top: 1px solid #ede9e4 !important; }
          .stat-first { border-top: none !important; }
          .stat-second { border-top: none !important; }
          .footer-row { flex-direction: column !important; gap: 14px !important; }
          .mockup-sidebar { display: none !important; }
          .mockup-grid { grid-template-columns: 1fr !important; }
          .hero-h1 { font-size: clamp(38px, 10vw, 72px) !important; letter-spacing: -1.5px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(253,252,251,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #ede9e4' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, background: '#E8520A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', color: '#0a0a0a' }}>ConstructIQ</span>
          </Link>
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#features" style={{ fontSize: 14, color: '#666', textDecoration: 'none' }}>Features</a>
            <a href="#how-it-works" style={{ fontSize: 14, color: '#666', textDecoration: 'none' }}>How it works</a>
            <a href="#pricing" style={{ fontSize: 14, color: '#666', textDecoration: 'none' }}>Pricing</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/auth/login" className="hide-mobile" style={{ fontSize: 14, color: '#666', textDecoration: 'none', padding: '8px 14px' }}>Sign in</Link>
            <Link href="/auth/signup" className="btn-orange" style={{ padding: '9px 18px', fontSize: 13 }}>Get started free</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 64px', textAlign: 'center' }}>
        <div className="tag" style={{ marginBottom: 28 }}>Built for electrical and plumbing contractors</div>
        <h1 className="hero-h1" style={{ fontSize: 'clamp(44px,7.5vw,92px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 0.95, marginBottom: 28, color: '#0a0a0a' }}>
          Run your jobs.<br />
          <span style={{ color: '#E8520A' }}>Not your paperwork.</span>
        </h1>
        <p style={{ fontSize: 18, color: '#666', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 40px' }}>
          ConstructIQ is the operating system for contractors. Permits, crew, change orders, invoices — one place.
        </p>
        <div className="cta-row" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <Link href="/auth/signup" className="btn-orange">Start free — 14 days</Link>
          <a href="#how-it-works" className="btn-outline">See how it works</a>
        </div>
        <p style={{ fontSize: 12, color: '#bbb' }}>No credit card · 2 minute setup · Cancel anytime</p>

        {/* DASHBOARD MOCKUP */}
        <div style={{ marginTop: 64, background: '#0a0a0a', borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.12)', textAlign: 'left' }}>
          <div style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '3px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>construxtiq.app/dashboard</div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#E8520A' }} />
              Live
            </div>
          </div>
          <div className="mockup-grid" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', minHeight: 360 }}>
            <div className="mockup-sidebar" style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: '14px 6px' }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase', padding: '0 10px 6px' }}>Operations</div>
              <div style={{ padding: '7px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, color: '#E8520A', background: 'rgba(232,82,10,0.12)', marginBottom: 1 }}>Dashboard</div>
              <div style={{ padding: '7px 10px', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>Job Board</div>
              <div style={{ padding: '7px 10px', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>Timeline</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase', padding: '10px 10px 6px' }}>Field</div>
              <div style={{ padding: '7px 10px', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>Safety</div>
              <div style={{ padding: '7px 10px', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>Crew Time</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase', padding: '10px 10px 6px' }}>Money</div>
              <div style={{ padding: '7px 10px', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>Invoices</div>
              <div style={{ padding: '7px 10px', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>Changes</div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '18px 22px', marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Las Vegas</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 16 }}>Good morning, John</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {[['Active Jobs','3',false],['Crew Today','5',false],['Alerts','2',true],['Revenue','$130k',false]].map(([l,v,a]: any) => (
                    <div key={l} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 9, padding: '9px 11px' }}>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{l}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: a ? '#E8520A' : 'white' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'rgba(232,82,10,0.08)', border: '1px solid rgba(232,82,10,0.2)', borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>📋</span>
                  <div><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Permit expires in 3 days</div><div style={{ fontSize: 10, color: '#E8520A', marginTop: 2 }}>PLM-2024-891</div></div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>🦺</span>
                  <div><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>No safety check today</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Complete before crew starts</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="section-alt">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[['14','days','Free trial, no card needed'],['6','min','Average setup time'],['10+','','Tools replaced by one app'],['100%','','Built for mobile on site']].map(([n,u,l],i) => (
              <div key={l} className={`stat-border${i===0?' stat-first':i===1?' stat-second':''}`} style={{ padding: '40px 32px', borderLeft: i > 0 ? '1px solid #ede9e4' : 'none' }}>
                <div style={{ fontSize: 'clamp(34px,4vw,52px)', fontWeight: 900, letterSpacing: '-2px', color: '#0a0a0a', lineHeight: 1 }}>
                  {n}<span style={{ fontSize: '0.5em', color: '#E8520A', fontWeight: 700 }}>{u}</span>
                </div>
                <div style={{ fontSize: 13, color: '#999', marginTop: 7 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px' }}>
        <div style={{ marginBottom: 56 }}>
          <div className="tag" style={{ marginBottom: 16 }}>How it works</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.08, maxWidth: 540 }}>From job site to invoiced — one place.</h2>
        </div>
        <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 48 }}>
          {[
            { n: '01', title: 'Create a project', body: 'Add your job details. Track permits, blueprints, and contracts — everything organized from day one.' },
            { n: '02', title: 'Manage daily ops', body: 'Log crew time, run safety checks, track materials, take photos — all from your phone on the job site.' },
            { n: '03', title: 'Invoice and get paid', body: 'Build invoices in seconds. Approved changes import automatically. Track every dollar you are owed.' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ width: 36, height: 36, background: '#E8520A', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white', flexShrink: 0 }}>{s.n}</div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px' }}>{s.title}</div>
              <div style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section-alt">
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div className="tag" style={{ marginBottom: 16 }}>Features</div>
              <h2 style={{ fontSize: 'clamp(26px,4vw,48px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.08 }}>Everything a sub actually needs.</h2>
            </div>
            <p style={{ fontSize: 14, color: '#999', maxWidth: 240, lineHeight: 1.7 }}>Built from real conversations with electrical and plumbing contractors.</p>
          </div>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { icon: '📋', title: 'Permit Tracking', body: 'Auto alerts at 14, 7, and 1 day before expiry. Never get a stop-work order again.', dark: true },
              { icon: '📅', title: 'Delay Tracker', body: 'Log every delay and who caused it. GC-caused days tracked separately. Export PDF for your next meeting.' },
              { icon: '📊', title: 'Scope Change Log', body: 'Every spec change from the GC documented with original scope, new scope, cost and time impact.' },
              { icon: '⏱️', title: 'Crew Time Tracking', body: 'Clock in/out per job. Overtime alerts. Auto labor cost calc. Know what every job costs.' },
              { icon: '🦺', title: 'Safety Checklists', body: '17-item pre-job checklist. Timestamped legal record. Protects you in disputes.' },
              { icon: '💵', title: 'Invoice Builder', body: 'Professional invoices in seconds. Approved change orders import automatically.' },
              { icon: '📸', title: 'Photo Documentation', body: 'Before, during, after — tied to each job. Your proof when anything goes sideways.' },
              { icon: '🔄', title: 'Change Orders', body: 'Send a link. GC taps approve or reject. Every change documented with timestamps.' },
              { icon: '🛡️', title: 'Warranty Tracker', body: 'Log warranties on every material and job. Get alerted before they expire.' },
            ].map(f => (
              <div key={f.title} className={f.dark ? 'feature-dark' : 'feature-card'}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 7, color: f.dark ? '#fff' : '#0a0a0a' }}>{f.title}</div>
                <div style={{ fontSize: 13, color: f.dark ? 'rgba(255,255,255,0.38)' : '#999', lineHeight: 1.7 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAIN / SOLUTION */}
      <section style={{ maxWidth: 880, margin: '0 auto', padding: '96px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="tag" style={{ marginBottom: 16 }}>Sound familiar?</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.08 }}>Every sub has the same problems.</h2>
        </div>
        <div className="pain-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1.5px solid #ede9e4', borderRadius: 20, overflow: 'hidden' }}>
          <div className="pain-header" style={{ padding: '12px 22px', background: '#f6f4f1', borderBottom: '1px solid #ede9e4', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>The problem</div>
          <div className="pain-header" style={{ padding: '12px 22px', background: '#FFF4EE', borderBottom: '1px solid #FFD9C4', fontSize: 11, fontWeight: 700, color: '#E8520A', textTransform: 'uppercase', letterSpacing: '0.5px', borderLeft: '1px solid #ede9e4' }}>ConstructIQ fixes it</div>
          {[
            ['GC changed the spec, nothing in writing', 'Scope change log with cost and time impact documented'],
            ['Small delays that pile up, nobody tracks them', 'Delay tracker shows every delay, who caused it, total days lost'],
            ['Permit expired and you had no idea', 'Auto email at 14, 7, 1 day before expiry'],
            ['Crew showed up, nobody logged hours', 'One-tap clock in/out with auto labor cost calc'],
            ['Inspection failed, something was skipped', '17-item safety check before every job'],
          ].map(([prob, sol], i) => (
            <>
              <div key={`p${i}`} style={{ padding: '16px 22px', borderBottom: i < 4 ? '1px solid #ede9e4' : 'none', fontSize: 13, color: '#666', lineHeight: 1.6, background: i % 2 ? '#f6f4f1' : '#fdfcfb', display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ color: '#ccc', flexShrink: 0 }}>x</span>{prob}
              </div>
              <div key={`s${i}`} style={{ padding: '16px 22px', borderBottom: i < 4 ? '1px solid #FFD9C4' : 'none', fontSize: 13, color: '#0a0a0a', fontWeight: 600, lineHeight: 1.6, background: i % 2 ? '#FFF8F4' : '#FFF4EE', borderLeft: '1px solid #FFD9C4', display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ color: '#E8520A', flexShrink: 0 }}>ok</span>{sol}
              </div>
            </>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section-alt" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, letterSpacing: '-1.5px' }}>Built for people like you.</h2>
          </div>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              { q: 'The permit alert alone saved me from a $12,000 stop-work order. I had no idea it was about to expire.', name: 'Marcus T.', role: 'Electrical Contractor, Las Vegas' },
              { q: 'Every time the GC changed the scope I used to just eat it. Now I log it and have a paper trail for every single change.', name: 'John R.', role: 'Electrical Sub, Las Vegas' },
              { q: 'My labor costs dropped 18% in the first 3 months because I could finally see what each job actually cost.', name: 'David K.', role: 'Plumbing Contractor, Henderson NV' },
            ].map(t => (
              <div key={t.name} className="testimonial">
                <div style={{ fontSize: 30, color: '#E8520A', marginBottom: 14, lineHeight: 1, fontFamily: 'Georgia, serif' }}>"</div>
                <p style={{ fontSize: 14, color: '#333', lineHeight: 1.75, marginBottom: 20 }}>{t.q}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#E8520A', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="tag" style={{ marginBottom: 16 }}>Pricing</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 10, lineHeight: 1.08 }}>Simple, honest pricing.</h2>
          <p style={{ fontSize: 15, color: '#999' }}>One missed permit costs more than a year of ConstructIQ.</p>
        </div>
        <div className="price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { name: 'Starter', price: 49, desc: 'For subs just getting organized', features: ['1 project','Permit tracking and alerts','Daily log and safety checks','Crew time tracking','Basic job board'], featured: false },
            { name: 'Pro', price: 99, desc: 'For active subs on multiple jobs', features: ['5 projects','Everything in Starter','Delay tracker and scope log','Change order approvals','Invoice builder','SMS permit alerts'], featured: true },
            { name: 'Company', price: 249, desc: 'For companies with multiple crews', features: ['Unlimited projects','5 team seats','Everything in Pro','Custom reports','Priority support'], featured: false },
          ].map(plan => (
            <div key={plan.name} className={plan.featured ? 'price-featured' : 'price-card'}>
              {plan.featured && <div style={{ background: '#E8520A', color: 'white', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 100, display: 'inline-block', marginBottom: 16, letterSpacing: '0.5px' }}>MOST POPULAR</div>}
              <div style={{ fontSize: 12, fontWeight: 700, color: '#999', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-2px', color: '#0a0a0a' }}>${plan.price}</span>
                <span style={{ fontSize: 14, color: '#999' }}>/mo</span>
              </div>
              <p style={{ fontSize: 13, color: '#999', marginBottom: 22, lineHeight: 1.5 }}>{plan.desc}</p>
              <Link href="/auth/signup" className={plan.featured ? 'btn-orange' : 'btn-outline'} style={{ display: 'flex', justifyContent: 'center', marginBottom: 22, width: '100%' }}>Start free</Link>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#444' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#E8520A" opacity="0.1"/><path d="M7 12l4 4 6-6" stroke="#E8520A" strokeWidth="2" strokeLinecap="round"/></svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ background: '#0a0a0a', borderRadius: 28, padding: 'clamp(48px,6vw,80px) 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 260, height: 260, borderRadius: '50%', background: 'rgba(232,82,10,0.12)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -70, left: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(232,82,10,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(30px,5vw,58px)', fontWeight: 900, letterSpacing: '-2px', color: 'white', marginBottom: 16, lineHeight: 1.05 }}>
              Stop running your business from a notes app.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.38)', margin: '0 auto 40px', maxWidth: 380, lineHeight: 1.65 }}>
              ConstructIQ is built for the job site. On your phone. Under pressure.
            </p>
            <div className="cta-row" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth/signup" className="btn-orange" style={{ boxShadow: '0 0 60px rgba(232,82,10,0.28)' }}>Start free today</Link>
              <Link href="/auth/login" className="btn-outline" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>Sign in</Link>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 20 }}>14 days free · No credit card · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #ede9e4', padding: '26px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }} className="footer-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, background: '#E8520A', borderRadius: 5 }} />
            <span style={{ fontSize: 13, color: '#bbb' }}>ConstructIQ 2025</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#bbb' }}>
            <Link href="/auth/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/auth/signup" style={{ color: 'inherit', textDecoration: 'none' }}>Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
