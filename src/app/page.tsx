import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import Link from 'next/link'
import { DashboardDemo } from '@/components/DashboardDemo'

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
        .step-num { width: 36px; height: 36px; background: #E8520A; border-radius: 10px; display: flex; align-items: center; justifyContent: center; font-size: 14px; font-weight: 800; color: white; flex-shrink: 0; }
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
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, background: '#E8520A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/>
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/>
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', color: '#0a0a0a' }}>
              ConstructIQ
            </span>
          </Link>

          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#pricing" className="nav-link">Pricing</a>
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

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px 56px' }}>
        <div style={{ textAlign: 'center', maxWidth: 880, margin: '0 auto' }}>
          <div className="tag" style={{ marginBottom: 28 }}>
            ⚡ Built for electrical & plumbing contractors
          </div>

          <h1
            className="hero-title"
            style={{
              fontSize: 'clamp(44px, 7.5vw, 92px)',
              fontWeight: 900,
              letterSpacing: '-3px',
              lineHeight: 0.96,
              marginBottom: 28,
              color: '#0a0a0a'
            }}
          >
            Run your jobs.<br />
            <span style={{ color: '#E8520A' }}>Not your paperwork.</span>
          </h1>

          <p
            style={{
              fontSize: 18,
              color: '#666',
              lineHeight: 1.7,
              maxWidth: 500,
              margin: '0 auto 40px',
              fontWeight: 400
            }}
          >
            ConstructIQ is the operating system for contractors. Permits, crew,
            change orders, invoices — one place.
          </p>

          <div
            className="cta-row"
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              marginBottom: 18,
              flexWrap: 'wrap'
            }}
          >
            <Link href="/auth/signup" className="btn-primary">
              Start free — 14 days
            </Link>

            <a href="#how-it-works" className="btn-ghost">
              See how it works
            </a>
          </div>

          <p style={{ fontSize: 12, color: '#bbb' }}>
            No credit card · 2 minute setup · Cancel anytime
          </p>
        </div>

        {/* ANIMATED DEMO */}
        <div style={{ marginTop: 64 }}>
          <DashboardDemo />
        </div>
      </section>

      {/* STATS */}
      {/* ...rest of your page stays exactly the same... */}
    </div>
  )
}