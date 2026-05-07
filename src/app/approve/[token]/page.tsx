import { createServerSupabase } from '@/lib/supabase'
import { ApprovalClient } from './ApprovalClient'

export default async function ApprovalPage({ params }: { params: { token: string } }) {
  const supabase = createServerSupabase()

  const { data: change } = await supabase
    .from('change_orders')
    .select('*, projects(name, address)')
    .eq('approval_token', params.token)
    .single()

  if (!change) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Link not found</div>
        <div style={{ fontSize: 14, color: '#9e9d99' }}>This approval link is invalid or has expired.</div>
      </div>
    </div>
  )

  return <ApprovalClient change={change} token={params.token} />
}
