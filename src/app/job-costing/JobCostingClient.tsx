'use client'

import { useState } from 'react'

interface Props {
  user: any
  project: any
  jobs: any[]
  materials: any[]
  crewTime: any[]
  changes: any[]
  invoices: any[]
}

export function JobCostingClient({ user, project, jobs, materials, crewTime, changes, invoices }: Props) {
  const [selectedJob, setSelectedJob] = useState<string | null>(null)

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13 }}>Create a project first →</a>
    </div>
  )

  // Calculate costs per job
  const jobCosts = jobs.map(job => {
    const jobMaterials = materials.filter(m => m.job_id === job.id)
    const jobCrew = crewTime.filter(c => c.job_id === job.id)
    const jobChanges = changes.filter(c => c.job_id === job.id)
    const jobInvoices = invoices.filter(i => i.job_id === job.id)

    const materialCost = jobMaterials.reduce((s: number, m: any) => s + (m.total_cost || 0), 0)
    const laborCost = jobCrew.reduce((s: number, c: any) => s + (c.total_pay || 0), 0)
    const changeCost = jobChanges.reduce((s: number, c: any) => s + Number(c.cost_impact || 0), 0)
    const totalCost = materialCost + laborCost
    const invoiced = jobInvoices.reduce((s: number, i: any) => s + Number(i.total || 0), 0)
    const paidInvoices = jobInvoices.filter((i: any) => i.status === 'paid')
    const collected = paidInvoices.reduce((s: number, i: any) => s + Number(i.total || 0), 0)
    const profit = invoiced - totalCost
    const margin = invoiced > 0 ? Math.round((profit / invoiced) * 100) : 0

    return { job, materialCost, laborCost, changeCost, totalCost, invoiced, collected, profit, margin }
  })

  const totalRevenue = jobCosts.reduce((s, j) => s + j.invoiced, 0)
  const totalCosts = jobCosts.reduce((s, j) => s + j.totalCost, 0)
  const totalProfit = totalRevenue - totalCosts
  const totalMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0
  const totalCollected = jobCosts.reduce((s, j) => s + j.collected, 0)

  const selected = selectedJob ? jobCosts.find(j => j.job.id === selectedJob) : null

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Job Costing</div>
        <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Real-time profit & loss per job — know exactly where you stand</div>
      </div>

      {/* Project totals */}
      <div style={{ background: '#0f0f0f', borderRadius: 16, padding: 24, marginBottom: 20, color: 'white' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Project Overview</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {[
            { label: 'Total Invoiced', value: `$${totalRevenue.toLocaleString()}`, color: 'white' },
            { label: 'Total Costs', value: `$${totalCosts.toLocaleString()}`, color: '#f87171' },
            { label: 'Gross Profit', value: `$${totalProfit.toLocaleString()}`, color: totalProfit >= 0 ? '#4ade80' : '#f87171' },
            { label: 'Margin', value: `${totalMargin}%`, color: totalMargin >= 20 ? '#4ade80' : totalMargin >= 10 ? '#fbbf24' : '#f87171' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          Collected: <span style={{ color: '#4ade80', fontWeight: 700 }}>${totalCollected.toLocaleString()}</span> · Outstanding: <span style={{ color: '#fbbf24', fontWeight: 700 }}>${(totalRevenue - totalCollected).toLocaleString()}</span>
        </div>
      </div>

      {/* Per job breakdown */}
      {jobCosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'white', borderRadius: 16, border: '2px dashed rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No jobs yet</div>
          <div style={{ fontSize: 13, color: '#9e9d99' }}>Add jobs, log crew time, and track materials to see profit per job</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {jobCosts.map(({ job, materialCost, laborCost, changeCost, totalCost, invoiced, collected, profit, margin }) => {
            const isSelected = selectedJob === job.id
            const profitColor = profit > 0 ? '#2d7a4f' : profit < 0 ? '#b83232' : '#9e9d99'
            const marginColor = margin >= 20 ? '#2d7a4f' : margin >= 10 ? '#b06e1a' : '#b83232'

            return (
              <div key={job.id}>
                <div onClick={() => setSelectedJob(isSelected ? null : job.id)} style={{ background: 'white', border: `1.5px solid ${isSelected ? '#0f0f0f' : 'rgba(0,0,0,0.07)'}`, borderRadius: 14, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{job.title}</div>
                      <div style={{ fontSize: 12, color: '#9e9d99' }}>
                        {job.client_name ? `${job.client_name} · ` : ''}
                        <span style={{ textTransform: 'capitalize' }}>{job.status?.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', marginBottom: 3 }}>Invoiced</div>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>${invoiced.toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', marginBottom: 3 }}>Costs</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#b83232' }}>${totalCost.toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', marginBottom: 3 }}>Profit</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: profitColor }}>{profit >= 0 ? '+' : ''}${profit.toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', marginBottom: 3 }}>Margin</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: marginColor }}>{margin}%</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: '#9e9d99', flexShrink: 0 }}>{isSelected ? '▲' : '▼'}</div>
                  </div>

                  {/* Progress bar */}
                  {invoiced > 0 && (
                    <div style={{ marginTop: 12, height: 6, background: '#f1ede6', borderRadius: 20, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (totalCost / invoiced) * 100)}%`, background: margin >= 20 ? '#2d7a4f' : margin >= 10 ? '#b06e1a' : '#b83232', borderRadius: 20, transition: 'width 0.3s' }} />
                    </div>
                  )}
                </div>

                {/* Expanded cost breakdown */}
                {isSelected && (
                  <div style={{ background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '0 0 14px 14px', padding: 20, marginTop: -4 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                      {[
                        { label: '🏗️ Materials', value: materialCost, sub: `${materials.filter(m => m.job_id === job.id).length} items` },
                        { label: '👷 Labor', value: laborCost, sub: `${crewTime.filter(c => c.job_id === job.id).reduce((s: number, c: any) => s + (c.hours || 0), 0)}h logged` },
                        { label: '🔄 Change Orders', value: changeCost, sub: `${changes.filter(c => c.job_id === job.id).length} changes` },
                      ].map(item => (
                        <div key={item.label} style={{ background: 'white', borderRadius: 10, padding: '14px 16px' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{item.label}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 3 }}>${item.value.toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: '#9e9d99' }}>{item.sub}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: 'white', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>💵 Collected</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#2d7a4f' }}>${collected.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: '#9e9d99' }}>of ${invoiced.toLocaleString()} invoiced</div>
                      </div>
                      <div style={{ background: profit >= 0 ? '#edf5f0' : '#fdf0f0', borderRadius: 10, padding: '14px 16px', border: `1px solid ${profit >= 0 ? 'rgba(45,122,79,0.2)' : 'rgba(184,50,50,0.2)'}` }}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: profit >= 0 ? '#1a4d31' : '#6e1a1a' }}>
                          {profit >= 0 ? '✅ Profitable' : '⚠️ Over Budget'}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: profit >= 0 ? '#2d7a4f' : '#b83232' }}>{profit >= 0 ? '+' : ''}${profit.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: profit >= 0 ? '#2d7a4f' : '#b83232' }}>{margin}% margin</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
