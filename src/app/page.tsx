import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase'

const features = [
  {
    title: 'Job tracking',
    text: 'Keep every project, status, note, and deadline in one clean dashboard.',
  },
  {
    title: 'Permits & documents',
    text: 'Store permits, photos, change orders, and files without the paper mess.',
  },
  {
    title: 'Crew coordination',
    text: 'See who is on site, what is next, and what still needs approval.',
  },
  {
    title: 'Invoices & payments',
    text: 'Send invoices faster and reduce the time between work done and cash collected.',
  },
]

const steps = [
  {
    num: '01',
    title: 'Create the job',
    text: 'Add the customer, scope, and schedule in seconds.',
  },
  {
    num: '02',
    title: 'Assign the crew',
    text: 'Put the right people on the right project without back-and-forth.',
  },
  {
    num: '03',
    title: 'Track everything',
    text: 'Log progress, notes, photos, and approvals as the work moves.',
  },
]

const pricing = [
  {
    name: 'Starter',
    price: '$49',
    note: 'For solo contractors',
    items: ['1 user', 'Job tracking', 'Invoices', 'Basic support'],
    featured: false,
  },
  {
    name: 'Pro',
    price: '$99',
    note: 'For growing crews',
    items: ['Up to 10 users', 'Permits', 'Crew management', 'Priority support'],
    featured: true,
  },
  {
    name: 'Scale',
    price: 'Custom',
    note: 'For larger teams',
    items: ['Unlimited users', 'Advanced workflow', 'Custom onboarding', 'Dedicated support'],
    featured: false,
  },
]

const testimonials = [
  {
    quote:
      'We went from scattered notes and texts to one place for everything. It saved us time the first week.',
    name: 'Mike R.',
    role: 'Electrical contractor',
  },
  {
    quote:
      'The team finally knows what is happening on each job without calling me every hour.',
    name: 'Jordan S.',
    role: 'Plumbing company owner',
  },
]

function DashboardDemo() {
  const metrics = [
    { label: 'Open jobs', value: '18' },
    { label: 'Invoices sent', value: '132' },
    { label: 'Active crew', value: '24' },
  ]

  const timeline = [
    { title: 'Permit approved', time: 'Today · 8:15 AM' },
    { title: 'Crew assigned', time: 'Today · 9:30 AM' },
    { title: 'Invoice pending', time: 'Today · 11:10 AM' },
  ]

  return (
    <div className="dashboard-shell">
      <div className="dashboard-top">
        <div>
          <div className="dashboard-kicker">Live demo</div>
          <h2 className="dashboard-title">Everything in one place</h2>
          <p className="dashboard-subtitle">
            A clean view of jobs, crew, and cash flow.
          </p>
        </div>
        <div className="dashboard-badge">+12 active today</div>
      </div>

      <div className="dashboard-metrics">
        {metrics.map((item) => (
          <div className="metric-card" key={item.label}>
            <span className="metric-label">{item.label}</span>
            <span className="metric-value">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="panel panel-large">
          <div className="panel-header">
            <span>Project progress</span>
            <span className="panel-accent">82%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" />
          </div>

          <div className="mini-cards">
            <div className="mini-card">
              <span>Permits</span>
              <strong>3 waiting</strong>
            </div>
            <div className="mini-card">
              <span>Change orders</span>
              <strong>5 approved</strong>
            </div>
            <div className="mini-card">
              <span>Payments</span>
              <strong>91% collected</strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span>Today</span>
          </div>
          <div className="timeline">
            {timeline.map((item) => (
              <div className="timeline-item" key={item.title}>
                <div className="timeline-dot" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function HomePage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
        body { margin: 0; }

        .page {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #fff;
          color: #0a0a0a;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .nav-link {
          font-size: 14px;
          color: #666;
          text-decoration: none;
          transition: color 0.15s;
        }
        .nav-link:hover { color: #0a0a0a; }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FFF4EE;
          border: 1px solid #FFD9C4;
          border-radius: 100px;
          padding: 5px 14px;
          font-size: 12px;
          font-weight: 700;
          color: #E8520A;
          letter-spacing: 0.3px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #E8520A;
          color: #fff;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.3px;
          transition: all 0.15s;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }
        .btn-primary:hover {
          background: #c94408;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(232,82,10,0.3);
        }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: #0a0a0a;
          text-decoration: none;
          padding: 13px 22px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          border: 1.5px solid #e5e5e5;
          transition: all 0.15s;
          cursor: pointer;
          font-family: inherit;
        }
        .btn-ghost:hover { border-color: #0a0a0a; }

        .feature-card {
          background: #fff;
          border: 1.5px solid #f0f0f0;
          border-radius: 20px;
          padding: 28px;
          transition: all 0.2s;
        }
        .feature-card:hover {
          border-color: #FFD9C4;
          box-shadow: 0 8px 32px rgba(232,82,10,0.06);
          transform: translateY(-2px);
        }

        .price-card {
          border: 1.5px solid #f0f0f0;
          border-radius: 24px;
          padding: 32px;
          transition: all 0.2s;
          background: #fff;
        }
        .price-card.featured {
          border-color: #E8520A;
          background: #fff8f5;
          box-shadow: 0 0 0 4px #FFF4EE;
        }
        .price-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.08); }

        .testimonial {
          background: #fafafa;
          border: 1.5px solid #f0f0f0;
          border-radius: 20px;
          padding: 28px;
        }

        .step-num {
          width: 36px;
          height: 36px;
          background: #E8520A;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          color: white;
          flex-shrink: 0;
        }

        .hero-title {
          font-size: clamp(44px, 7.5vw, 92px);
          font-weight: 900;
          letter-spacing: -3px;
          line-height: 0.96;
          margin-bottom: 28px;
          color: #0a0a0a;
        }

        .dashboard-shell {
          background: linear-gradient(180deg, #121212 0%, #0b0b0b 100%);
          border: 1px solid #222;
          border-radius: 28px;
          padding: 28px;
          color: #fff;
          box-shadow: 0 28px 70px rgba(0,0,0,0.14);
          overflow: hidden;
          position: relative;
        }

        .dashboard-shell::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, rgba(232,82,10,0.16), transparent 38%);
          pointer-events: none;
        }

        .dashboard-top,
        .dashboard-grid {
          position: relative;
          z-index: 1;
        }

        .dashboard-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .dashboard-kicker {
          color: #E8520A;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          margin-bottom: 8px;
        }

        .dashboard-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .dashboard-subtitle {
          color: #aaa;
          margin-top: 8px;
          line-height: 1.6;
        }

        .dashboard-badge {
          background: #E8520A;
          color: #fff;
          padding: 10px 16px;
          border-radius: 999px;
          font-weight: 700;
          white-space: nowrap;
        }

        .dashboard-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .metric-card,
        .panel,
        .mini-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
        }

        .metric-card {
          padding: 18px;
        }

        .metric-label {
          display: block;
          color: #aaa;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.05em;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.3fr 0.8fr;
          gap: 14px;
        }

        .panel {
          padding: 20px;
        }

        .panel-large {
          min-height: 220px;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          color: #ddd;
          font-weight: 600;
        }

        .panel-accent {
          color: #E8520A;
        }

        .progress-track {
          width: 100%;
          height: 12px;
          background: rgba(255,255,255,0.08);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 18px;
        }

        .progress-fill {
          width: 82%;
          height: 100%;
          background: linear-gradient(90deg, #E8520A, #ff8c4a);
          border-radius: 999px;
          animation: fillPulse 2.8s ease-in-out infinite alternate;
        }

        .mini-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .mini-card {
          padding: 14px;
        }

        .mini-card span {
          display: block;
          color: #aaa;
          font-size: 12px;
          margin-bottom: 8px;
        }

        .mini-card strong {
          font-size: 16px;
        }

        .timeline {
          display: grid;
          gap: 14px;
        }

        .timeline-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .timeline-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-top: 6px;
          background: #E8520A;
          box-shadow: 0 0 0 5px rgba(232,82,10,0.15);
          flex-shrink: 0;
        }

        .timeline-item strong {
          display: block;
          margin-bottom: 4px;
        }

        .timeline-item p {
          color: #aaa;
          font-size: 13px;
        }

        @keyframes fillPulse {
          from { width: 68%; }
          to { width: 82%; }
        }

        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr; }
        }

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
          .dashboard-top { flex-direction: column; }
          .dashboard-metrics { grid-template-columns: 1fr; }
          .mini-cards { grid-template-columns: 1fr; }
        }
      `}</style>

      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 24px',
            height: 62,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: '#E8520A',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7" />
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5" />
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3" />
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', color: '#0a0a0a' }}>
              ConstructIQ
            </span>
          </Link>

          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#how-it-works" className="nav-link">
              How it works
            </a>
            <a href="#pricing" className="nav-link">
              Pricing
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/auth/login" className="nav-link hide-mobile" style={{ padding: '8px 14px' }}>
              Sign in
            </Link>

            <Link href="/auth/signup" className="btn-primary" style={{ padding: '9px 20px', fontSize: 14 }}>
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px 56px' }}>
        <div style={{ textAlign: 'center', maxWidth: 880, margin: '0 auto' }}>
          <div className="tag" style={{ marginBottom: 28 }}>
            ⚡ Built for electrical & plumbing contractors
          </div>

          <h1 className="hero-title">
            Run your jobs.
            <br />
            <span style={{ color: '#E8520A' }}>Not your paperwork.</span>
          </h1>

          <p
            style={{
              fontSize: 18,
              color: '#666',
              lineHeight: 1.7,
              maxWidth: 500,
              margin: '0 auto 40px',
              fontWeight: 400,
            }}
          >
            ConstructIQ is the operating system for contractors. Permits, crew, change orders, invoices — one place.
          </p>

          <div
            className="cta-row"
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              marginBottom: 18,
              flexWrap: 'wrap',
            }}
          >
            <Link href="/auth/signup" className="btn-primary">
              Start free — 14 days
            </Link>

            <a href="#how-it-works" className="btn-ghost">
              See how it works
            </a>
          </div>

          <p style={{ fontSize: 12, color: '#bbb' }}>No credit card · 2 minute setup · Cancel anytime</p>
        </div>

        <div style={{ marginTop: 64 }}>
          <DashboardDemo />
        </div>
      </section>

      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 88px' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div className="tag" style={{ marginBottom: 16 }}>
            Features
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 54px)', letterSpacing: '-2px', marginBottom: 10 }}>
            Built for the real work
          </h2>
          <p style={{ color: '#666', maxWidth: 620, margin: '0 auto', lineHeight: 1.7 }}>
            Built to keep the office, field, and customers moving without slowing down the job.
          </p>
        </div>

        <div
          className="features-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          {features.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <h3 style={{ fontSize: 20, marginBottom: 10 }}>{feature.title}</h3>
              <p style={{ color: '#666', lineHeight: 1.65 }}>{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" style={{ background: '#fafafa', padding: '88px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="tag" style={{ marginBottom: 16 }}>
              How it works
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 54px)', letterSpacing: '-2px', marginBottom: 10 }}>
              Simple workflow, less noise
            </h2>
          </div>

          <div
            className="steps-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}
          >
            {steps.map((step) => (
              <div key={step.num} className="feature-card" style={{ background: '#fff' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div className="step-num">{step.num}</div>
                  <div>
                    <h3 style={{ fontSize: 20, marginBottom: 8 }}>{step.title}</h3>
                    <p style={{ color: '#666', lineHeight: 1.65 }}>{step.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="tag" style={{ marginBottom: 16 }}>
            Pricing
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 54px)', letterSpacing: '-2px', marginBottom: 10 }}>
            Straightforward pricing
          </h2>
          <p style={{ color: '#666', maxWidth: 620, margin: '0 auto', lineHeight: 1.7 }}>
            Pick the plan that fits your crew and upgrade as you grow.
          </p>
        </div>

        <div
          className="price-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {pricing.map((plan) => (
            <div key={plan.name} className={`price-card ${plan.featured ? 'featured' : ''}`}>
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 22, marginBottom: 8 }}>{plan.name}</h3>
                <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.05em' }}>{plan.price}</div>
                <p style={{ color: '#666', marginTop: 6 }}>{plan.note}</p>
              </div>

              <div style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
                {plan.items.map((item) => (
                  <div key={item} style={{ color: '#333' }}>
                    • {item}
                  </div>
                ))}
              </div>

              <Link
                href="/auth/signup"
                className={plan.featured ? 'btn-primary' : 'btn-ghost'}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: '#fafafa', padding: '88px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="tag" style={{ marginBottom: 16 }}>
              Testimonials
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 54px)', letterSpacing: '-2px', marginBottom: 10 }}>
              Trusted by contractors
            </h2>
          </div>

          <div
            className="testi-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
            }}
          >
            {testimonials.map((item) => (
              <div key={item.name} className="testimonial">
                <p style={{ fontSize: 18, lineHeight: 1.75, color: '#222', marginBottom: 18 }}>
                  “{item.quote}”
                </p>
                <div>
                  <strong style={{ display: 'block', marginBottom: 4 }}>{item.name}</strong>
                  <span style={{ color: '#666' }}>{item.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 24px' }}>
        <div
          style={{
            borderRadius: 28,
            padding: '44px 28px',
            background: 'linear-gradient(135deg, #E8520A, #ff7b35)',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: 'clamp(30px, 5vw, 56px)', letterSpacing: '-2px', marginBottom: 12 }}>
            Ready to run cleaner jobs?
          </h2>
          <p style={{ maxWidth: 620, margin: '0 auto 24px', lineHeight: 1.7, color: 'rgba(255,255,255,0.9)' }}>
            Get set up fast and bring your permits, crew, and invoices into one workflow.
          </p>
          <Link href="/auth/signup" className="btn-primary" style={{ background: '#fff', color: '#E8520A' }}>
            Start free today
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #f0f0f0' }}>
        <div
          className="footer-inner"
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            color: '#777',
            fontSize: 14,
          }}
        >
          <span>© 2026 ConstructIQ</span>
          <div style={{ display: 'flex', gap: 18 }}>
            <a className="nav-link" href="#features">
              Features
            </a>
            <a className="nav-link" href="#pricing">
              Pricing
            </a>
            <a className="nav-link" href="/auth/login">
              Login
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}