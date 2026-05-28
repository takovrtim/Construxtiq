import { createAdminSupabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays } from 'date-fns'
import { notFound } from 'next/navigation'

export default async function ClientStatusPage({ params }: { params: { token: string } }) {
  const admin = createAdminSupabase()

  const { data: project } = await admin
    .from('projects')
    .select('*')
    .eq('share_token', params.token)
    .single()

  if (!project) notFound()

  const [{ data: jobs }, { data: permits }] = await Promise.all([
    admin.from('jobs').select('*').eq('project_id', project.id).order('created_at'),
    admin.from('permits').select('*').eq('project_id', project.id).order('expiry_date'),
  ])

  const today = new Date()
  const activeJobs = (jobs || []).filter(j => j.status !== 'completed')
  const completedJobs = (jobs || []).filter(j => j.status === 'completed')
  const activePermits = (permits || []).filter(p => p.status === 'active')
  const urgentPermits = (permits || []).filter(p => {
    if (!p.expiry_date) return false
    const days = differenceInDays(parseISO(p.expiry_date), today)
    return days >= 0 && days <= 30
  })

  const STATUS_LABELS: Record<string, string> = {
    pending_permit: 'Waiting on Permit',
    permit_approved: 'Permit Approved',
    in_progress: 'In Progress',
    inspection: 'Needs Inspection',
    completed: 'Completed',
  }

  const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    pending_permit: { bg: '#fdf4e3', text: '#6b4010', dot: '#EF9F27' },
    permit_approved: { bg: '#edf5f0', text: '#1a4d31', dot: '#639922' },
    in_progress: { bg: '#eef3fb', text: '#0C447C', dot: '#378ADD' },
    inspection: { bg: '#EEEDFE', text: '#3B37A0', dot: '#7F77DD' },
    completed: { bg: '#f1ede6', text: '#6b6a66', dot: '#9e9d99' },
  }

  // Overall progress
  const totalJobs = (jobs || []).length
  const pctComplete = totalJobs > 0 ? Math.round((completedJobs.length / totalJobs) * 100) : 0

  return (
    <html lang="en">
      <head>
        <title>{project.name} — Project Status</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'DM Sans', sans-serif; background: #f8f7f4; color: #0f0f0f; -webkit-font-smoothing: antialiased; }
          .container { max-width: 680px; margin: 0 auto; padding: 24px 16px 48px; }
        `}</style>
      </head>
      <body>
        <div className="container">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 28, height: 28, background: '#d95f2b', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/>
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#6b6a66' }}>ConstructIQ</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9e9d99' }}>Updated {format(today, 'MMM d, h:mm a')}</span>
          </div>

          {/* Project banner */}
          <div style={{ background: '#131A26', borderRadius: 16, padding: 24, marginBottom: 16, color: 'white' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Project Status</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 4 }}>{project.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>{[project.city, project.state].filter(Boolean).join(', ')}</div>

            {/* Progress bar */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Overall Progress</span>
                <span style={{ fontWeight: 700, color: '#d95f2b' }}>{pctComplete}%</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pctComplete}%`, background: '#d95f2b', borderRadius: 4, transition: 'width 1s ease' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 16 }}>
              {[
                { label: 'Active Jobs', value: activeJobs.length },
                { label: 'Completed', value: completedJobs.length },
                { label: 'Permits', value: activePermits.length },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Permit alert */}
          {urgentPermits.length > 0 && (
            <div style={{ background: '#fdf4e3', border: '1px solid #f0c080', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6b4010', marginBottom: 8 }}>⚠️ Permit Attention Needed</div>
              {urgentPermits.map(p => {
                const days = differenceInDays(parseISO(p.expiry_date), today)
                return (
                  <div key={p.id} style={{ fontSize: 13, color: '#6b4010', marginBottom: 4 }}>
                    Permit {p.permit_number} — {days === 0 ? 'expires today' : `expires in ${days} day${days !== 1 ? 's' : ''}`}
                  </div>
                )
              })}
            </div>
          )}

          {/* Jobs */}
          <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 20, marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🔧 Job Status</div>
            {(jobs || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#9e9d99', fontSize: 13 }}>No jobs added yet</div>
            ) : (
              (jobs || []).map(job => {
                const cfg = STATUS_COLORS[job.status] || STATUS_COLORS.in_progress
                return (
                  <div key={job.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dot, flexShrink: 0, marginTop: 4 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{job.title}</div>
                      {job.address && <div style={{ fontSize: 12, color: '#9e9d99', marginBottom: 4 }}>📍 {job.address}</div>}
                      {job.description && <div style={{ fontSize: 12, color: '#6b6a66', lineHeight: 1.5 }}>{job.description}</div>}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.text, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {STATUS_LABELS[job.status] || job.status}
                    </span>
                  </div>
                )
              })
            )}
          </div>

          {/* Permits */}
          {(permits || []).length > 0 && (
            <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 20, marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📋 Permits</div>
              {(permits || []).map(p => {
                const days = p.expiry_date ? differenceInDays(parseISO(p.expiry_date), today) : null
                const isUrgent = days !== null && days <= 14
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.status === 'active' ? '#2d7a4f' : isUrgent ? '#b83232' : '#9e9d99', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{p.permit_number}</div>
                      <div style={{ fontSize: 12, color: '#9e9d99' }}>{p.permit_type}</div>
                    </div>
                    {p.expiry_date && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: isUrgent ? '#b83232' : '#6b6a66', fontWeight: isUrgent ? 700 : 400 }}>
                          {format(parseISO(p.expiry_date), 'MMM d, yyyy')}
                        </div>
                        {days !== null && days >= 0 && days <= 30 && (
                          <div style={{ fontSize: 10, color: isUrgent ? '#b83232' : '#b06e1a', fontWeight: 600 }}>{days}d left</div>
                        )}
                        {days !== null && days < 0 && (
                          <div style={{ fontSize: 10, color: '#b83232', fontWeight: 700 }}>EXPIRED</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: 12, color: '#9e9d99', paddingTop: 16 }}>
            Powered by <strong style={{ color: '#d95f2b' }}>ConstructIQ</strong> · This page is shared by your contractor and updates automatically
          </div>
        </div>
      </body>
    </html>
  )
}
