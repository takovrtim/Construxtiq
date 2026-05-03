'use client'

import { useState } from 'react'

interface Props {
  projectId: string
}

export function ClientShareButton({ projectId }: Props) {
  const [loading, setLoading] = useState(false)
  const [url, setUrl]         = useState('')
  const [copied, setCopied]   = useState(false)

  async function generateLink() {
    setLoading(true)
    try {
      const res  = await fetch('/api/client-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })
      const json = await res.json()
      if (json.success) setUrl(json.url)
    } catch {
      // silent
    }
    setLoading(false)
  }

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (url) return (
    <div style={{ background: '#edf5f0', border: '1px solid rgba(45,122,79,0.2)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', color: '#1a4d31', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
      <button onClick={copy} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: 'none', background: copied ? '#2d7a4f' : '#0f0f0f', color: 'white', fontFamily: 'inherit', flexShrink: 0 }}>
        {copied ? '✓ Copied!' : 'Copy Link'}
      </button>
    </div>
  )

  return (
    <button
      onClick={generateLink}
      disabled={loading}
      style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: loading ? 'not-allowed' : 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}
    >
      {loading ? '⏳ Generating...' : '🔗 Share with Client'}
    </button>
  )
}
