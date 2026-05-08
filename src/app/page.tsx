import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", background: '#fff', color: '#0a0a0a', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
        .nav-link { font-size: 14px; color: #666; text-decoration: none; transition: color 0.15s; }
        .nav-link:hover { color: #0a0a0a; }
        .tag { display: inline-flex; align-items: center; gap: 6px; background: #FFF4EE; border: 1px solid #FFD9C4; border-radius: 100px; padding: 5px 14px; font-size: 12px; font-weight: 700; color: #E8520A; letter-spacing: 0.3px; }
        .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: #E8520A; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 15px; font-weight: 700; letter-spacing: -0.3px; transition: all 0.15s; border: none; cursor: pointer; font-family: inherit; }
        .btn-primary:hover { background: #c94408; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(232,82,10,0.3); }
        .btn-ghost { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: #0a0a0a; text-decoration: none; padding: 13px 22px; border-radius: 12px; font-size: 15px; font-weight: 500; border: 1.5px solid #e5e5e5; transition: all 0.15s; cursor: pointer; font-family: inherit; }
        .btn-ghost:hover { border-color: #0a0a0a; }
        .feature-card { background: #fff; border: 1.5px solid #f0f0f0; border-radius: 20px; padding: 28px; transition: all 0.2s; }
        .feature-card:hover { border-color: #FFD9C4; box-shadow: 0 8px 32px rgba(232,82,10,0.06); transform: translateY(-2px); }
        .price-card { border: 1.5px solid #f0f0f0; border-radius: 24px; padding: 32px; transition: all 0.2s; background: #fff; }
        .price-card.featured { border-color: #E8520A; background: #fff8f5; box-shadow: 0 0 0 4px #FFF4EE; }
        .price-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.08); }
        .testimonial { background: #fafafa; border: 1.5px solid #f0f0f0; border-radius: 20px; padding: 28px; }
        .step-num { width: 36px; height: 36px; background: #E8520A; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: white; flex-shrink: 0; }
        .mockup { background: #fff; border: 1.5px solid #e8e8e8; border-radius: 16px; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.1), 0 0 0 1px #f0f0f0; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .hero-cols { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .price-grid { grid-template-columns: 1fr !important; }
          .pain-grid { grid-template-columns: 1fr !important; }
          .pain-header-fix { display: none !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .cta-row { flex-direction: column !important; align-items: stretch !important; }
          .cta-row a, .cta-row button { justify-content: center; }
          .footer-inner { flex-direction: column !important; gap: 16px !important; }
          .hide-mobile { display: none !important; }
          .hero-title { font-size: clamp(40px, 10vw, 80px) !important; letter-spacing: -1.5px !important; }
          .stat-item { border-left: none !important; border-top: 1px solid #e8e8e8; padding: 20px 16px !important; }
          .stat-item:first-child { border-top: none !important; }
          .mockup-sidebar { display: none !important; }
          .mockup-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, background: '#E8520A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', color: '#0a0a0a' }}>ConstructIQ</span>
          </Link>
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#pricing" className="nav-link">Pricing</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/auth/login" className="nav-link hide-mobile" style={{ padding: '8px 14px' }}>Sign in</Link>
            <Link href="/auth/signup" className="btn-primary" style={{ padding: '9px 20px', fontSize: 14 }}>Get started free</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px 56px' }}>
        <div style={{ textAlign: 'center', maxWidth: 880, margin: '0 auto' }}>
          <div className="tag" style={{ marginBottom: 28 }}>⚡ Built for electrical & plumbing contractors</div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(44px, 7.5vw, 92px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 0.96, marginBottom: 28, color: '#0a0a0a' }}>
            Run your jobs.<br />
            <span style={{ color: '#E8520A' }}>Not your paperwork.</span>
          </h1>
          <p style={{ fontSize: 18, color: '#666', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 40px', fontWeight: 400 }}>
            ConstructIQ is the operating system for contractors. Permits, crew, change orders, invoices — one place.
          </p>
          <div className="cta-row" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
            <Link href="/auth/signup" className="btn-primary">
              Start free — 14 days
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <a href="#how-it-works" className="btn-ghost">See how it works</a>
          </div>
          <p style={{ fontSize: 12, color: '#bbb' }}>No credit card · 2 minute setup · Cancel anytime</p>
        </div>

        {/* MOCKUP */}
        <div style={{ marginTop: 64 }} className="mockup">
          <div style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="dot" style={{ background: '#ff5f57' }} />
            <div className="dot" style={{ background: '#febc2e' }} />
            <div className="dot" style={{ background: '#28c840' }} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: '#f0f0f0', borderRadius: 6, padding: '3px 16px', fontSize: 11, color: '#999' }}>construxtiq.app/dashboard</div>
            </div>
          </div>
          <div className="mockup-cols" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', background: '#f9f9f9', minHeight: 400 }}>
            <div className="mockup-sidebar" style={{ background: '#fff', borderRight: '1px solid #f0f0f0', padding: '16px 8px' }}>
              {[['Operations',['Dashboard','Job Board','Timeline']],['Field',['Safety','Crew Time','Materials']],['Money',['Invoices','Change Orders']]].map(([g, items]: any) => (
                <div key={g}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#ccc', letterSpacing: '1px', textTransform: 'uppercase', padding: '8px 10px 4px' }}>{g}</div>
                  {items.map((item: string, idx: number) => (
                    <div key={item} style={{ padding: '7px 10px', borderRadius: 7, fontSize: 11, fontWeight: g==='Operations'&&idx===1?700:400, color: g==='Operations'&&idx===1?'#E8520A':'#999', background: g==='Operations'&&idx===1?'#FFF4EE':'transparent', marginBottom: 1 }}>{item}</div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ background: '#0a0a0a', borderRadius: 14, padding: '18px 22px', marginBottom: 14, color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(232,82,10,0.12)' }} />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thursday, May 8</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Good morning, John 👋</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {[['Active Jobs','3'],['Crew Today','5'],['Alerts','2'],['Revenue','$42k']].map(([l,v]: any) => (
                    <div key={l} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 9, padding: '9px 11px' }}>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{l}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: l==='Alerts'?'#E8520A':'white' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#fff', border: '1.5px solid #FFD9C4', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#FFF4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>📋</div>
                  <div><div style={{ fontSize: 11, fontWeight: 700 }}>Permit expires in 3 days</div><div style={{ fontSize: 10, color: '#E8520A', marginTop: 1 }}>PLM-2024-891 · Renew now</div></div>
                </div>
                <div style={{ background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>🦺</div>
                  <div><div style={{ fontSize: 11, fontWeight: 700 }}>No safety check today</div><div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>Do before crew starts</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[['14', 'days', 'Free trial, no card needed'],['6', 'min', 'Average setup time'],['10+', '', 'Tools replaced by one app'],['100%', '', 'Built for mobile on the job site']].map(([n,u,l], i) => (
              <div key={l} className="stat-item" style={{ padding: '40px 32px', borderLeft: i>0?'1px solid #e8e8e8':'none' }}>
                <div style={{ fontSize: 'clamp(36px,4vw,52px)', fontWeight: 900, letterSpacing: '-2px', color: '#0a0a0a', lineHeight: 1 }}>
                  {n}<span style={{ fontSize: '0.5em', color: '#E8520A', fontWeight: 700 }}>{u}</span>
                </div>
                <div style={{ fontSize: 13, color: '#999', marginTop: 6 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px' }}>
        <div style={{ marginBottom: 56 }}>
          <div className="tag" style={{ marginBottom: 16 }}>How it works</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.1, maxWidth: 560 }}>
            From job site to invoiced — one place.
          </h2>
        </div>
        <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 40 }}>
          {[
            { n: '01', title: 'Create a project', body: 'Drop in your permit, blueprint, or contract. AI reads everything and extracts the key info instantly.' },
            { n: '02', title: 'Manage daily ops', body: 'Log crew time, safety checks, materials, photos — all from your phone on the job site.' },
            { n: '03', title: 'Invoice and get paid', body: 'Build invoices in seconds. Approved changes import automatically. Track what you\'re owed.' },
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="step-num">{step.n}</div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px' }}>{step.title}</div>
              <div style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{step.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 52, flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div className="tag" style={{ marginBottom: 16 }}>Features</div>
              <h2 style={{ fontSize: 'clamp(26px,4vw,48px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                Everything a contractor<br />actually needs.
              </h2>
            </div>
            <p style={{ fontSize: 14, color: '#999', maxWidth: 260, lineHeight: 1.7 }}>Built from real conversations with electrical and plumbing contractors.</p>
          </div>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              { icon: '📋', title: 'Permit Tracking', body: 'Auto alerts at 14, 7, 1 day before expiry. Never get a stop-work order again.', dark: true },
              { icon: '🔄', title: 'Owner Approvals', body: 'Send a link. Owner taps approve or reject from their phone. Every change documented.' },
              { icon: '📸', title: 'Photo Documentation', body: 'Before, during, after. Tied to each job. Your proof when anything goes sideways.' },
              { icon: '⏱️', title: 'Crew Time Tracking', body: 'Clock in/out per job. Overtime alerts. Auto labor cost calc. Know what jobs cost.' },
              { icon: '🦺', title: 'Safety Checklists', body: '17-item pre-job checklist. Timestamped legal record. Protects you in disputes.' },
              { icon: '💵', title: 'Invoice Builder', body: 'Professional invoices in seconds. Approved change orders import automatically.' },
              { icon: '📦', title: 'Material Tracker', body: 'From ordered to installed. Flag delays. Know what\'s on site and what\'s missing.' },
              { icon: '📊', title: 'Job Costing', body: 'Real-time profit and loss per job. See your margin before the job is done.' },
              { icon: '🛡️', title: 'Warranty Tracker', body: 'Log warranties on every material and job. Get alerted before they expire.' },
            ].map(f => (
              <div key={f.title} className="feature-card" style={{ background: f.dark ? '#0a0a0a' : '#fff', borderColor: f.dark ? '#0a0a0a' : '#f0f0f0' }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 7, color: f.dark ? '#fff' : '#0a0a0a' }}>{f.title}</div>
                <div style={{ fontSize: 13, color: f.dark ? 'rgba(255,255,255,0.4)' : '#999', lineHeight: 1.7 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAIN → SOLUTION */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '96px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="tag" style={{ marginBottom: 16 }}>Sound familiar?</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1 }}>Every GC has the same problems.</h2>
        </div>
        <div className="pain-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1.5px solid #f0f0f0', borderRadius: 20, overflow: 'hidden' }}>
          <div className="pain-header-fix" style={{ padding: '13px 22px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>The problem</div>
          <div className="pain-header-fix" style={{ padding: '13px 22px', background: '#FFF4EE', borderBottom: '1px solid #FFD9C4', fontSize: 11, fontWeight: 700, color: '#E8520A', textTransform: 'uppercase', letterSpacing: '0.5px', borderLeft: '1px solid #f0f0f0' }}>ConstructIQ fixes it</div>
          {[
            ["Permit expired — you had no idea","Auto email at 14, 7, 1 day before expiry"],
            ["Owner changed scope, no paper trail","Digital change orders with owner sign-off"],
            ["Sub overbid, you can't tell","AI flags bids vs market rates privately"],
            ["Crew showed up, nobody logged hours","One-tap clock in/out, auto labor cost"],
            ["Inspection failed, something skipped","17-item safety check before every job"],
          ].map(([prob, sol], i) => (
            <>
              <div key={`p${i}`} style={{ padding: '17px 22px', borderBottom: i<4?'1px solid #f0f0f0':'none', fontSize: 13, color: '#666', lineHeight: 1.6, background: i%2?'#fafafa':'#fff', display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ color: '#ddd', flexShrink: 0 }}>✗</span>{prob}
              </div>
              <div key={`s${i}`} style={{ padding: '17px 22px', borderBottom: i<4?'1px solid #FFD9C4':'none', fontSize: 13, color: '#0a0a0a', fontWeight: 600, lineHeight: 1.6, background: i%2?'#FFF8F4':'#FFF4EE', borderLeft: '1px solid #FFD9C4', display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ color: '#E8520A', flexShrink: 0 }}>✓</span>{sol}
              </div>
            </>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, letterSpacing: '-1.5px' }}>Built for people like you.</h2>
          </div>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              { quote: "The permit alert alone saved me from a $12,000 stop-work order. I had no idea it was about to expire.", name: "Marcus T.", role: "Electrical Contractor, Las Vegas" },
              { quote: "I used to text change orders. Now owners sign off digitally and I have a paper trail on every single job.", name: "John R.", role: "Plumbing Contractor, Phoenix" },
              { quote: "My labor costs dropped 18% in the first 3 months because I could finally see what each job actually cost.", name: "David K.", role: "General Contractor, Henderson NV" },
            ].map(t => (
              <div key={t.name} className="testimonial">
                <div style={{ fontSize: 32, color: '#E8520A', marginBottom: 14, lineHeight: 1, fontFamily: 'Georgia, serif' }}>"</div>
                <p style={{ fontSize: 14, color: '#333', lineHeight: 1.7, marginBottom: 20 }}>{t.quote}</p>
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
          <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 10, lineHeight: 1.1 }}>Simple, honest pricing.</h2>
          <p style={{ fontSize: 15, color: '#999' }}>One missed permit costs more than a year of ConstructIQ.</p>
        </div>
        <div className="price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { name: 'Starter', price: 49, desc: 'For contractors just getting started', features: ['1 project','20 AI reads/month','Permit tracking & alerts','Daily log & safety checks','Basic job board'], cta: 'Start free', featured: false },
            { name: 'Pro', price: 99, desc: 'For active contractors running multiple jobs', features: ['5 projects','Unlimited AI reads','Everything in Starter','Crew time & job costing','Owner approval links','Invoice builder','SMS permit alerts'], cta: 'Start free', featured: true },
            { name: 'Company', price: 249, desc: 'For companies with crews and volume', features: ['Unlimited projects','5 team seats','Everything in Pro','Sub portal access','Custom reports','Priority support'], cta: 'Contact us', featured: false },
          ].map(plan => (
            <div key={plan.name} className={`price-card${plan.featured?' featured':''}`}>
              {plan.featured && <div style={{ background: '#E8520A', color: 'white', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 100, display: 'inline-block', marginBottom: 16, letterSpacing: '0.5px' }}>MOST POPULAR</div>}
              <div style={{ fontSize: 12, fontWeight: 700, color: '#999', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-2px', color: '#0a0a0a' }}>${plan.price}</span>
                <span style={{ fontSize: 14, color: '#999' }}>/mo</span>
              </div>
              <p style={{ fontSize: 13, color: '#999', marginBottom: 22, lineHeight: 1.5 }}>{plan.desc}</p>
              <Link href="/auth/signup" className={plan.featured ? 'btn-primary' : 'btn-ghost'} style={{ display: 'flex', justifyContent: 'center', marginBottom: 22, width: '100%' }}>{plan.cta}</Link>
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
        <div style={{ background: '#0a0a0a', borderRadius: 28, padding: 'clamp(48px, 6vw, 80px) 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(232,82,10,0.12)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(232,82,10,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(30px,5vw,60px)', fontWeight: 900, letterSpacing: '-2px', color: 'white', marginBottom: 16, lineHeight: 1.05 }}>
              Stop running your<br />business from a notes app.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 40, maxWidth: 400, margin: '0 auto 40px', lineHeight: 1.6 }}>
              ConstructIQ is built for the job site. On your phone. Under pressure.
            </p>
            <div className="cta-row" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth/signup" className="btn-primary" style={{ boxShadow: '0 0 60px rgba(232,82,10,0.3)' }}>
                Start free today
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link href="/auth/login" className="btn-ghost" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>Sign in →</Link>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 20 }}>14 days free · No credit card · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }} className="footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, background: '#E8520A', borderRadius: 5 }} />
            <span style={{ fontSize: 13, color: '#bbb' }}>ConstructIQ © 2025</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#bbb', flexWrap: 'wrap' }}>
            {[['Sign in','/auth/login'],['Get started','/auth/signup']].map(([l,h]) => (
              <Link key={l} href={h} style={{ color: 'inherit', textDecoration: 'none' }}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
