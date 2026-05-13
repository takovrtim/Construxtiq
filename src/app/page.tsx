import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", background: '#fff', color: '#111827' }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f3f4f6', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#ea580c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px' }}>SubIQ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/auth/login" style={{ fontSize: 14, fontWeight: 500, color: '#6b7280', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ fontSize: 14, fontWeight: 700, color: 'white', background: '#ea580c', padding: '8px 18px', borderRadius: 9, textDecoration: 'none' }}>Start Free Trial</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 20, padding: '6px 14px', marginBottom: 24 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ea580c' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#ea580c' }}>Built for electrical and plumbing subcontractors</span>
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 20 }}>
          The GC changed the scope.<br />
          <span style={{ color: '#ea580c' }}>Now you have proof.</span>
        </h1>
        <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#6b7280', maxWidth: 600, margin: '0 auto 36px', lineHeight: 1.6 }}>
          SubIQ builds your legal case file automatically. Every day you use it, you are one step closer to winning the dispute.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <Link href="/auth/signup" style={{ fontSize: 16, fontWeight: 800, color: 'white', background: '#ea580c', padding: '14px 32px', borderRadius: 12, textDecoration: 'none' }}>Start 14-Day Free Trial</Link>
          <Link href="/auth/login" style={{ fontSize: 16, fontWeight: 600, color: '#374151', background: '#f9fafb', border: '1px solid #e5e7eb', padding: '14px 24px', borderRadius: 12, textDecoration: 'none' }}>Sign in</Link>
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>No credit card required. Takes 2 minutes.</div>
      </section>

      {/* STATS */}
      <div style={{ background: '#f9fafb', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', padding: '20px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(24px, 5vw, 64px)', flexWrap: 'wrap' }}>
          {[
            { stat: '$2M+', label: 'Avg annual revenue protected' },
            { stat: '14 days', label: 'Free trial, no card' },
            { stat: '5 min', label: 'To set up your first project' },
            { stat: '100%', label: 'Built for subs, not GCs' },
          ].map(s => (
            <div key={s.stat} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>{s.stat}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PROBLEMS */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 8 }}>Sound familiar?</h2>
          <p style={{ fontSize: 15, color: '#6b7280' }}>These are the four things that cost electrical subs the most money every year.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[
            { icon: 'ðŸ“ž', title: 'Scope changes with no paper trail', body: 'Turner calls and changes the spec. No email. No approval. When you bill for it at the end, they say it was never authorized.' },
            { icon: 'â³', title: 'GC delays nobody tracks', body: 'Inspector is late. Material delivery pushed by GC. Three days lost. Nothing documented. You eat the schedule impact.' },
            { icon: 'ðŸ’°', title: 'Retention held past completion', body: 'Punch list done. Job complete. GC still holding 10% with no release date. You have no leverage and no paper trail.' },
            { icon: 'ðŸ“‹', title: 'Permit expires without warning', body: 'Stop-work order. Crew standing around. $500 fine. All because nobody tracked the expiry date on a Clark County permit.' },
          ].map(p => (
            <div key={p.title} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{p.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 8, lineHeight: 1.3 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{p.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: '#000', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>The solution</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 16 }}>Your legal case file. Built automatically.</h2>
            <p style={{ fontSize: 15, color: '#9ca3af', maxWidth: 480, margin: '0 auto' }}>Every feature builds your case or protects your cash. Nothing else.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {[
              { icon: 'ðŸ“', tag: 'Legal protection', title: 'Change Orders with GC Approval', body: 'Log every scope change. Send Turner a link â€” they tap Approve or Reject. Timestamped, legally binding. No more verbal approvals.' },
              { icon: 'â±ï¸', tag: 'Dispute weapon', title: 'Delay Tracker', body: 'Log every delay with cause and days lost. One click generates a PDF report with GC-caused days highlighted in red.' },
              { icon: 'ðŸ¤–', tag: 'Beats competitors', title: 'AI Document Intelligence', body: 'Upload your Clark County permit. AI reads it, extracts the expiry date, special conditions, inspector contact, and sets automatic alerts.' },
              { icon: 'ðŸ“‹', tag: 'Legal protection', title: 'RFI Tracker', body: 'Every unanswered question is documented delay. Log RFIs, set deadlines, track responses. When Turner ignores you, that is on record.' },
              { icon: 'ðŸ’µ', tag: 'Cash protection', title: 'Retention Tracker', body: 'See exactly what every GC owes you. Track release dates, completion percentages, and what has been signed away with lien waivers.' },
              { icon: 'âš–ï¸', tag: 'The closer', title: 'One-Click Audit Export', body: 'Generate a complete legal case file â€” every delay, RFI, change order, daily log, and safety record. Walk into a dispute ready.' },
            ].map(f => (
              <div key={f.title} style={{ background: '#111', border: '1px solid #1f2937', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 28 }}>{f.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#ea580c', background: 'rgba(234,88,12,0.1)', padding: '3px 10px', borderRadius: 20 }}>{f.tag}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 8 }}>Set up in 5 minutes</h2>
          <p style={{ fontSize: 15, color: '#6b7280' }}>Then use it every day. It gets more valuable the longer you use it.</p>
        </div>
        {[
          { num: '01', title: 'Create your account', body: 'Sign up free. Tell us your trade, your GC name, and your biggest pain. Takes 2 minutes. No credit card.' },
          { num: '02', title: 'Add your active job', body: 'Name the project, add the address and contract value. Your dashboard and case file activate immediately.' },
          { num: '03', title: 'Upload your first document', body: 'Drop in a permit, blueprint, or contract. AI reads it and extracts dates, conditions, risks, and action items.' },
          { num: '04', title: 'Log daily, build your case', body: 'Daily log takes 60 seconds. Change orders send to Turner with one button. Every day your legal protection grows.' },
        ].map((step, i) => (
          <div key={step.num} style={{ display: 'flex', gap: 24, padding: '28px 0', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#ea580c' }}>{step.num}</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{step.body}</div>
            </div>
          </div>
        ))}
      </section>

      {/* COMPETITION TABLE */}
      <section style={{ background: '#f9fafb', padding: '80px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 900, letterSpacing: '-0.8px', marginBottom: 8 }}>Why not Procore or eSUB?</h2>
            <p style={{ fontSize: 15, color: '#6b7280' }}>They are built for GCs looking down. We are built for subs looking up.</p>
          </div>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
              {['Feature', 'SubIQ', 'Procore', 'eSUB'].map((h, j) => (
                <div key={j} style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: j === 0 ? 'left' : 'center', background: j === 1 ? '#000' : '#f9fafb', color: j === 1 ? '#ea580c' : '#9ca3af', borderBottom: '2px solid #e5e7eb' }}>
                  {j === 1 ? 'â˜… ' : ''}{h}
                </div>
              ))}
            </div>
            {/* Rows */}
            {[
              ['Built for subcontractors', true, false, true],
              ['AI document parsing', true, false, false],
              ['GC approval portal', true, false, false],
              ['Audit export / case file', true, false, false],
              ['GC reputation score', true, false, false],
              ['Permit expiry alerts', true, false, false],
              ['Blueprint reader', true, false, false],
              ['Price per month', '$149', '$833+', '$249'],
            ].map((row, i) => {
              const isLast = i === 7
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: i < 7 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ padding: '13px 16px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{row[0] as string}</div>
                  {[1, 2, 3].map(j => {
                    const val = row[j]
                    const isCIQ = j === 1
                    const isYes = val === true
                    const isNo  = val === false
                    return (
                      <div key={j} style={{ padding: '13px 16px', textAlign: 'center', background: isCIQ ? '#fff7ed' : 'white' }}>
                        {isYes ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: isCIQ ? '#22c55e' : '#dcfce7' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={isCIQ ? 'white' : '#16a34a'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        ) : isNo ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: '#f3f4f6' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round"/></svg>
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: isCIQ ? 800 : 500, color: isCIQ ? '#ea580c' : j === 2 ? '#ef4444' : '#6b7280' }}>{val as string}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#9ca3af' }}>Procore pricing based on publicly available estimates. eSUB pricing based on published rates.</div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 8 }}>Simple pricing</h2>
          <p style={{ fontSize: 15, color: '#6b7280' }}>One dispute won pays for years of SubIQ.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, maxWidth: 640, margin: '0 auto' }}>
          {[
            { name: 'Starter', price: '$149', desc: 'Solo operators and small crews', features: ['1 active project', 'All core features', 'AI document scanning', 'Audit export', 'Email support'], highlight: false },
            { name: 'Pro', price: '$299', desc: 'Growing subs with multiple jobs', features: ['Unlimited projects', 'Everything in Starter', 'GC reputation scores', 'Priority support', '3 team seats'], highlight: true },
          ].map(plan => (
            <div key={plan.name} style={{ background: plan.highlight ? '#000' : 'white', border: `2px solid ${plan.highlight ? '#ea580c' : '#e5e7eb'}`, borderRadius: 20, padding: 28, position: 'relative' }}>
              {plan.highlight && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#ea580c', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>Most Popular</div>}
              <div style={{ fontSize: 13, fontWeight: 700, color: plan.highlight ? '#ea580c' : '#9ca3af', marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: plan.highlight ? '#fff' : '#111827', letterSpacing: '-2px', marginBottom: 4 }}>{plan.price}<span style={{ fontSize: 14, fontWeight: 400, color: '#9ca3af', letterSpacing: 0 }}>/mo</span></div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>{plan.desc}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: plan.highlight ? '#d1d5db' : '#374151' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700 }}>âœ“</span>{f}
                  </div>
                ))}
              </div>
              <Link href="/auth/signup" style={{ display: 'block', textAlign: 'center', padding: '12px', fontSize: 14, fontWeight: 700, borderRadius: 10, textDecoration: 'none', background: plan.highlight ? '#ea580c' : '#111827', color: 'white' }}>
                Start free trial â†’
              </Link>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#9ca3af' }}>14-day free trial Â· No credit card required Â· Cancel anytime</div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: '#000', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', marginBottom: 16, lineHeight: 1.1 }}>
            Stop losing disputes.<br /><span style={{ color: '#ea580c' }}>Start building your case.</span>
          </h2>
          <p style={{ fontSize: 15, color: '#9ca3af', marginBottom: 32, lineHeight: 1.6 }}>Every day you work without SubIQ is a day the GC has the advantage. Start your free trial today.</p>
          <Link href="/auth/signup" style={{ display: 'inline-block', fontSize: 16, fontWeight: 800, color: 'white', background: '#ea580c', padding: '16px 40px', borderRadius: 14, textDecoration: 'none' }}>
            Start Free Trial â€” No Card Needed â†’
          </Link>
          <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>Takes 2 minutes Â· 14-day trial Â· Cancel anytime</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#000', borderTop: '1px solid #111827', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 24, height: 24, background: '#ea580c', borderRadius: 6 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>SubIQ</span>
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Built for contractors. Not against them.</div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          <Link href="/auth/login" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </footer>

    </div>
  )
}
